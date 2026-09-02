import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { StackActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Reanimated from 'react-native-reanimated';
import { Experience } from '../../product/experienceModel';
import { SharedCapsuleState } from '../../sharing/sharedCapsule';
import { ExperienceGuidePanel } from '../../guidance/ExperienceGuidePanel';
import { buildExperienceGuide } from '../../guidance/experienceGuide';
import { verifyRouteBeforeHandoff } from '../../routing/routeIntelligence';
import { colors, palettes, phase, schemeStyles, typography } from '../../design/theme';
import { impactLight, impactMedium } from '../../design/haptics';
import { useBreathing } from '../../design/motion';
import { RouteMapPreview } from '../RouteMapPreview';
import { FlowFrame } from '../frames';
import { styles } from '../styles/appStyles';
import { defaultRegion, useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';
import { resolveSunTimes } from '../now-v2/nowModel';
import { guideProgress, guideState, mapTag, nextMoment } from '../now-v2/guideModel';
import {
  LivingWorldBriefing,
  loadLivingWorldBriefing,
} from '../../liveworld/livingWorldBriefing';
import { briefingSourceLine } from '../../liveworld/briefingFacts';

// Gids-scherm (onderweg) volgens concept v2 (ADR-067, fase R4 — herbouw van
// het Presence-scherm uit ADR-058). De v2-scènes leiden: header "Onderweg"
// met kaart-knop, routekaart met plaats-etiket en stille-modus-badge (alleen
// als die echt aan staat), voortgangsblok uit echte sessiedata (tijd- en
// stapgebaseerd — er is geen GPS-tracking, dus nooit een verzonnen
// kilometerstand), de "Over …"-kaart met het volgende gidsmoment of
// aankomstplan, en "De gids" met alleen regels die uit data volgen. De
// ghost-knop rondt af via de bestaande Remember-flow.
//
// Wat ongewijzigd blijft: de beforeRemove-logica (gids-sheet of Phone Away
// eerst sluiten, anders rustig terug naar Prepare), de capsule-stappen met
// timers, het inzichten-spaarregime, de samen-flow, de handoff naar Kaarten
// en de telefoon-weg-variant — nu in v2-taal binnen de rustige stapkaart.
// De foto-backdrop maakt plaats voor het donkere podium; de kaart draagt de
// plek, de woorden dragen de informatie.

export function PresenceScreen() {
  const { selected: experience, personalProfile: personal, activeSession, updatePresenceStep, presenceBack, finishPresence, liveWorld, prototypeContext } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const company = activeSession?.company ?? personal.defaultCompany;
  const guideDepth = activeSession?.guideDepth ?? 'guide';
  const shared = activeSession?.shared;
  const initialStep = activeSession?.experienceId === experience.id ? activeSession.stepIndex : 0;
  const onStepChange = (stepIndex: number) => updatePresenceStep(stepIndex);
  const onFinish = () => {
    // Het moment is bewust afgerond: een latere reset (bewaren → Leefboek of
    // overslaan → popToTop) mag Presence zonder tegenactie verwijderen.
    leavingRef.current = true;
    finishPresence();
    navigation.navigate('Remember');
  };
  const [stepIndex, setStepIndex] = useState(Math.min(initialStep, Math.max(0, experience.steps.length - 1)));
  const [remaining, setRemaining] = useState(experience.steps[Math.min(initialStep, Math.max(0, experience.steps.length - 1))]?.seconds ?? 0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [phoneAway, setPhoneAway] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [handoffStatus, setHandoffStatus] = useState('');
  const current = experience.steps[stepIndex] ?? { title: experience.presenceTitle, instruction: experience.presenceCue };
  const insightVisible = guideDepth !== 'quiet' && current.insight && (guideDepth === 'deep' || personal.guidanceBalance > -0.2) && !personal.mutedInsightTopics.includes(current.insight.topic) && !personal.mutedInsightExperienceIds.includes(experience.id);
  const isLast = stepIndex >= experience.steps.length - 1;
  const timedStepInProgress = Boolean(current.seconds && remaining > 0);
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
    if (guideOpen) { setGuideOpen(false); return; }
    if (phoneAway) { setPhoneAway(false); return; }
    onBack();
  }), [navigation, guideOpen, phoneAway]);

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
  const next = () => {
    if (isLast) onFinish();
    else { impactLight(); setStepIndex((value) => value + 1); }
  };
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  // ——— Concept v2: voortgang en gidsregels lopen mee met de klok (30s-tick).
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
  const upcoming = nextMoment(experience, guide.moments, stepIndex);
  const guideInfo = guideState(now, sun, weather, experience, activeSession, stepIndex, guideDepth);
  const routeTag = mapTag(experience);

  // ——— ADR-068 (addendum) · De wereld van dit moment, onderweg ———
  // Schaarse triggers, nooit polling: bij aanvang van de ervaring en bij elke
  // stapwissel (de gebruikersactie "Volgende stap"/"Vorige") vraagt dezelfde
  // briefing-route 2–3 zinnen die juist deze stap aan echte feiten verbinden.
  // De cachesleutel neemt de stap mee (15 min per ervaring+stap+feitset).
  // States: laden (rustige placeholder) → live (zinnen met bron-labels) →
  // afwezig bij falen — de stappen zelf blijven altijd ongewijzigd staan.
  const [guideBriefing, setGuideBriefing] = useState<{ state: 'loading' } | { state: 'live'; value: LivingWorldBriefing } | null>(null);
  const currentStepTitle = current.title;
  useEffect(() => {
    if (experience.kind !== 'outside' || !liveWorld) { setGuideBriefing(null); return; }
    let active = true;
    setGuideBriefing({ state: 'loading' });
    loadLivingWorldBriefing({ experience, snapshot: liveWorld, dayPart: prototypeContext.dayPart, step: { index: stepIndex, title: currentStepTitle } })
      .then((result) => {
        if (!active) return;
        setGuideBriefing(result.status === 'live' ? { state: 'live', value: result.briefing } : null);
      })
      .catch(() => { if (active) setGuideBriefing(null); });
    return () => { active = false; };
  }, [experience.id, stepIndex, currentStepTitle, liveWorld?.retrievedAt]);

  if (phoneAway) return <FlowFrame statusBar="light"><PhoneAwayView experience={experience} cue={current.title} seconds={current.seconds} remaining={remaining} formatTime={formatTime} shared={shared} onReopen={() => { setPhoneAway(false); setGuideOpen(true); }} /></FlowFrame>;
  return (
    <FlowFrame statusBar="light">
    <View style={styles.flowScreen}>
    <ScrollView contentContainerStyle={[styles.flowScroll, gd.scroll]} showsVerticalScrollIndicator={false}>
      {/* Header volgens concept: "Onderweg" + momentnaam + kaart-knop (de
          handoff naar de routeapp, die blijft route-eigenaar). */}
      <View style={gd.head}>
        <View style={styles.flex}>
          <Text style={gd.headTitle}>Onderweg</Text>
          <Text style={gd.headSub} numberOfLines={1}>{experience.title}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open route in Kaarten" onPress={openHandoff} style={gd.iconbtn}>
          <Feather name="map-pin" size={16} color={gd.inkSolid as string} />
        </Pressable>
      </View>

      {/* Routekaart (ADR-061: alleen oriëntatie, niet-interactief) met het
          plaats-etiket en — alleen als hij echt aan staat — de stille-badge. */}
      {experience.routePlan?.destination && (
        <View style={gd.mapbox}>
          <RouteMapPreview latitude={experience.routePlan.destination.latitude} longitude={experience.routePlan.destination.longitude} label={experience.routePlan.destinationName} radiusMeters={experience.routePlan.arrivalPlan?.radiusMeters} />
          {routeTag ? <View style={gd.mapTag}><Text style={gd.mapTagText}>{routeTag.toUpperCase()}</Text></View> : null}
          {guideInfo.quiet ? <View style={gd.quietBadge}><Feather name="moon" size={11} color={gd.accentSolid as string} /><Text style={gd.quietBadgeText}>STILLE MODUS AAN</Text></View> : null}
        </View>
      )}

      {/* Voortgang: tijd- en stapgebaseerd uit de sessie (geen GPS in de app,
          dus geen kilometerstand — zie guideModel). */}
      <View style={gd.panel}>
        <View style={gd.progressTop}>
          <Text style={gd.progressValue}>{progress.headline} <Text style={gd.progressSuffix}>{progress.suffix}</Text></Text>
          <Text style={gd.progressSub}>{progress.sub}</Text>
        </View>
        <View style={gd.barTrack}>
          <View style={[gd.barFill, { width: `${Math.round(progress.fraction * 100)}%` }]} />
        </View>
      </View>

      {/* De huidige stap in v2-taal: aanwijzing, spaarzaam inzicht, timer en
          stapnavigatie — plus de rustige ingangen naar gids en telefoon-weg. */}
      <View style={gd.card}>
        <View style={gd.cardHead}>
          <Feather name="compass" size={15} color={gd.accentSolid as string} />
          <Text style={gd.cardTitle}>{experience.presenceMode === 'handoff' ? 'Onderweg' : experience.presenceMode === 'quiet' ? 'Rustige begeleiding' : 'Huidige stap'}</Text>
          <Text style={gd.cardHeadRight}>{experience.steps.length > 1 ? `${stepIndex + 1} van ${experience.steps.length}` : company === 'solo' ? 'alleen' : company === 'family' ? 'met gezin' : 'samen'}</Text>
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
              <Text style={gd.timerUnit}>{remaining === 0 ? 'KLAAR' : timerRunning ? 'LOOPT' : 'KLAAR OM TE STARTEN'}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={remaining === 0 ? 'Timer afgerond' : timerRunning ? 'Pauzeer timer' : 'Start timer'} accessibilityState={{ disabled: remaining === 0 }} onPress={() => remaining > 0 && setTimerRunning((value) => !value)} style={gd.timerControl}>
              {remaining === 0 ? <Feather name="check" size={14} color={gd.accentInkSolid as string} /> : <Text style={gd.timerControlText}>{timerRunning ? 'Pauze' : 'Start'}</Text>}
            </Pressable>
          </View>
        ) : null}
        {experience.presenceMode === 'handoff' && stepIndex === 0 && <Pressable accessibilityRole="button" onPress={openHandoff} style={gd.quietAction}><Feather name="navigation" size={13} color={gd.accentSolid as string} /><Text style={gd.quietActionText}>Open route in Kaarten</Text></Pressable>}
        {handoffStatus ? <Text style={gd.handoffStatus}>{handoffStatus}</Text> : null}
        <View style={gd.stepNavRow}>
          {stepIndex > 0 && <Pressable accessibilityRole="button" onPress={() => setStepIndex((value) => Math.max(0, value - 1))} style={gd.stepNavButton}><Text style={gd.stepNavText}>Vorige</Text></Pressable>}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: timedStepInProgress }}
            onPress={next}
            style={[gd.stepNavButton, gd.stepNavPrimary, timedStepInProgress && gd.stepNavDisabled]}
          >
            <Text style={[gd.stepNavText, gd.stepNavPrimaryText]}>{isLast ? 'Ervaring afronden' : timedStepInProgress ? 'Rond eerst de timer af' : 'Volgende stap'}</Text>
          </Pressable>
        </View>
        {timedStepInProgress && <Pressable accessibilityRole="button" onPress={next} style={gd.skipTimer}><Text style={gd.skipTimerText}>Sla deze timer over</Text></Pressable>}
        <View style={gd.stepToolsRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Open de ervaringsgids" onPress={() => setGuideOpen(true)} style={gd.quietAction}><Feather name="book-open" size={13} color={gd.accentSolid as string} /><Text style={gd.quietActionText}>Gids</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Leg de telefoon weg" onPress={() => setPhoneAway(true)} style={gd.quietAction}><Feather name="smartphone" size={13} color={gd.accentSolid as string} /><Text style={gd.quietActionText}>Telefoon weg</Text></Pressable>
        </View>
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

      {/* "Over …": het volgende gidsmoment of het aankomstplan — nooit een
          verzonnen waypoint. */}
      {upcoming && <View style={gd.nextCard}>
        <View style={gd.nextIcon}><Feather name="eye" size={19} color={gd.accentSolid as string} /></View>
        <View style={styles.flex}>
          <Text style={gd.nextOver}>{upcoming.over.toUpperCase()}</Text>
          <Text style={gd.nextTitle}>{upcoming.title}</Text>
          {upcoming.sub ? <Text style={gd.nextSub}>{upcoming.sub}</Text> : null}
        </View>
      </View>}

      {/* De gids: alleen regels die uit data volgen (zie guideModel). */}
      {guideInfo.rows.length > 0 && <View style={gd.card}>
        <View style={gd.cardHead}>
          <Feather name="compass" size={15} color={gd.accentSolid as string} />
          <Text style={gd.cardTitle}>De gids</Text>
        </View>
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
      </View>}

      {/* Afronden: rustige ghost-knop naar de bestaande Remember-flow. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Moment afronden"
        onPress={() => { impactMedium(); onFinish(); }}
        style={({ pressed }) => [gd.ghost, pressed && gd.pressed]}
      >
        <Feather name="check" size={15} color={gd.inkSolid as string} />
        <Text style={gd.ghostText}>Moment afronden</Text>
      </Pressable>
      <Text style={gd.footNote}>{experience.presenceMode === 'quiet' ? 'Gebruik alleen de aanwijzing die helpt. Leg daarna je telefoon weg.' : 'Alleen de huidige stap vraagt aandacht.'}</Text>
    </ScrollView>
    {guideOpen && <ExperienceGuidePanel guide={guide} depth={guideDepth} accent={experience.accent} image={experience.image} onClose={() => setGuideOpen(false)} />}
    </View>
    </FlowFrame>
  );
}

// Phone Away (Horizon B): echt OLED-zwart met één zacht gloeiend, ademend
// element (Reanimated; geen Skia). Bij reduced-motion staat de gloed stil.
function PhoneAwayView({ experience, cue, seconds, remaining, formatTime, shared, onReopen }: { experience: Experience; cue: string; seconds?: number; remaining: number; formatTime: (seconds: number) => string; shared?: SharedCapsuleState; onReopen: () => void }) {
  const breath = useBreathing({ period: 6400, scaleTo: 1.055, opacityTo: 0.72 });
  return <View style={styles.phoneAwayScreen}>
    <Text style={styles.phoneAwayEyebrow}>PRESENCE</Text><Text style={styles.phoneAwayTitle}>{experience.title}</Text><Text style={styles.phoneAwayCue}>{cue}</Text>
    <Reanimated.View style={[styles.phoneAwayGlow, { borderColor: phase.presence.accent, shadowColor: phase.presence.accent }, breath]}>
      {seconds ? <Text style={styles.phoneAwayTimer}>{formatTime(remaining)}</Text> : <Ionicons name="ellipse" size={10} color={phase.presence.accent} />}
    </Reanimated.View>
    {shared && <Text style={styles.phoneAwayTogether}>{shared.participants.filter((participant) => participant.status === 'ready').map((participant) => participant.name).join(' + ')} · samen aanwezig</Text>}
    <Text style={styles.phoneAwayBody}>Je hoeft nu niets te bedienen. De gids blijft met één tik beschikbaar.</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Raadpleeg de gids" onPress={onReopen} style={styles.reopenGuide}><Text style={styles.reopenGuideText}>Raadpleeg de gids</Text></Pressable>
  </View>;
}

// Visuele taal (concept v2): zelfde palet als R1–R3 — near-black podium,
// glaspanelen, accentgroen uit de #34c772-familie, serif display voor de
// voortgangs-waarde. De lichte sibling volgt de dagpalet-tokens (ADR-064);
// alle tekst/achtergrond-paren houden WCAG AA. Detectie via palet-identiteit,
// zoals schemeStyles het aanlevert.
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
        badgeBg: 'rgba(10,12,18,0.55)',
        quietBg: 'rgba(52,199,114,0.16)',
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
        badgeBg: 'rgba(255,255,255,0.72)',
        quietBg: 'rgba(32,128,73,0.12)',
        quietBorder: 'rgba(32,128,73,0.32)',
        glow: 'rgba(32,128,73,0.35)',
      };
  type GidsStyles = {
    inkSolid: string;
    accentSolid: string;
    accentInkSolid: string;
    scroll: ViewStyle;
    head: ViewStyle;
    headTitle: TextStyle;
    headSub: TextStyle;
    iconbtn: ViewStyle;
    mapbox: ViewStyle;
    mapTag: ViewStyle;
    mapTagText: TextStyle;
    quietBadge: ViewStyle;
    quietBadgeText: TextStyle;
    panel: ViewStyle;
    progressTop: ViewStyle;
    progressValue: TextStyle;
    progressSuffix: TextStyle;
    progressSub: TextStyle;
    barTrack: ViewStyle;
    barFill: ViewStyle;
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
    stepNavDisabled: ViewStyle;
    stepNavText: TextStyle;
    stepNavPrimaryText: TextStyle;
    skipTimer: ViewStyle;
    skipTimerText: TextStyle;
    stepToolsRow: ViewStyle;
    quietAction: ViewStyle;
    quietActionText: TextStyle;
    nextCard: ViewStyle;
    nextIcon: ViewStyle;
    nextOver: TextStyle;
    nextTitle: TextStyle;
    nextSub: TextStyle;
    row: ViewStyle;
    rowBorder: ViewStyle;
    rowIcon: ViewStyle;
    rowTitle: TextStyle;
    rowSub: TextStyle;
    rowTrailing: TextStyle;
    briefingLoading: TextStyle;
    briefingRow: ViewStyle;
    briefingText: TextStyle;
    briefingSource: TextStyle;
    briefingFootnote: TextStyle;
    ghost: ViewStyle;
    ghostText: TextStyle;
    footNote: TextStyle;
    pressed: ViewStyle;
  };
  const stylesDef: GidsStyles = {
    inkSolid: palette.ink,
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
    mapbox: { marginHorizontal: 12, position: 'relative' },
    mapTag: {
      position: 'absolute', top: 26, left: 12, borderRadius: 999,
      paddingVertical: 6, paddingHorizontal: 11,
      backgroundColor: palette.badgeBg, borderWidth: 1, borderColor: palette.line,
    },
    mapTagText: { fontSize: 10, letterSpacing: 1.6, fontWeight: '700', color: palette.ink2 },
    quietBadge: {
      position: 'absolute', top: 26, right: 12, flexDirection: 'row', alignItems: 'center', gap: 7,
      borderRadius: 999, paddingVertical: 6, paddingHorizontal: 11,
      backgroundColor: palette.quietBg, borderWidth: 1, borderColor: palette.quietBorder,
    },
    quietBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: palette.accent },
    panel: {
      marginHorizontal: 12, marginTop: 12, borderRadius: 22, paddingHorizontal: 15, paddingVertical: 14,
      backgroundColor: palette.glass, borderWidth: 1, borderColor: palette.line,
    },
    progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 },
    progressValue: { fontFamily: typography.displayFamilyMedium, fontWeight: '400', fontSize: 21, color: palette.ink },
    progressSuffix: { fontFamily: undefined, fontSize: 13, color: palette.ink2, fontWeight: '600' },
    progressSub: { fontSize: 11.5, color: palette.ink2, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
    barTrack: { marginTop: 8, height: 5, borderRadius: 999, backgroundColor: palette.track, overflow: 'hidden' },
    barFill: {
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
    stepTitle: { fontFamily: typography.displayFamilyMedium, fontWeight: '400', fontSize: 21, lineHeight: 26, color: palette.ink },
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
    stepNavDisabled: { opacity: 0.45 },
    stepNavText: { fontSize: 12.5, fontWeight: '600', color: palette.ink },
    stepNavPrimaryText: { color: palette.accentInk, fontWeight: '700' },
    skipTimer: { alignSelf: 'center', marginTop: 8, paddingVertical: 4, paddingHorizontal: 10 },
    skipTimerText: { fontSize: 11, color: palette.ink3, fontWeight: '500' },
    stepToolsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    quietAction: {
      flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999,
      paddingVertical: 8, paddingHorizontal: 13,
      backgroundColor: palette.glass2, borderWidth: 1, borderColor: palette.line,
    },
    quietActionText: { fontSize: 11.5, fontWeight: '600', color: palette.ink },
    nextCard: {
      marginHorizontal: 12, marginTop: 10, borderRadius: 22, padding: 14,
      backgroundColor: palette.glass2, borderWidth: 1, borderColor: palette.line,
      flexDirection: 'row', gap: 12, alignItems: 'center',
    },
    nextIcon: {
      width: 40, height: 40, borderRadius: 14, backgroundColor: palette.iconTile,
      alignItems: 'center', justifyContent: 'center',
    },
    nextOver: { fontSize: 10, letterSpacing: 1.6, fontWeight: '700', color: palette.ink3, textTransform: 'uppercase' },
    nextTitle: { fontSize: 13.5, fontWeight: '600', color: palette.ink, marginTop: 3, lineHeight: 18 },
    nextSub: { fontSize: 11, color: palette.ink2, marginTop: 2 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 7 },
    rowBorder: { borderTopWidth: 1, borderTopColor: palette.rowLine },
    rowIcon: {
      width: 32, height: 32, borderRadius: 11, backgroundColor: palette.iconTile,
      alignItems: 'center', justifyContent: 'center',
    },
    rowTitle: { fontSize: 13, fontWeight: '600', color: palette.ink },
    rowSub: { fontSize: 11, color: palette.ink2, marginTop: 1 },
    rowTrailing: { fontSize: 11.5, fontWeight: '600', color: palette.ink2 },
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
    footNote: { fontSize: 11, color: palette.ink3, textAlign: 'center', marginTop: 12, marginHorizontal: 24 },
    pressed: { opacity: 0.92 },
  };
  return stylesDef;
});
