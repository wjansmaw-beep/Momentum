import { useNearbyStory } from '../guide/useNearbyStory';
import { NearbyStory } from '../guide/NearbyStory';
import { ImageCredit } from '../ImageCredit';
import { EditorialDisclosure } from '../editorial';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ImageStyle,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { CommonActions, StackActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { buildExperienceGuide } from '../../guidance/experienceGuide';
import { verifyRouteBeforeHandoff } from '../../routing/routeIntelligence';
import { palettes, schemeStyles, typography } from '../../design/theme';
import { impactLight, impactMedium } from '../../design/haptics';
import { CoverImage, ImageShade } from '../CoverImage';
import { FlowFrame } from '../frames';
import { styles } from '../styles/appStyles';
import { defaultRegion, useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';
import { resolveSunTimes } from '../now-v2/nowModel';
import { guideProgress, guideState } from '../now-v2/guideModel';
import {
  LivingWorldBriefing,
  briefingInterests,
  loadLivingWorldBriefing,
} from '../../liveworld/livingWorldBriefing';
import { briefingSourceLine } from '../../liveworld/briefingFacts';
import { chapterIds, restoreAdaptiveGuide, supportsAdaptiveGuide } from '../../guidance/adaptiveGuide';
import { DiscoverChapter, GuideChapterMenu, GuideModeBar, GuideModeScene } from '../guide/AdaptiveGuide';
import { currentPlace, currentDestination } from '../../guidance/placeInformation';

// One Guide owns the current chapter, presentation mode and session.
// Observation and narration stay in the Guide; no separate phone-away screen.

export function GuideScreen() {
  const { selected: experience, personalProfile: personal, activeSession, sessionSaveError, retrySessionSave, updateLocationStories, updatePresenceStep, updateGuideMode, toggleCurrentGuideTask, presenceBack, finishPresence, discardSession, liveWorld, prototypeContext } = useApp();
  const adaptive = supportsAdaptiveGuide(experience);
  const adaptiveState = restoreAdaptiveGuide(experience, activeSession?.experienceId === experience.id ? activeSession.adaptiveGuide : undefined, activeSession?.stepIndex ?? 0);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const company = activeSession?.company ?? personal.defaultCompany;
  const guideDepth = activeSession?.guideDepth ?? 'guide';
  const shared = activeSession?.shared;
  const initialStep = adaptive ? Math.max(0, chapterIds(experience).indexOf(adaptiveState.chapterId)) : activeSession?.experienceId === experience.id ? activeSession.stepIndex : 0;
  const onStepChange = (stepIndex: number) => updatePresenceStep(stepIndex);
  const onFinish = () => {
    // Het moment is bewust afgerond: de reset in Remember (bewaren → Boek,
    // overslaan → Nu) mag de Gids zonder tegenactie verwijderen.
    leavingRef.current = true;
    finishPresence();
    navigation.navigate('Remember');
  };
  const onDiscard = () => {
    impactLight();
    leavingRef.current = true;
    discardSession();
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Now' }] }));
  };
  const scrollRef = useRef<ScrollView>(null);
  const [stepIndex, setStepIndex] = useState(Math.min(initialStep, Math.max(0, experience.steps.length - 1)));
  const [remaining, setRemaining] = useState(experience.steps[Math.min(initialStep, Math.max(0, experience.steps.length - 1))]?.seconds ?? 0);
  const [timerRunning, setTimerRunning] = useState(false);
  const nearby = useNearbyStory(experience, stepIndex, adaptiveState.locationStories === true, updateLocationStories);
  const nearbyView = <NearbyStory guide={nearby} onSelect={index => { setStepIndex(index); updateGuideMode('discover'); }} />;
  const [deepOpen, setDeepOpen] = useState(false);
  const [factsOpen, setFactsOpen] = useState(false);
  const [handoffStatus, setHandoffStatus] = useState('');
  const current = experience.steps[stepIndex] ?? { title: experience.presenceTitle, instruction: experience.presenceCue };
  const routePoint = currentDestination(experience, current);
  const routeTarget = currentPlace(experience, current)?.address || (routePoint ? String(routePoint.latitude) + ',' + String(routePoint.longitude) : undefined);
  const editorialComposition = current.editorial?.composition === 'editorial-place';
  const insightVisible = guideDepth !== 'quiet' && current.insight && (guideDepth === 'deep' || personal.guidanceBalance > -0.2) && !personal.mutedInsightTopics.includes(current.insight.topic) && !personal.mutedInsightExperienceIds.includes(experience.id);
  const isLast = stepIndex >= experience.steps.length - 1;
  const unfilteredGuide = buildExperienceGuide(experience, stepIndex);
  const insightAllowed = (insight: NonNullable<typeof current.insight>) => !personal.mutedInsightTopics.includes(insight.topic) && !personal.mutedInsightExperienceIds.includes(experience.id);
  const guide = { ...unfilteredGuide, currentInsight: unfilteredGuide.currentInsight && insightAllowed(unfilteredGuide.currentInsight) ? unfilteredGuide.currentInsight : undefined, furtherInsights: unfilteredGuide.furtherInsights.filter(insightAllowed), moments: unfilteredGuide.moments.filter((moment) => insightAllowed(moment.insight)) };

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setRemaining(current.seconds ?? 0);
    setTimerRunning(false);
    setHandoffStatus('');
    onStepChange(stepIndex);
  }, [current.seconds, stepIndex]);

  useEffect(() => {
    if (!timerRunning || remaining <= 0) return;
    const timer = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [remaining, timerRunning]);

  const leavingRef = useRef(false);
  const onBack = () => {
    leavingRef.current = true;
    presenceBack();
    navigation.dispatch(StackActions.replace('Prepare'));
  };
  useEffect(() => navigation.addListener('beforeRemove', (event) => {
    if (leavingRef.current) return;
    event.preventDefault();
    onBack();
  }), [navigation]);

  const openHandoff = async () => {
    if (!routeTarget) { setHandoffStatus('Er is geen gecontroleerde bestemming voor deze ervaring.'); return; }
    const plan = experience.routePlan;
    if (plan?.expiresAt && (!Number.isFinite(Date.parse(plan.expiresAt)) || Date.parse(plan.expiresAt) <= Date.now())) {
      setHandoffStatus('Deze actuele kans is verlopen. Ga terug en vernieuw de Living World-bronnen voordat je vertrekt.');
      return;
    }
    if (plan) {
      setHandoffStatus('Route en tijdsbudget worden gecontroleerd…');
      const check = await verifyRouteBeforeHandoff(plan);
      if (check.state === 'over-budget') {
        setHandoffStatus(check.detail);
        return;
      }
      setHandoffStatus(check.detail);
    }
    const source = plan?.source ? `${plan.source.latitude},${plan.source.longitude}` : undefined;
    const destination = routeTarget;
    const params = new URLSearchParams({ destination, mode: plan?.mode ?? 'walking' });
    if (source) params.set('source', source);
    const url = `https://maps.apple.com/directions?${params.toString()}`;
    await Linking.openURL(url).catch(() => setHandoffStatus('Kaarten kon niet worden geopend. Controleer de bestemming handmatig.'));
  };
  // Bladeren is altijd toegestaan — ook met een lopende timer. De timer is
  // hulp bij de stap, geen poort ervoor; wie door wil, bladert rustig door.
  const next = () => {
    if (isLast) onFinish();
    else {
      impactLight(); setStepIndex((value) => value + 1);
      if (adaptive && current.editorial) updateGuideMode('navigate');
    }
  };
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  // ——— Voortgang en gidsregels lopen mee met de klok (30s-tick). ———
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const weather = liveWorld?.weather;
  const sun = useMemo(
    () => resolveSunTimes(weather, liveWorld?.coordinates ?? defaultRegion.coordinates, now),
    // Zontijden veranderen per dag, niet per klok-tick — memo op datum + bron.
    [weather?.sunrise, weather?.sunset, liveWorld?.coordinates, now.toDateString()],
  );
  const progress = guideProgress(now, experience, activeSession, stepIndex);
  const guideInfo = guideState(now, sun, weather, experience, activeSession, stepIndex, guideDepth);
  const activeEvidence = guide.evidence.filter((item) => item.freshness === 'current');
  const observedLabel = (value: string) => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString('nl-NL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'tijd onbekend';
  };

  // ——— ADR-068 (addendum) · De wereld van dit moment, onderweg ———
  // Schaarse triggers, nooit polling: bij aanvang van de ervaring en bij elke
  // stapwissel vraagt dezelfde briefing-route 2–3 zinnen die juist deze stap
  // aan echte feiten verbinden. De cachesleutel neemt de stap mee (15 min per
  // ervaring+stap+feitset). States: laden (rustige placeholder) → live (zinnen
  // met bron-labels) → afwezig bij falen — de stappen blijven altijd staan.
  const [guideBriefing, setGuideBriefing] = useState<{ state: 'loading' } | { state: 'live'; value: LivingWorldBriefing } | null>(null);
  const currentStepTitle = current.title;
  useEffect(() => {
    if (experience.referenceVisit || experience.kind !== 'outside' || !liveWorld) { setGuideBriefing(null); return; }
    let active = true;
    setGuideBriefing({ state: 'loading' });
    loadLivingWorldBriefing({ experience, snapshot: liveWorld, dayPart: prototypeContext.dayPart, step: { index: stepIndex, title: currentStepTitle }, interests: briefingInterests(personal) })
      .then((result) => {
        if (!active) return;
        setGuideBriefing(result.status === 'live' ? { state: 'live', value: result.briefing } : null);
      })
      .catch(() => { if (active) setGuideBriefing(null); });
    return () => { active = false; };
  }, [experience.id, stepIndex, currentStepTitle, liveWorld?.retrievedAt]);

  if (adaptive && adaptiveState.mode !== 'discover') return <FlowFrame>
    <View style={styles.flowScreen}>
      {!!sessionSaveError && <View><Text accessibilityRole="alert" style={gd.caution}>{sessionSaveError}</Text><Pressable accessibilityRole="button" onPress={retrySessionSave} style={gd.quietAction}><Text style={gd.quietActionText}>Voortgang opnieuw opslaan</Text></Pressable></View>}
      {!!current.seconds && <Pressable accessibilityRole="button" accessibilityLabel={timerRunning ? 'Pauzeer timer' : 'Start timer'}
        accessibilityState={{ disabled: remaining === 0 }} disabled={remaining === 0} onPress={() => setTimerRunning(!timerRunning)} style={gd.timerRow}>
        <Text style={gd.timerValue}>{formatTime(remaining)}</Text><Text style={gd.rowTitle}>{remaining === 0 ? 'Timer afgerond' : timerRunning ? 'Pauzeer' : 'Start timer'}</Text>
      </Pressable>}
      <GuideChapterMenu experience={experience} index={stepIndex} onSelect={setStepIndex} />
      <GuideModeBar mode={adaptiveState.mode} onChange={updateGuideMode} />
      <GuideModeScene key={adaptiveState.chapterId} mode={adaptiveState.mode} experience={experience} step={current} index={stepIndex}
        onDiscover={() => updateGuideMode('discover')} onRoute={openHandoff}
        onBack={onBack} onFinish={onFinish} routeStatus={handoffStatus} nearby={nearbyView} />
    </View>
  </FlowFrame>;
  return (
    <FlowFrame>
    <View style={styles.flowScreen}>
    <ScrollView ref={scrollRef} contentContainerStyle={[styles.flowScroll, gd.scroll, adaptive && { paddingHorizontal: 0 }]} showsVerticalScrollIndicator={false}>
      {!!sessionSaveError && <View><Text accessibilityRole="alert" style={gd.caution}>{sessionSaveError}</Text><Pressable accessibilityRole="button" onPress={retrySessionSave} style={gd.quietAction}><Text style={gd.quietActionText}>Voortgang opnieuw opslaan</Text></Pressable></View>}
      {/* Kop: terug naar Voorpret, naam "Gids", kaart-handoff (de routeapp
          blijft route-eigenaar; de in-app kaart woont alleen in Voorpret). */}
      <View style={gd.head}>
        <Pressable accessibilityRole="button" accessibilityLabel="Terug naar de voorbereiding" onPress={() => { impactLight(); onBack(); }} style={gd.iconbtn}>
          <Feather name="arrow-left" size={16} color={gd.inkSolid as string} />
        </Pressable>
        <View style={styles.flex}>
          <Text style={gd.headTitle}>Gids</Text>
          <Text style={gd.headSub}>{experience.referenceVisit ? 'Op je eigen tempo' : `${experience.duration} min`} · {company === 'solo' ? 'alleen' : company === 'family' ? 'met gezin' : 'samen'}</Text>
        </View>
        {!!routeTarget && <Pressable accessibilityRole="button" accessibilityLabel={adaptive ? 'Bekijk deze plek op de kaart' : 'Open route in Kaarten'} onPress={adaptive ? () => updateGuideMode('navigate') : openHandoff} style={gd.iconbtn}>
          <Feather name="map-pin" size={16} color={gd.inkSolid as string} />
        </Pressable>}
      </View>

      {adaptive && <><GuideChapterMenu experience={experience} index={stepIndex} onSelect={setStepIndex} /><GuideModeBar mode="discover" onChange={updateGuideMode} /></>}
      <View style={{ marginHorizontal: 20 }}>{nearbyView}</View>
      {/* De cover draagt de beleving: beeld, serif-titel en voortgang uit
          echte sessiedata (tijd- en stapgebaseerd — er is geen GPS-tracking,
          dus nooit een verzonnen kilometerstand). */}
      {!adaptive && !editorialComposition && <><CoverImage uri={experience.image} style={gd.cover} imageStyle={gd.coverRound}>
        <ImageShade />
        <View style={gd.coverCopy}>
          <Text style={[gd.coverTitle, styles.onImageText]}>{experience.title}</Text>
          {adaptive ? <Text style={gd.coverProgressSuffix}>Hoofdstuk {stepIndex + 1} van {experience.steps.length}</Text> : <View style={gd.coverProgressRow}>
            <Text style={[gd.coverProgressValue, styles.onImageText]}>{progress.headline} <Text style={gd.coverProgressSuffix}>{progress.suffix}</Text></Text>
            <Text style={gd.coverProgressSub}>{progress.sub}</Text>
          </View>}
          <View style={gd.coverBarTrack}>
            <View style={[gd.coverBarFill, { width: `${Math.round((adaptive ? (stepIndex + 1) / experience.steps.length : progress.fraction) * 100)}%` }]} />
          </View>
        </View>
      </CoverImage><ImageCredit uri={experience.image} /></>}

      {/* De huidige stap — de enige plek waar de staptekst staat. */}
      <View style={[gd.card, adaptive && { borderWidth: 0, borderRadius: 0, padding: 0, marginHorizontal: 20, paddingHorizontal: 0, paddingVertical: 0, backgroundColor: 'transparent' }]}>
        {!adaptive && !editorialComposition && <View style={gd.cardHead}>
          <Feather name="compass" size={15} color={gd.accentSolid as string} />
          <Text style={gd.cardTitle}>{experience.steps.length > 1 ? `Stap ${stepIndex + 1} van ${experience.steps.length}` : experience.presenceMode === 'quiet' ? 'Rustige begeleiding' : 'Onderweg'}</Text>
          {experience.steps.length <= 1 ? <Text style={gd.cardHeadRight}>{company === 'solo' ? 'alleen' : company === 'family' ? 'met gezin' : 'samen'}</Text> : null}
        </View>
        }
        {shared && <View style={gd.togetherRow}>
          <View style={gd.togetherAvatars}>{shared.participants.filter((participant) => participant.status === 'ready').map((participant) => <View key={participant.id} style={gd.togetherAvatar}><Text style={styles.participantAvatarText}>{participant.name.slice(0, 1).toUpperCase()}</Text></View>)}</View>
          <View style={styles.flex}><Text style={gd.rowTitle}>Eén gedeelde ervaring</Text><Text style={gd.rowSub}>{shared.coordination === 'meet-there' ? 'Jullie ontmoetten elkaar bij het begin.' : 'Jullie begonnen samen.'} Deze gids loopt alleen op dit toestel.</Text></View>
        </View>}
        {adaptive ? <DiscoverChapter key={adaptiveState.chapterId} step={current} index={stepIndex} total={experience.steps.length}
          completed={adaptiveState.completedTaskIds.includes(adaptiveState.chapterId)} onToggle={toggleCurrentGuideTask} onObserve={() => updateGuideMode('immerse')} experience={experience} onNavigate={() => updateGuideMode('navigate')} showInsight={Boolean(insightVisible)} /> : <>
        <Text style={gd.stepTitle}>{current.title}</Text>
        {current.meta && <View style={gd.stepMetaPill}><Text style={gd.stepMetaText}>{current.meta}</Text></View>}
        <Text style={gd.stepCue}>{current.instruction}</Text>
        {insightVisible && <View style={gd.insightCard}>
          <Text style={gd.insightEyebrow}>KLEIN INZICHT · ALLEEN ALS HET HELPT</Text>
          <Text style={gd.insightTitle}>{current.insight?.title}</Text>
          <Text style={gd.insightBody}>{current.insight?.body}</Text>
          {current.insight?.sourceUrl ? <Pressable accessibilityRole="link" onPress={() => Linking.openURL(current.insight!.sourceUrl!).catch(() => undefined)}><Text style={[gd.insightSource, { color: gd.accentSolid as string }]}>{current.insight.sourceLabel} · Bekijk bron <Ionicons name="open-outline" size={11} color={gd.accentSolid as string} /></Text></Pressable> : <Text style={gd.insightSource}>{current.insight?.sourceKind === 'live' ? 'Actuele bron' : current.insight?.sourceKind === 'curator' ? 'Plaatskennis' : 'Redactioneel'} · {current.insight?.sourceLabel}</Text>}
        </View>}
        </>}
        {current.seconds ? (
          <View style={gd.timerRow}>
            <View style={styles.flex}>
              <Text style={gd.timerValue}>{formatTime(remaining)}</Text>
              <Text style={gd.timerUnit}>{remaining === 0 ? 'KLAAR' : timerRunning ? 'LOOPT · JE MAG AL DOOR' : 'KLAAR OM TE STARTEN'}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={remaining === 0 ? 'Timer afgerond' : timerRunning ? 'Pauzeer timer' : 'Start timer'} accessibilityState={{ disabled: remaining === 0 }} onPress={() => remaining > 0 && setTimerRunning((value) => !value)} style={gd.timerControl}>
              {remaining === 0 ? <Feather name="check" size={14} color={gd.accentInkSolid as string} /> : <Text style={gd.timerControlText}>{timerRunning ? 'Pauze' : 'Start'}</Text>}
            </Pressable>
          </View>
        ) : null}
        {!adaptive && !!routeTarget && experience.presenceMode === 'handoff' && stepIndex === 0 && <Pressable accessibilityRole="button" onPress={openHandoff} style={gd.quietAction}><Feather name="navigation" size={13} color={gd.accentSolid as string} /><Text style={gd.quietActionText}>Open route in Kaarten</Text></Pressable>}
        {handoffStatus ? <Text style={gd.handoffStatus}>{handoffStatus}</Text> : null}
        <View style={gd.stepNavRow}>
          {stepIndex > 0 && <Pressable accessibilityRole="button" onPress={() => { impactLight(); setStepIndex((value) => Math.max(0, value - 1)); }} style={[gd.stepNavButton, adaptive && { borderWidth: 0, backgroundColor: "transparent", minHeight: 48 }]}><Text style={gd.stepNavText}>Vorige</Text></Pressable>}
          <Pressable
            accessibilityRole="button"
            onPress={next}
            style={[gd.stepNavButton, gd.stepNavPrimary, adaptive && { borderRadius: 10, minHeight: 48 }]}
          >
            <Text style={[gd.stepNavText, gd.stepNavPrimaryText]}>{isLast ? 'Ervaring afronden' : adaptive ? 'Volgend hoofdstuk' : 'Volgende stap'}</Text>
          </Pressable>
        </View>
        {!adaptive && !editorialComposition && <View style={gd.stepToolsRow}>
          {adaptive && <Pressable accessibilityRole="button" onPress={() => updateGuideMode('immerse')} style={gd.quietAction}><Feather name="headphones" size={18} color={gd.accentSolid as string} /><Text style={gd.quietActionText}>Beleef dit verhaal</Text></Pressable>}
          <Pressable accessibilityRole="button" accessibilityLabel={deepOpen ? 'Sluit de verdieping' : 'Open de verdieping'} accessibilityState={{ expanded: deepOpen }} onPress={() => { impactLight(); setDeepOpen((value) => !value); }} style={gd.quietAction}><Feather name="book-open" size={13} color={gd.accentSolid as string} /><Text style={gd.quietActionText}>Verdieping</Text></Pressable>
        </View>

        }
        {adaptive && <Pressable accessibilityRole="button" accessibilityState={{ expanded: deepOpen }} onPress={() => setDeepOpen(!deepOpen)} style={[gd.quietAction, { borderWidth: 0, borderRadius: 0, backgroundColor: "transparent", paddingHorizontal: 0 }]}><Text style={gd.quietActionText}>Praktisch en omgeving {deepOpen ? '−' : '+'}</Text></Pressable>}
        {/* VERDIEPING — de vroegere gids-sheet als uitklap van deze stap.
            Staptekst en het huidige inzicht staan al hierboven; hier wonen
            alleen wat de wereld nu laat zien, verdere momenten en praktisch. */}
        {deepOpen && <View style={gd.deep}>
          <View style={gd.deepDivider} />
          {guideDepth !== 'quiet' && activeEvidence.length ? <View style={gd.deepSection}>
            <Text style={gd.deepSectionTitle}>WAT DE WERELD NU LAAT ZIEN</Text>
            {activeEvidence.map((item) => <Pressable accessibilityRole="link" accessibilityLabel={`Open bron ${item.sourceName}`} key={`${item.sourceName}-${item.label}`} onPress={async () => { try { await Linking.openURL(item.sourceUrl); } catch { /* de ervaring blijft zonder deze bron bruikbaar */ } }} style={gd.evidenceItem}>
              <View style={[gd.evidenceDot, { backgroundColor: gd.accentSolid as string }]} />
              <View style={styles.flex}>
                <Text style={gd.rowTitle}>{item.label}</Text>
                <Text style={gd.evidenceMeta}>{item.sourceName} · {item.freshnessLabel} · {observedLabel(item.observedAt)}</Text>
                <Text style={[gd.evidenceMeta, { color: gd.accentSolid as string }]}>Bekijk bron <Ionicons name="open-outline" size={11} color={gd.accentSolid as string} /></Text>
              </View>
            </Pressable>)}
            <Text style={gd.caution}>Een waarneming of verwachting is context, geen garantie. Volg ter plaatse altijd actuele aanwijzingen.</Text>
          </View> : null}
          {guideDepth === 'deep' && guide.moments.length ? <View style={gd.deepSection}>
            <Text style={gd.deepSectionTitle}>GIDS MOMENTEN OM VERDER TE KIJKEN</Text>
            {guide.moments.map((moment, index) => <View key={`${moment.insight.topic}-${moment.insight.title}`} style={gd.momentItem}>
              <Text style={gd.momentEyebrow}>MOMENT {index + 1} · {moment.stage === 'begin' ? 'BIJ HET BEGIN' : moment.stage === 'afronding' ? 'BIJ DE AFRONDING' : 'ONDERWEG'}</Text>
              <Text style={gd.momentTitle}>{moment.insight.title}</Text>
              <Text style={gd.momentStep}>Hoort bij de stap “{moment.stepTitle}”.</Text>
              <Text style={gd.momentBody}>{moment.insight.body}</Text>
              {moment.insight.sourceUrl ? <Pressable accessibilityRole="link" onPress={() => Linking.openURL(moment.insight.sourceUrl!).catch(() => undefined)}><Text style={[gd.evidenceMeta, { color: gd.accentSolid as string }]}>{moment.insight.sourceLabel} · Bekijk bron <Ionicons name="open-outline" size={11} color={gd.accentSolid as string} /></Text></Pressable> : <Text style={gd.evidenceMeta}>{moment.insight.sourceKind === 'live' ? 'Actuele bron' : moment.insight.sourceKind === 'curator' ? 'Plaatskennis' : 'Redactioneel'} · {moment.insight.sourceLabel}</Text>}
            </View>)}
          </View> : null}
          {guideDepth === 'deep' && guide.practical.length ? <View style={gd.deepSection}>
            <Text style={gd.deepSectionTitle}>PRAKTISCH</Text>
            {guide.practical.map((item) => <View key={item} style={gd.practicalItem}><View style={[gd.evidenceDot, { backgroundColor: gd.accentSolid as string }]} /><Text style={[gd.rowSub, styles.flex]}>{item}</Text></View>)}
          </View> : null}
          {guideDepth === 'deep' && guide.evidence.some((item) => item.freshness !== 'current') ? <Text style={gd.expired}>Verlopen broninformatie is bewust niet als actuele aanwijzing getoond.</Text> : null}

          {/* Feiten & bronnen (ADR-056): de datarijen en de dekkingsverklaring
              blijven altijd één tik diep beschikbaar, nooit als hoofdtekst. */}
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: factsOpen }} accessibilityLabel="Feiten en bronnen" onPress={() => { impactLight(); setFactsOpen((value) => !value); }} style={gd.factsToggle}>
            <Feather name="list" size={13} color={gd.accentSolid as string} />
            <Text style={gd.factsToggleText}>Feiten & bronnen</Text>
            <Ionicons name={factsOpen ? 'chevron-up' : 'chevron-down'} size={15} color={gd.ink2Solid as string} />
          </Pressable>
          {factsOpen && <View style={gd.factsBody}>
            {guideInfo.rows.map((row, index) => (
              <View key={`${row.title}-${index}`} style={[gd.row, index > 0 && gd.rowBorder]}>
                <View style={gd.rowIcon}><Feather name={row.icon} size={15} color={gd.accentSolid as string} /></View>
                <View style={styles.flex}>
                  <Text style={gd.rowTitle}>{row.title}</Text>
                  {row.sub ? <Text style={gd.rowSub}>{row.sub}</Text> : null}
                </View>
                {row.trailing ? <Text style={gd.rowTrailing}>{row.trailing}</Text> : null}
              </View>
            ))}
            <Text style={gd.coverage}>{guide.coverageLabel}{guide.compositionLabel ? ` · ${guide.compositionLabel}` : ''}.</Text>
          </View>}
        </View>}
      </View>

      {/* ADR-068 · Nu om je heen: de gids verbindt deze stap aan echte feiten
          van dit moment, elke zin met zichtbare bron-labels. Laden = rustige
          placeholder; falen = het blok valt weg, nooit een kapot scherm. */}
      {guideBriefing?.state === 'loading' ? (
        <View style={[gd.card, adaptive && { borderWidth: 0, borderRadius: 0, padding: 0, marginHorizontal: 20, paddingHorizontal: 0, paddingVertical: 0, backgroundColor: 'transparent' }]}>
          <View style={gd.cardHead}>
            <Feather name="globe" size={15} color={gd.accentSolid as string} />
            <Text style={gd.cardTitle}>Nu om je heen</Text>
          </View>
          <Text style={gd.briefingLoading}>Feiten van dit moment worden opgehaald…</Text>
        </View>
      ) : guideBriefing?.state === 'live' ? (
        <View style={[gd.card, adaptive && { borderWidth: 0, borderRadius: 0, padding: 0, marginHorizontal: 20, paddingHorizontal: 0, paddingVertical: 0, backgroundColor: 'transparent' }]}>
          <View style={gd.cardHead}>
            <Feather name="globe" size={15} color={gd.accentSolid as string} />
            <Text style={gd.cardTitle}>Nu om je heen</Text>
          </View>
          {guideBriefing.value.sentences.map((sentence, index) => (
            <View key={`${sentence.text.slice(0, 24)}-${index}`} style={[gd.briefingRow, index > 0 && gd.rowBorder]}>
              <Text style={gd.briefingText}>{sentence.text}</Text>
              <Text style={gd.briefingSource}>{briefingSourceLine(sentence, guideBriefing.value.facts)}</Text>
            </View>
          ))}
          <Text style={gd.briefingFootnote}>
            {guideBriefing.value.mode === 'model' ? 'Zinnen door de generator, uitsluitend uit de feiten hierboven.' : 'Feiten letterlijk uit de live bronnen (generator niet actief).'}
          </Text>
        </View>
      ) : null}

      {/* Afronden: rustige ghost-knop naar de Remember-flow. Daarnaast de
          enige manier om een ervaring ongebruikt te verlaten. */}
      <View style={{ marginHorizontal: 20 }}><EditorialDisclosure title="Deze ervaring afsluiten"><Pressable
        accessibilityRole="button"
        accessibilityLabel="Moment afronden"
        onPress={() => { impactMedium(); onFinish(); }}
        style={({ pressed }) => [gd.ghost, pressed && gd.pressed]}
      >
        <Feather name="check" size={15} color={gd.inkSolid as string} />
        <Text style={gd.ghostText}>Moment afronden</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Sluit deze ervaring rustig af" onPress={onDiscard} style={gd.discard}>
        <Text style={gd.discardText}>Sluit deze ervaring rustig af</Text>
      </Pressable></EditorialDisclosure></View>
    </ScrollView>

    </View>
    </FlowFrame>
  );
}

