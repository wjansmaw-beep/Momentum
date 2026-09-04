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
import Reanimated from 'react-native-reanimated';
import { Experience } from '../../product/experienceModel';
import { SharedCapsuleState } from '../../sharing/sharedCapsule';
import { buildExperienceGuide } from '../../guidance/experienceGuide';
import { verifyRouteBeforeHandoff } from '../../routing/routeIntelligence';
import { palettes, schemeStyles, typography } from '../../design/theme';
import { impactLight, impactMedium } from '../../design/haptics';
import { useBreathing } from '../../design/motion';
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

// DE GIDS — het enige onderweg-scherm (vervolg op ADR-067, fase R4). De
// vroegere drie vormen van begeleiding — het Presence-scherm, de
// ExperienceGuidePanel-sheet en de PhoneAway-overlay — waren drie schermen
// voor één beleving. Nu zijn het drie toestanden van dezelfde stap:
//
// - STAP (standaard): coverfoto, serif-titel en voortgang zoals het oude
//   gids-paneel dat het mooiste deed; daaronder de huidige stap en de live
//   briefing "Nu om je heen" (ADR-068). Geen routekaart — die woont in
//   Voorpret; de kaart-handoff blijft via de kop.
// - VERDIEPING: de oude sheet-inhoud (wat de wereld nu laat zien,
//   gidsmomenten, praktisch) klappt uit ónder dezelfde stap. De disclosure
//   "Feiten & bronnen" houdt de datarijen en de dekkingsverklaring (ADR-056)
//   één tik diep beschikbaar.
// - TELEFOON WEG: het zwarte adem-scherm als dim-stand van díe stap; één tik
//   keert terug naar exact dezelfde stapweergave.
//
// Stappen zijn altijd bladerbaar: Vorige/Volgende worden nooit geblokkeerd —
// een lopende timer is een hulp, geen poort. De GIDS-tab opent dit scherm
// direct op de opgeslagen stap; de oude hervatkaart-GuideScreen is verdwenen.

export function GuideScreen() {
  const { selected: experience, personalProfile: personal, activeSession, updatePresenceStep, presenceBack, finishPresence, discardSession, liveWorld, prototypeContext } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const company = activeSession?.company ?? personal.defaultCompany;
  const guideDepth = activeSession?.guideDepth ?? 'guide';
  const shared = activeSession?.shared;
  const initialStep = activeSession?.experienceId === experience.id ? activeSession.stepIndex : 0;
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
  const [stepIndex, setStepIndex] = useState(Math.min(initialStep, Math.max(0, experience.steps.length - 1)));
  const [remaining, setRemaining] = useState(experience.steps[Math.min(initialStep, Math.max(0, experience.steps.length - 1))]?.seconds ?? 0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [phoneAway, setPhoneAway] = useState(false);
  const [deepOpen, setDeepOpen] = useState(false);
  const [factsOpen, setFactsOpen] = useState(false);
  const [handoffStatus, setHandoffStatus] = useState('');
  const current = experience.steps[stepIndex] ?? { title: experience.presenceTitle, instruction: experience.presenceCue };
  const insightVisible = guideDepth !== 'quiet' && current.insight && (guideDepth === 'deep' || personal.guidanceBalance > -0.2) && !personal.mutedInsightTopics.includes(current.insight.topic) && !personal.mutedInsightExperienceIds.includes(experience.id);
  const isLast = stepIndex >= experience.steps.length - 1;
  const unfilteredGuide = buildExperienceGuide(experience, stepIndex);
  const insightAllowed = (insight: NonNullable<typeof current.insight>) => !personal.mutedInsightTopics.includes(insight.topic) && !personal.mutedInsightExperienceIds.includes(experience.id);
  const guide = { ...unfilteredGuide, currentInsight: unfilteredGuide.currentInsight && insightAllowed(unfilteredGuide.currentInsight) ? unfilteredGuide.currentInsight : undefined, furtherInsights: unfilteredGuide.furtherInsights.filter(insightAllowed), moments: unfilteredGuide.moments.filter((moment) => insightAllowed(moment.insight)) };

  useEffect(() => {
    setRemaining(current.seconds ?? 0);
    setTimerRunning(false);
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
    if (phoneAway) { setPhoneAway(false); return; }
    onBack();
  }), [navigation, phoneAway]);

  const openHandoff = async () => {
    const plan = experience.routePlan;
    if (plan?.expiresAt && Date.parse(plan.expiresAt) <= Date.now()) {
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
    const destination = plan?.destination ? `${plan.destination.latitude},${plan.destination.longitude}` : plan?.destinationName ?? experience.title;
    const params = new URLSearchParams({ destination, mode: plan?.mode ?? 'walking' });
    if (source) params.set('source', source);
    const url = `https://maps.apple.com/directions?${params.toString()}`;
    await Linking.openURL(url).catch(() => setHandoffStatus('Kaarten kon niet worden geopend. Controleer de bestemming handmatig.'));
  };
  // Bladeren is altijd toegestaan — ook met een lopende timer. De timer is
  // hulp bij de stap, geen poort ervoor; wie door wil, bladert rustig door.
  const next = () => {
    if (isLast) onFinish();
    else { impactLight(); setStepIndex((value) => value + 1); }
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
    if (experience.kind !== 'outside' || !liveWorld) { setGuideBriefing(null); return; }
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

  if (phoneAway) return <FlowFrame statusBar="light"><PhoneAwayView experience={experience} cue={current.title} seconds={current.seconds} remaining={remaining} formatTime={formatTime} shared={shared} onReopen={() => setPhoneAway(false)} /></FlowFrame>;
  return (
    <FlowFrame statusBar="light">
    <View style={styles.flowScreen}>
    <ScrollView contentContainerStyle={[styles.flowScroll, gd.scroll]} showsVerticalScrollIndicator={false}>
      {/* Kop: terug naar Voorpret, naam "Gids", kaart-handoff (de routeapp
          blijft route-eigenaar; de in-app kaart woont alleen in Voorpret). */}
      <View style={gd.head}>
        <Pressable accessibilityRole="button" accessibilityLabel="Terug naar de voorbereiding" onPress={() => { impactLight(); onBack(); }} style={gd.iconbtn}>
          <Feather name="arrow-left" size={16} color={gd.inkSolid as string} />
        </Pressable>
        <View style={styles.flex}>
          <Text style={gd.headTitle}>Gids</Text>
          <Text style={gd.headSub} numberOfLines={1}>{experience.duration} min · {company === 'solo' ? 'alleen' : company === 'family' ? 'met gezin' : 'samen'}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open route in Kaarten" onPress={openHandoff} style={gd.iconbtn}>
          <Feather name="map-pin" size={16} color={gd.inkSolid as string} />
        </Pressable>
      </View>

      {/* De cover draagt de beleving: beeld, serif-titel en voortgang uit
          echte sessiedata (tijd- en stapgebaseerd — er is geen GPS-tracking,
          dus nooit een verzonnen kilometerstand). */}
      <CoverImage uri={experience.image} style={gd.cover} imageStyle={gd.coverRound}>
        <ImageShade />
        <View style={gd.coverCopy}>
          <Text style={[gd.coverTitle, styles.onImageText]}>{experience.title}</Text>
          <View style={gd.coverProgressRow}>
            <Text style={[gd.coverProgressValue, styles.onImageText]}>{progress.headline} <Text style={gd.coverProgressSuffix}>{progress.suffix}</Text></Text>
            <Text style={gd.coverProgressSub}>{progress.sub}</Text>
          </View>
          <View style={gd.coverBarTrack}>
            <View style={[gd.coverBarFill, { width: `${Math.round(progress.fraction * 100)}%` }]} />
          </View>
        </View>
      </CoverImage>

      {/* De huidige stap — de enige plek waar de staptekst staat. */}
      <View style={gd.card}>
        <View style={gd.cardHead}>
          <Feather name="compass" size={15} color={gd.accentSolid as string} />
          <Text style={gd.cardTitle}>{experience.steps.length > 1 ? `Stap ${stepIndex + 1} van ${experience.steps.length}` : experience.presenceMode === 'quiet' ? 'Rustige begeleiding' : 'Onderweg'}</Text>
          {experience.steps.length <= 1 ? <Text style={gd.cardHeadRight}>{company === 'solo' ? 'alleen' : company === 'family' ? 'met gezin' : 'samen'}</Text> : null}
        </View>
        {shared && <View style={gd.togetherRow}>
          <View style={gd.togetherAvatars}>{shared.participants.filter((participant) => participant.status === 'ready').map((participant) => <View key={participant.id} style={gd.togetherAvatar}><Text style={styles.participantAvatarText}>{participant.name.slice(0, 1).toUpperCase()}</Text></View>)}</View>
          <View style={styles.flex}><Text style={gd.rowTitle}>Eén gedeelde ervaring</Text><Text style={gd.rowSub}>{shared.coordination === 'meet-there' ? 'Jullie ontmoetten elkaar bij het begin.' : 'Jullie begonnen samen.'} Deze gids loopt alleen op dit toestel.</Text></View>
        </View>}
        <Text style={gd.stepTitle}>{current.title}</Text>
        {current.meta && <View style={gd.stepMetaPill}><Text style={gd.stepMetaText}>{current.meta}</Text></View>}
        <Text style={gd.stepCue}>{current.instruction}</Text>
        {insightVisible && <View style={gd.insightCard}>
          <Text style={gd.insightEyebrow}>KLEIN INZICHT · ALLEEN ALS HET HELPT</Text>
          <Text style={gd.insightTitle}>{current.insight?.title}</Text>
          <Text style={gd.insightBody}>{current.insight?.body}</Text>
          {current.insight?.sourceUrl ? <Pressable accessibilityRole="link" onPress={() => Linking.openURL(current.insight!.sourceUrl!).catch(() => undefined)}><Text style={[gd.insightSource, { color: gd.accentSolid as string }]}>{current.insight.sourceLabel} · Bekijk bron <Ionicons name="open-outline" size={11} color={gd.accentSolid as string} /></Text></Pressable> : <Text style={gd.insightSource}>{current.insight?.sourceKind === 'live' ? 'Actuele bron' : current.insight?.sourceKind === 'curator' ? 'Plaatskennis' : 'Redactioneel'} · {current.insight?.sourceLabel}</Text>}
        </View>}
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
        {experience.presenceMode === 'handoff' && stepIndex === 0 && <Pressable accessibilityRole="button" onPress={openHandoff} style={gd.quietAction}><Feather name="navigation" size={13} color={gd.accentSolid as string} /><Text style={gd.quietActionText}>Open route in Kaarten</Text></Pressable>}
        {handoffStatus ? <Text style={gd.handoffStatus}>{handoffStatus}</Text> : null}
        <View style={gd.stepNavRow}>
          {stepIndex > 0 && <Pressable accessibilityRole="button" onPress={() => { impactLight(); setStepIndex((value) => Math.max(0, value - 1)); }} style={gd.stepNavButton}><Text style={gd.stepNavText}>Vorige</Text></Pressable>}
          <Pressable
            accessibilityRole="button"
            onPress={next}
            style={[gd.stepNavButton, gd.stepNavPrimary]}
          >
            <Text style={[gd.stepNavText, gd.stepNavPrimaryText]}>{isLast ? 'Ervaring afronden' : 'Volgende stap'}</Text>
          </Pressable>
        </View>
        <View style={gd.stepToolsRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={deepOpen ? 'Sluit de verdieping' : 'Open de verdieping'} accessibilityState={{ expanded: deepOpen }} onPress={() => { impactLight(); setDeepOpen((value) => !value); }} style={gd.quietAction}><Feather name="book-open" size={13} color={gd.accentSolid as string} /><Text style={gd.quietActionText}>Verdieping</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Leg de telefoon weg" onPress={() => { impactLight(); setPhoneAway(true); }} style={gd.quietAction}><Feather name="smartphone" size={13} color={gd.accentSolid as string} /><Text style={gd.quietActionText}>Telefoon weg</Text></Pressable>
        </View>

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
        <View style={gd.card}>
          <View style={gd.cardHead}>
            <Feather name="globe" size={15} color={gd.accentSolid as string} />
            <Text style={gd.cardTitle}>Nu om je heen</Text>
          </View>
          <Text style={gd.briefingLoading}>Feiten van dit moment worden opgehaald…</Text>
        </View>
      ) : guideBriefing?.state === 'live' ? (
        <View style={gd.card}>
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
      <Pressable
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
      </Pressable>
    </ScrollView>
    </View>
    </FlowFrame>
  );
}

// Telefoon weg (dim-stand van de huidige stap): echt OLED-zwart met één zacht
// gloeiend, ademend element (Reanimated; geen Skia). Bij reduced-motion staat
// de gloed stil. Eén tik op "Terug naar de gids" keert terug naar exact de
// stapweergave waar de wandelaar was.
function PhoneAwayView({ experience, cue, seconds, remaining, formatTime, shared, onReopen }: { experience: Experience; cue: string; seconds?: number; remaining: number; formatTime: (seconds: number) => string; shared?: SharedCapsuleState; onReopen: () => void }) {
  const breath = useBreathing({ period: 6400, scaleTo: 1.055, opacityTo: 0.72 });
  return <View style={styles.phoneAwayScreen}>
    <Text style={styles.phoneAwayEyebrow}>GIDS</Text><Text style={styles.phoneAwayTitle}>{experience.title}</Text><Text style={styles.phoneAwayCue}>{cue}</Text>
    <Reanimated.View style={[styles.phoneAwayGlow, { borderColor: gd.accentSolid as string, shadowColor: gd.accentSolid as string }, breath]}>
      {seconds ? <Text style={styles.phoneAwayTimer}>{formatTime(remaining)}</Text> : <Ionicons name="ellipse" size={10} color={gd.accentSolid as string} />}
    </Reanimated.View>
    {shared && <Text style={styles.phoneAwayTogether}>{shared.participants.filter((participant) => participant.status === 'ready').map((participant) => participant.name).join(' + ')} · samen aanwezig</Text>}
    <Text style={styles.phoneAwayBody}>Je hoeft nu niets te bedienen. De gids blijft met één tik beschikbaar.</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Terug naar de gids" onPress={onReopen} style={styles.reopenGuide}><Text style={styles.reopenGuideText}>Terug naar de gids</Text></Pressable>
  </View>;
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
        ink: '#F5F4F0',
        ink2: 'rgba(245,244,240,0.62)',
        ink3: 'rgba(245,244,240,0.55)',
        accent: '#34C772',
        accentInk: '#06130C',
        glass: 'rgba(245,244,240,0.07)',
        glass2: 'rgba(245,244,240,0.09)',
        line: 'rgba(245,244,240,0.12)',
        track: 'rgba(245,244,240,0.1)',
        rowLine: 'rgba(245,244,240,0.07)',
        iconTile: 'rgba(52,199,114,0.12)',
        quietBorder: 'rgba(52,199,114,0.4)',
        glow: 'rgba(52,199,114,0.5)',
      }
    : {
        ink: schemeColors.ink,
        ink2: 'rgba(34,37,45,0.66)',
        ink3: 'rgba(34,37,45,0.68)',
        accent: schemeColors.accent,
        accentInk: schemeColors.onAccent,
        glass: 'rgba(34,37,45,0.05)',
        glass2: 'rgba(34,37,45,0.07)',
        line: 'rgba(34,37,45,0.12)',
        track: 'rgba(34,37,45,0.14)',
        rowLine: 'rgba(34,37,45,0.08)',
        iconTile: 'rgba(32,128,73,0.10)',
        quietBorder: 'rgba(32,128,73,0.32)',
        glow: 'rgba(32,128,73,0.35)',
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
      width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
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
    stepToolsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    quietAction: {
      flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999,
      paddingVertical: 8, paddingHorizontal: 13,
      backgroundColor: palette.glass2, borderWidth: 1, borderColor: palette.line,
    },
    quietActionText: { fontSize: 11.5, fontWeight: '600', color: palette.ink },
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