// Visuele taal (concept v2): zelfde palet als R1–R4 — near-black podium,
// glaspanelen, accentgroen uit de #34c772-familie, serif display voor titels
// en de voortgangs-waarde. De lichte sibling volgt de dagpalet-tokens
// (ADR-064); alle tekst/achtergrond-paren houden WCAG AA. Detectie via
// palet-identiteit, zoals schemeStyles het aanlevert.
const gd = schemeStyles(({ colors: schemeColors }) => {
  const evening = schemeColors === palettes.dark.colors;
  const palette = evening
    ? {
        ink: schemeColors.bone,
        ink2: schemeColors.muted,
        ink3: schemeColors.muted,
        accent: schemeColors.accent,
        accentInk: schemeColors.onAccent,
        glass: schemeColors.panel,
        glass2: schemeColors.panelRaised,
        line: schemeColors.line,
        track: schemeColors.panelRaised,
        rowLine: schemeColors.line,
        iconTile: schemeColors.panelRaised,
        quietBorder: schemeColors.line,
        glow: schemeColors.line,
      }
    : {
        ink: schemeColors.bone,
        ink2: schemeColors.muted,
        ink3: schemeColors.muted,
        accent: schemeColors.accent,
        accentInk: schemeColors.onAccent,
        glass: schemeColors.panel,
        glass2: schemeColors.panelRaised,
        line: schemeColors.line,
        track: schemeColors.panelRaised,
        rowLine: schemeColors.line,
        iconTile: schemeColors.panelRaised,
        quietBorder: schemeColors.line,
        glow: schemeColors.line,
      };
  type GidsStyles = {
    inkSolid: string;
    ink2Solid: string;
    accentSolid: string;
    accentInkSolid: string;
    scroll: ViewStyle;
    head: ViewStyle;
    headTitle: TextStyle;
    headSub: TextStyle;
    iconbtn: ViewStyle;
    cover: ViewStyle;
    coverRound: ImageStyle;
    coverCopy: ViewStyle;
    coverTitle: TextStyle;
    coverProgressRow: ViewStyle;
    coverProgressValue: TextStyle;
    coverProgressSuffix: TextStyle;
    coverProgressSub: TextStyle;
    coverBarTrack: ViewStyle;
    coverBarFill: ViewStyle;
    card: ViewStyle;
    cardHead: ViewStyle;
    cardTitle: TextStyle;
    cardHeadRight: TextStyle;
    togetherRow: ViewStyle;
    togetherAvatars: ViewStyle;
    togetherAvatar: ViewStyle;
    stepTitle: TextStyle;
    stepMetaPill: ViewStyle;
    stepMetaText: TextStyle;
    stepCue: TextStyle;
    insightCard: ViewStyle;
    insightEyebrow: TextStyle;
    insightTitle: TextStyle;
    insightBody: TextStyle;
    insightSource: TextStyle;
    timerRow: ViewStyle;
    timerValue: TextStyle;
    timerUnit: TextStyle;
    timerControl: ViewStyle;
    timerControlText: TextStyle;
    handoffStatus: TextStyle;
    stepNavRow: ViewStyle;
    stepNavButton: ViewStyle;
    stepNavPrimary: ViewStyle;
    stepNavText: TextStyle;
    stepNavPrimaryText: TextStyle;
    stepToolsRow: ViewStyle;
    quietAction: ViewStyle;
    quietActionText: TextStyle;
    deep: ViewStyle;
    deepDivider: ViewStyle;
    deepSection: ViewStyle;
    deepSectionTitle: TextStyle;
    evidenceItem: ViewStyle;
    evidenceDot: ViewStyle;
    evidenceMeta: TextStyle;
    caution: TextStyle;
    momentItem: ViewStyle;
    momentEyebrow: TextStyle;
    momentTitle: TextStyle;
    momentStep: TextStyle;
    momentBody: TextStyle;
    practicalItem: ViewStyle;
    expired: TextStyle;
    factsToggle: ViewStyle;
    factsToggleText: TextStyle;
    factsBody: ViewStyle;
    row: ViewStyle;
    rowBorder: ViewStyle;
    rowIcon: ViewStyle;
    rowTitle: TextStyle;
    rowSub: TextStyle;
    rowTrailing: TextStyle;
    coverage: TextStyle;
    briefingLoading: TextStyle;
    briefingRow: ViewStyle;
    briefingText: TextStyle;
    briefingSource: TextStyle;
    briefingFootnote: TextStyle;
    ghost: ViewStyle;
    ghostText: TextStyle;
    discard: ViewStyle;
    discardText: TextStyle;
    pressed: ViewStyle;
  };
  const stylesDef: GidsStyles = {
    inkSolid: palette.ink,
    ink2Solid: palette.ink2,
    accentSolid: palette.accent,
    accentInkSolid: palette.accentInk,
    scroll: { paddingBottom: 40 },
    head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 12 },
    headTitle: { fontSize: 14.5, fontWeight: '600', color: palette.ink },
    headSub: { fontSize: 11.5, color: palette.ink2, marginTop: 1 },
    iconbtn: {
      width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
      backgroundColor: palette.glass, borderWidth: 1, borderColor: palette.line,
    },
    cover: { marginHorizontal: 12, minHeight: 280, justifyContent: 'flex-end' },
    coverRound: { borderRadius: 26 },
    coverCopy: { padding: 18, gap: 8 },
    coverTitle: { fontFamily: typography.displayFamilyMedium, fontWeight: '400', fontSize: 27, lineHeight: 32 },
    coverProgressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginTop: 4 },
    coverProgressValue: { fontFamily: typography.displayFamilyMedium, fontWeight: '400', fontSize: 19 },
    coverProgressSuffix: { fontFamily: undefined, fontSize: 12, fontWeight: '600', color: 'rgba(245,244,240,0.85)' },
    coverProgressSub: { fontSize: 11, fontWeight: '500', color: 'rgba(245,244,240,0.85)', flexShrink: 1, textAlign: 'right' },
    coverBarTrack: { marginTop: 6, height: 5, borderRadius: 999, backgroundColor: 'rgba(245,244,240,0.28)', overflow: 'hidden' },
    coverBarFill: {
      height: '100%', borderRadius: 999, backgroundColor: palette.accent,
      shadowColor: palette.accent, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
    },
    card: {
      marginHorizontal: 12, marginTop: 10, borderRadius: 22, paddingHorizontal: 15, paddingVertical: 14,
      backgroundColor: palette.glass, borderWidth: 1, borderColor: palette.line,
    },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
    cardTitle: { fontSize: 11, letterSpacing: 1.6, fontWeight: '700', color: palette.ink2, textTransform: 'uppercase', flex: 1 },
    cardHeadRight: { fontSize: 11, color: palette.ink2, fontWeight: '500' },
    togetherRow: {
      flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 10,
      paddingVertical: 9, paddingHorizontal: 11, borderRadius: 14,
      backgroundColor: palette.glass2, borderWidth: 1, borderColor: palette.line,
    },
    togetherAvatars: { flexDirection: 'row' },
    togetherAvatar: {
      width: 26, height: 26, borderRadius: 13, marginLeft: -6,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: palette.iconTile, borderWidth: 1, borderColor: palette.line,
    },
    stepTitle: { fontFamily: typography.displayFamilyMedium, fontWeight: '400', fontSize: 24, lineHeight: 29, color: palette.ink },
    stepMetaPill: {
      alignSelf: 'flex-start', marginTop: 8, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10,
      borderWidth: 1, borderColor: palette.quietBorder,
    },
    stepMetaText: { fontSize: 11, fontWeight: '600', color: palette.ink },
    stepCue: { fontSize: 13, lineHeight: 19, color: palette.ink2, marginTop: 8 },
    insightCard: {
      marginTop: 12, borderRadius: 16, padding: 12,
      backgroundColor: palette.glass2, borderWidth: 1, borderColor: palette.line,
    },
    insightEyebrow: { fontSize: 9.5, letterSpacing: 1.8, fontWeight: '700', color: palette.accent },
    insightTitle: { fontSize: 13.5, fontWeight: '600', color: palette.ink, marginTop: 5 },
    insightBody: { fontSize: 12, lineHeight: 18, color: palette.ink2, marginTop: 4 },
    insightSource: { fontSize: 11, color: palette.ink3, marginTop: 7 },
    timerRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12,
      borderRadius: 16, paddingVertical: 10, paddingHorizontal: 13,
      borderWidth: 1, borderColor: palette.quietBorder,
    },
    timerValue: { fontFamily: typography.displayFamilyMedium, fontSize: 22, color: palette.ink },
    timerUnit: { fontSize: 9.5, letterSpacing: 1.4, fontWeight: '700', color: palette.ink2, marginTop: 2 },
    timerControl: {
      borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16,
      backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center', minWidth: 76,
    },
    timerControlText: { fontSize: 12.5, fontWeight: '700', color: palette.accentInk },
    handoffStatus: { fontSize: 11.5, lineHeight: 17, color: palette.accent, marginTop: 10 },
    stepNavRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
    stepNavButton: {
      flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999,
      paddingVertical: 11, backgroundColor: palette.glass2, borderWidth: 1, borderColor: palette.line,
    },
    stepNavPrimary: { backgroundColor: palette.accent, borderColor: palette.accent },
    stepNavText: { fontSize: 12.5, fontWeight: '600', color: palette.ink },
    stepNavPrimaryText: { color: palette.accentInk, fontWeight: '700' },
    stepToolsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    quietAction: {
      flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999,
      paddingVertical: 8, paddingHorizontal: 13, minHeight: 44, maxWidth: '100%', flexShrink: 1,
      backgroundColor: palette.glass2, borderWidth: 1, borderColor: palette.line,
    },
    quietActionText: { fontSize: 11.5, fontWeight: '600', color: palette.ink, flexShrink: 1 },
    deep: { marginTop: 12 },
    deepDivider: { height: 1, backgroundColor: palette.rowLine, marginBottom: 12 },
    deepSection: { marginBottom: 14, gap: 9 },
    deepSectionTitle: { fontSize: 10.5, letterSpacing: 1.4, fontWeight: '700', color: palette.accent, textTransform: 'uppercase' },
    evidenceItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    evidenceDot: { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
    evidenceMeta: { fontSize: 11, lineHeight: 15, color: palette.ink3, marginTop: 2 },
    caution: { fontSize: 11, lineHeight: 16, color: palette.accent, marginTop: 3 },
    momentItem: { gap: 6, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: palette.rowLine },
    momentEyebrow: { fontSize: 10, letterSpacing: 1.15, fontWeight: '700', color: palette.accent },
    momentTitle: { fontFamily: typography.displayFamilyMedium, fontSize: 17, lineHeight: 22, color: palette.ink },
    momentStep: { fontSize: 11.5, lineHeight: 16, color: palette.ink3, fontStyle: 'italic' },
    momentBody: { fontSize: 12.5, lineHeight: 19, color: palette.ink2 },
    practicalItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    expired: { fontSize: 11, lineHeight: 16, color: palette.ink3 },
    factsToggle: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2,
      borderRadius: 14, paddingVertical: 9, paddingHorizontal: 11,
      backgroundColor: palette.glass2, borderWidth: 1, borderColor: palette.line,
    },
    factsToggleText: { flex: 1, fontSize: 12, fontWeight: '600', color: palette.ink },
    factsBody: { marginTop: 10 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 7 },
    rowBorder: { borderTopWidth: 1, borderTopColor: palette.rowLine },
    rowIcon: {
      width: 32, height: 32, borderRadius: 11, backgroundColor: palette.iconTile,
      alignItems: 'center', justifyContent: 'center',
    },
    rowTitle: { fontSize: 13, fontWeight: '600', color: palette.ink },
    rowSub: { fontSize: 11, color: palette.ink2, marginTop: 1 },
    rowTrailing: { fontSize: 11.5, fontWeight: '600', color: palette.ink2 },
    coverage: { fontSize: 10.5, lineHeight: 15, color: palette.ink3, marginTop: 10, fontStyle: 'italic' },
    briefingLoading: { fontSize: 12, color: palette.ink2, fontWeight: '500', paddingVertical: 4 },
    briefingRow: { paddingVertical: 7, gap: 3 },
    briefingText: { fontSize: 13.5, lineHeight: 20, color: palette.ink, fontWeight: '500' },
    briefingSource: { fontSize: 9.5, lineHeight: 13, color: palette.ink2, fontWeight: '600' },
    briefingFootnote: { fontSize: 9.5, lineHeight: 13, color: palette.ink2, marginTop: 8, fontStyle: 'italic' },
    ghost: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      marginHorizontal: 12, marginTop: 14, borderRadius: 999, paddingVertical: 13,
      backgroundColor: palette.glass, borderWidth: 1, borderColor: palette.line,
    },
    ghostText: { fontSize: 13.5, fontWeight: '600', color: palette.ink },
    discard: { alignSelf: 'center', marginTop: 12, paddingVertical: 6, paddingHorizontal: 12 },
    discardText: { fontSize: 11.5, fontWeight: '500', color: palette.ink3 },
    pressed: { opacity: 0.92 },
  };
  return stylesDef;
});
