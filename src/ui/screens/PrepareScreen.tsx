import React, { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Company, TransportMode, transportLabels } from '../../product/localIntelligence';
import {
  buildInviteUrl,
  createSharedInvite,
  hostSharedState,
  SharedCapsuleState,
  SharedCoordination,
} from '../../sharing/sharedCapsule';
import { buildExperienceGuide, GuideDepth } from '../../guidance/experienceGuide';
import { routingCapability } from '../../routing/routeIntelligence';
import { colors, palettes, phase, schemeStyles, typography } from '../../design/theme';
import { impactLight, impactMedium } from '../../design/haptics';
import { RouteMapPreview } from '../RouteMapPreview';
import { ChoiceChip, MeaningThreadCard } from '../primitives';
import { FlowFrame } from '../frames';
import { styles } from '../styles/appStyles';
import { defaultRegion, useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';
import { formatClock, goldenWindow, resolveSunTimes } from '../now-v2/nowModel';
import {
  BriefingSentence,
  LivingWorldBriefing,
  briefingInterests,
  loadLivingWorldBriefing,
} from '../../liveworld/livingWorldBriefing';
import {
  ctaSubline,
  departureModel,
  journeySegments,
  packingRows,
  weatherRows,
} from '../now-v2/voorpretModel';

// Voorpret volgens concept v2 (ADR-067, fase R3 — herbouw van het
// Prepare-scherm uit ADR-065, fase 1). De v2-scènes leiden: header met terug
// en momentnaam, de aftelkaart "Vertrek over" met live klok en voortgang naar
// het gouden uur, daarna "Zo ga je" (routesegmenten uit het routeplan),
// "Neem mee" (paklijst uit live weer, met de capsule-lijst als eerlijke
// fallback) en "Weer onderweg" (huidige meting + zonmodel — geen verzonnen
// uurverwachting). De strook "De route van dit moment" toont de staptitels;
// de Go-CTA start de Gids (het onderweg-scherm, voorheen Presence).
//
// ADR-065 blijft van kracht: maximaal één zichtbare vraag (met wie), de rest
// slimme standaardwaarden die zichtbaar zijn in de samenvatting en één tik
// aanpasbaar. Eerlijkheid over bronnen en aannames woont één tik dieper in
// "Waarom dit plan?". De kaart, het verhaal van de plek en de deel-flow
// blijven als rustige verdieping onder de v2-scènes bestaan.

export function PrepareScreen() {
  const { selected: experience, personalProfile: personal, activeSession, sharedDraft, savePreparation, startPresence, liveWorld, selectionLocationConfirmed, prototypeContext } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const hostName = personal.firstName || 'Iemand';
  const initialCompany: Company = (activeSession?.experienceId === experience.id ? activeSession.company : sharedDraft ? 'together' : personal.defaultCompany) ?? 'solo';
  const initialGuideDepth = activeSession?.experienceId === experience.id ? activeSession.guideDepth : undefined;
  const initialShared = activeSession?.experienceId === experience.id ? activeSession.shared : sharedDraft ?? undefined;
  const onBack = () => navigation.goBack();
  // ADR-059, punt 4: gezelschap en vervoer zijn per-moment-verfijningen van
  // deze kaart. Ze gelden voor deze ervaring (via de sessie) en horen niet in
  // Profiel. Het model kent te voet en fiets; de standaard volgt het routeplan.
  const initialTransport: TransportMode = (activeSession?.experienceId === experience.id ? activeSession.transport : undefined) ?? experience.routePlan?.mode ?? 'walking';
  const onDraftChange = (company: Company, guideDepth: GuideDepth, shared?: SharedCapsuleState, transport?: TransportMode) => savePreparation(company, guideDepth, shared, transport);
  const onStart = (company: Company, guideDepth: GuideDepth, shared?: SharedCapsuleState, transport?: TransportMode) => {
    startPresence(company, guideDepth, shared, transport);
    navigation.navigate('Guide');
  };
  const supportedCompanies = experience.company;
  const [company, setCompany] = useState<Company>(supportedCompanies.includes(initialCompany) ? initialCompany : supportedCompanies[0]);
  const [transport, setTransport] = useState<TransportMode>(initialTransport);
  const guidanceMuted = personal.mutedInsightExperienceIds.includes(experience.id);
  const preferredGuideDepth: GuideDepth = guidanceMuted || personal.guidanceBalance <= -0.2 ? 'quiet' : personal.guidanceBalance >= 0.45 ? 'deep' : experience.presenceMode === 'quiet' ? 'quiet' : 'guide';
  const [guideDepth, setGuideDepth] = useState<GuideDepth>(initialGuideDepth ?? preferredGuideDepth);
  const [coordination, setCoordination] = useState<SharedCoordination>(initialShared?.coordination ?? 'leave-together');
  const [shared, setShared] = useState<SharedCapsuleState | undefined>(initialShared);
  const [shareStatus, setShareStatus] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const guide = buildExperienceGuide(experience, 0);
  const freshEvidence = guide.evidence.filter((item) => item.freshness === 'current');
  const companyChoices: Array<{ id: Company; label: string }> = [{ id: 'solo', label: 'Alleen' }, { id: 'together', label: 'Samen' }, { id: 'family', label: 'Met gezin' }];
  useEffect(() => {
    onDraftChange(company, guideDepth, shared ? { ...shared, coordination } : undefined, transport);
  }, [company, coordination, guideDepth, shared, transport]);
  const shareExperience = async () => {
    if (company === 'solo') return;
    const companion = company === 'family' ? 'met gezin' : 'samen';
    const invite = createSharedInvite({ experienceId: experience.id, title: experience.title, promise: experience.promise, duration: experience.duration, hostName, company, guideDepth, coordination });
    const inviteUrl = buildInviteUrl(invite);
    const message = `Ga je mee?\n\n${experience.title}\n${experience.promise}\n${experience.duration} minuten · ${companion}\n${coordination === 'meet-there' ? 'We ontmoeten elkaar bij het startpunt.' : 'We vertrekken samen.'}\n\n${inviteUrl ? `Open de uitnodiging:\n${inviteUrl}` : 'Open Momentum om samen af te stemmen.'}`;
    try {
      if (Platform.OS === 'web' && inviteUrl && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
        setShareStatus('Uitnodigingslink gekopieerd. Je kunt hem nu zelf versturen.');
      } else {
        await Share.share({ title: experience.title, message });
        setShareStatus('Uitnodiging geopend in het deelmenu.');
      }
      setShared(hostSharedState(invite));
    } catch {
      setShareStatus('Delen lukte niet. Probeer het opnieuw vanaf dit toestel.');
    }
  };
  const chooseCompany = (value: Company) => {
    setCompany(value);
    if (value === 'solo') setShared(undefined);
  };

  // ——— Concept v2: de aftelkaart en scènes lopen mee met de klok (30s-tick).
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
  const departure = departureModel(now, experience.duration, sun, transport);
  const segments = journeySegments(experience, transport);
  const packing = packingRows(experience, weather);
  const weatherList = weatherRows(now, sun, weather, departure.end);

  // ——— ADR-068 · Levende Wereld-briefing (scope: outside) ———
  // Bij openen van een buiten-Voorpret vraagt de generator-service 2–4
  // redactionele zinnen die de ervaring aan echte snapshot-feiten verbinden.
  // Drie eerlijke states: laden (rustige placeholder) → live (zinnen met
  // bron-labels uit receipts) → bron niet bereikbaar (het blok valt weg en de
  // bestaande scènes blijven exact wat ze waren — nooit een kapot scherm).
  const [briefing, setBriefing] = useState<{ state: 'loading' | 'live'; value: LivingWorldBriefing } | { state: 'loading' } | null>(null);
  useEffect(() => {
    if (experience.kind !== 'outside' || !liveWorld) { setBriefing(null); return; }
    let active = true;
    setBriefing({ state: 'loading' });
    loadLivingWorldBriefing({ experience, snapshot: liveWorld, dayPart: prototypeContext.dayPart, interests: briefingInterests(personal) })
      .then((result) => {
        if (!active) return;
        setBriefing(result.status === 'live' ? { state: 'live', value: result.briefing } : null);
      })
      .catch(() => { if (active) setBriefing(null); });
    return () => { active = false; };
  }, [experience.id, liveWorld?.retrievedAt]);

  // Bron-label per zin: de namen + meetdetails van de geciteerde feiten,
  // ontdubbeld en in feitvolgorde (bijv. "Open-Meteo · om 22:45 gemeten").
  const briefingSourceLine = (sentence: BriefingSentence, value: LivingWorldBriefing): string => {
    const labels = sentence.factIds
      .map((id) => value.facts.find((fact) => fact.id === id))
      .filter((fact): fact is NonNullable<typeof fact> => Boolean(fact))
      .map((fact) => `${fact.source}${fact.sourceDetail ? ` · ${fact.sourceDetail}` : ''}`);
    return [...new Set(labels)].join(' + ');
  };

  const companyLabel = company === 'solo' ? 'Alleen' : company === 'family' ? 'Met gezin' : 'Samen';
  const guideDepthLabel = guideDepth === 'quiet' ? 'rustige begeleiding' : guideDepth === 'deep' ? 'verdiepende gids' : 'gids op het juiste moment';
  return (
    <FlowFrame>
    <View style={styles.flowScreen}>
    <ScrollView contentContainerStyle={[styles.flowScroll, styles.flowScrollStickyAction]} showsVerticalScrollIndicator={false}>
      {/* Header volgens concept: ronde terugknop, "Voorpret", momentnaam. */}
      <View style={vp.head}>
        <Pressable accessibilityRole="button" accessibilityLabel="Terug" onPress={onBack} style={vp.back}>
          <Feather name="arrow-left" size={16} color={vp.inkSolid as string} />
        </Pressable>
        <View style={styles.flex}>
          <Text style={vp.headTitle}>Voorpret</Text>
          <Text style={vp.headSub} numberOfLines={1}>{experience.title}</Text>
        </View>
      </View>

      {/* Aftelkaart: vertrektijd uit hetzelfde startmodel als de Nu-CTA;
          voortgang over het venster van één uur voor vertrek. */}
      <LinearGradient
        colors={[vp.gradientStart as string, vp.gradientEnd as string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={vp.count}
      >
        <Text style={vp.countLabel}>Vertrek over</Text>
        <View style={vp.countBigRow}>
          <Text style={vp.countBig}>{departure.countdown}</Text>
          <Text style={vp.countMeta}>{departure.meta}</Text>
        </View>
        <View style={vp.countBarTrack}>
          <View style={[vp.countBarFill, { width: `${Math.round(departure.progress * 100)}%` }]} />
        </View>
        <View style={vp.countBarLabels}>
          <Text style={vp.countBarLabel}>nu · {formatClock(now)}</Text>
          <Text style={vp.countBarLabel}>{departure.end.getTime() > sun.sunset.getTime() ? `zon onder ${formatClock(sun.sunset)}` : `gouden uur ${formatClock(goldenWindow(sun).peak)}`}</Text>
        </View>
      </LinearGradient>

      {/* Scène: zo ga je — routesegmenten uit het plan, eerlijk zonder plan. */}
      <View style={vp.card}>
        <View style={vp.cardHead}>
          <Feather name="map" size={15} color={vp.accentSolid as string} />
          <Text style={vp.cardTitle}>Zo ga je</Text>
        </View>
        {segments.map((segment, index) => (
          <View key={`${segment.title}-${index}`} style={[vp.row, index > 0 && vp.rowBorder]}>
            <View style={vp.rowIcon}><Feather name={segment.icon} size={15} color={vp.accentSolid as string} /></View>
            <View style={styles.flex}>
              <Text style={vp.rowTitle}>{segment.title}</Text>
              {segment.sub ? <Text style={vp.rowSub}>{segment.sub}</Text> : null}
            </View>
            {segment.trailing ? <Text style={vp.rowTrailing}>{segment.trailing}</Text> : null}
          </View>
        ))}
      </View>

      {/* Strook: de route van dit moment — staptitels in volgorde, zodat de
          gids onderweg nooit een verrassing is. De routekaart zelf blijft
          bewust hier; onderweg is alleen de stap waar je bent. */}
      <View style={vp.card}>
        <View style={vp.cardHead}>
          <Feather name="list" size={15} color={vp.accentSolid as string} />
          <Text style={vp.cardTitle}>De route van dit moment</Text>
        </View>
        {experience.steps.map((step, index) => (
          <View key={`${step.title}-${index}`} style={[vp.row, index > 0 && vp.rowBorder]}>
            <View style={vp.stepNo}><Text style={vp.stepNoText}>{index + 1}</Text></View>
            <View style={styles.flex}>
              <Text style={vp.rowTitle}>{step.title}</Text>
            </View>
            {step.seconds ? <Text style={vp.rowTrailing}>{`${Math.max(1, Math.round(step.seconds / 60))} min`}</Text> : null}
          </View>
        ))}
      </View>

      {/* Scène: neem mee — regels uit live weer; zonder meting de paklijst
          van de capsule zelf. Status alleen waar een regel uit data volgt. */}
      <View style={vp.card}>
        <View style={vp.cardHead}>
          <Feather name="check" size={15} color={vp.accentSolid as string} />
          <Text style={vp.cardTitle}>Neem mee</Text>
        </View>
        {packing.map((row, index) => (
          <View key={`${row.title}-${index}`} style={[vp.row, index > 0 && vp.rowBorder]}>
            <View style={vp.rowIcon}><Feather name={row.icon} size={15} color={vp.accentSolid as string} /></View>
            <View style={styles.flex}>
              <Text style={vp.rowTitle}>{row.title}</Text>
              {row.sub ? <Text style={vp.rowSub}>{row.sub}</Text> : null}
            </View>
            {row.status ? <Text style={vp.rowTrailing}>{row.status}</Text> : null}
          </View>
        ))}
      </View>

      {/* Scène: weer onderweg — huidige meting en zonmodel; geen verzonnen
          uur-voor-uur-verwachting. */}
      <View style={vp.card}>
        <View style={vp.cardHead}>
          <Feather name="sun" size={15} color={vp.accentSolid as string} />
          <Text style={vp.cardTitle}>Weer onderweg</Text>
        </View>
        {weatherList.map((row, index) => (
          <View key={`${row.title}-${index}`} style={[vp.row, index > 0 && vp.rowBorder]}>
            <View style={vp.rowIcon}><Feather name={row.icon} size={15} color={vp.accentSolid as string} /></View>
            <View style={styles.flex}>
              <Text style={vp.rowTitle}>{row.title}</Text>
              {row.sub ? <Text style={vp.rowSub}>{row.sub}</Text> : null}
            </View>
            {row.trailing ? <Text style={vp.rowTrailing}>{row.trailing}</Text> : null}
          </View>
        ))}
      </View>

      {/* ADR-068 · Waarom nu echt: redactionele zinnen bovenop echte feiten,
          elke zin met zichtbare bron-labels. Alleen voor outside; bij laden
          een rustige placeholder, bij falen valt het blok weg. */}
      {briefing?.state === 'loading' ? (
        <View style={vp.card}>
          <View style={vp.cardHead}>
            <Feather name="globe" size={15} color={vp.accentSolid as string} />
            <Text style={vp.cardTitle}>Waarom nu echt</Text>
          </View>
          <Text style={vp.briefingLoading}>Verse feiten van dit moment worden verzameld…</Text>
        </View>
      ) : briefing?.state === 'live' ? (
        <View style={vp.card}>
          <View style={vp.cardHead}>
            <Feather name="globe" size={15} color={vp.accentSolid as string} />
            <Text style={vp.cardTitle}>Waarom nu echt</Text>
          </View>
          {briefing.value.sentences.map((sentence, index) => (
            <View key={`${sentence.text.slice(0, 24)}-${index}`} style={[vp.briefingRow, index > 0 && vp.rowBorder]}>
              <Text style={vp.briefingText}>{sentence.text}</Text>
              <Text style={vp.briefingSource}>{briefingSourceLine(sentence, briefing.value)}</Text>
            </View>
          ))}
          <Text style={vp.briefingFootnote}>
            {briefing.value.mode === 'model' ? 'Zinnen door de generator, uitsluitend uit de feiten hierboven.' : 'Feiten letterlijk uit de live bronnen (generator niet actief).'}
          </Text>
        </View>
      ) : null}

      {/* Rustige verdieping onder de v2-scènes: betekenisdraad, kaart en
          aankomst, verhaal van de plek — ongewijzigd uit ADR-065, fase 1. */}
      {experience.meaningThread && <MeaningThreadCard experience={experience} compact />}
      {experience.routePlan && <View style={styles.routePlanCard}>
        <Text style={styles.liveEvidenceTitle}>ZO KOM JE ER</Text><Text style={styles.routePlanTitle}>{experience.routePlan.destinationName}</Text>
        {/* ADR-061, punt 3: in-kaart oriëntatie op de bestemming (OSM-tegels
            op native, stijlvolle fallback op web). Alleen oriëntatie; de
            routeapp blijft de route-eigenaar. */}
        {experience.routePlan.destination && <RouteMapPreview latitude={experience.routePlan.destination.latitude} longitude={experience.routePlan.destination.longitude} label={experience.routePlan.destinationName} radiusMeters={experience.routePlan.arrivalPlan?.radiusMeters} />}
        {experience.routePlan.arrivalPlan && <View style={styles.arrivalPlanCard}><Text style={styles.arrivalPlanLabel}>DAAR AANGEKOMEN</Text><Text style={styles.arrivalPlanTitle}>{experience.routePlan.arrivalPlan.label}</Text><Text style={styles.arrivalPlanBody}>{experience.routePlan.arrivalPlan.instruction}</Text><Text style={styles.arrivalPlanMeta}>{experience.routePlan.arrivalPlan.durationMinutes} min{experience.routePlan.arrivalPlan.radiusMeters ? ` · tot circa ${experience.routePlan.arrivalPlan.radiusMeters} m rond het anker` : ''}</Text><Text style={styles.arrivalPlanReturn}>{experience.routePlan.arrivalPlan.returnTrigger}</Text></View>}
        <Text style={styles.routeGuard}>{experience.routePlan.natureGuard}</Text>
      </View>}
      {experience.placeKnowledge && <View style={styles.placeKnowledgeCard}>
        <Text style={styles.placeKnowledgeLabel}>VERHAAL VAN DE PLEK</Text>
        <Text style={styles.placeKnowledgeTitle}>{experience.placeKnowledge.title}</Text>
        <Text style={styles.placeKnowledgeBody}>{experience.placeKnowledge.summary}</Text>
        <Pressable accessibilityRole="link" accessibilityLabel={`Open bron over ${experience.placeKnowledge.title}`} onPress={() => Linking.openURL(experience.placeKnowledge!.sourceUrl).catch(() => undefined)}><Text style={[styles.placeKnowledgeSource, { color: phase.prepare.text }]}>{experience.placeKnowledge.sourceLabel} · Bekijk bron <Ionicons name="open-outline" size={11} color={phase.prepare.text} /></Text></Pressable>
      </View>}
      {/* ADR-065, fase 1: maximaal één zichtbare vraag — met wie. Dit is de
          meest ervaringsgerichte keuze; de rest zijn slimme standaardwaarden. */}
      <Text style={styles.fieldLabel}>MET WIE BELEEF JE DIT?</Text><View style={styles.chipRow}>{companyChoices.filter((item) => supportedCompanies.includes(item.id)).map((item) => <ChoiceChip key={item.id} label={item.label} selected={company === item.id} onPress={() => chooseCompany(item.id)} />)}</View>
      <View style={styles.readySummary}>
        <View style={styles.flex}><Text style={styles.readySummaryLabel}>ALLES STAAT KLAAR</Text><Text style={styles.readySummaryTitle}>{companyLabel}{experience.routePlan ? ` · ${transportLabels[transport].toLowerCase()}` : ''} · {guideDepthLabel}</Text></View>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: detailsOpen }} onPress={() => setDetailsOpen((value) => !value)} style={styles.adjustButton}><Text style={styles.adjustButtonText}>{detailsOpen ? 'Sluit' : 'Aanpassen'}</Text></Pressable>
      </View>
      {detailsOpen && <>
      {experience.routePlan && <>
      <Text style={styles.fieldLabel}>HOE GA JE?</Text><View style={styles.chipRow}>{(['walking', 'cycling'] as TransportMode[]).map((mode) => <ChoiceChip key={mode} label={transportLabels[mode]} selected={transport === mode} onPress={() => setTransport(mode)} />)}</View>
      </>}
      {company !== 'solo' && <View style={styles.sharedPlanCard}>
        <Text style={styles.expectationLabel}>SAMEN AFSTEMMEN</Text>
        <Text style={styles.sharedPlanTitle}>Hoe komen jullie samen bij het begin?</Text>
        <View style={styles.guideDepthList}>
          <Pressable onPress={() => { impactLight(); setCoordination('leave-together'); }} style={[styles.guideDepthChoice, coordination === 'leave-together' && styles.guideDepthChoiceSelected]}><View style={styles.flex}><Text style={styles.guideDepthTitle}>Samen vertrekken</Text><Text style={styles.guideDepthBody}>Eén toestel kan de voorbereiding en gids dragen.</Text></View><Ionicons name={coordination === 'leave-together' ? 'radio-button-on' : 'radio-button-off'} size={17} color={coordination === 'leave-together' ? colors.accent : colors.muted} /></Pressable>
          <Pressable onPress={() => { impactLight(); setCoordination('meet-there'); }} style={[styles.guideDepthChoice, coordination === 'meet-there' && styles.guideDepthChoiceSelected]}><View style={styles.flex}><Text style={styles.guideDepthTitle}>Ontmoet bij het startpunt</Text><Text style={styles.guideDepthBody}>Iedereen regelt de eigen reis; de ervaring begint samen.</Text></View><Ionicons name={coordination === 'meet-there' ? 'radio-button-on' : 'radio-button-off'} size={17} color={coordination === 'meet-there' ? colors.accent : colors.muted} /></Pressable>
        </View>
        {shared ? <View style={styles.participantList}>
          {shared.participants.map((participant) => <View key={participant.id} style={styles.participantRow}><View style={[styles.participantAvatar, participant.status === 'ready' && styles.participantAvatarReady]}><Text style={styles.participantAvatarText}>{participant.name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.flex}><Text style={styles.participantName}>{participant.name}</Text><Text style={styles.participantStatus}>{participant.role === 'host' ? 'Organiseert' : participant.status === 'ready' ? 'Doet mee op dit toestel' : 'Uitnodiging gedeeld'}</Text></View></View>)}
          <Text style={styles.localSharedNote}>Alleen deze ervaring wordt gedeeld. Profiel, agenda, locatiegeschiedenis en redenen achter de aanbeveling blijven privé.</Text>
        </View> : null}
        {shared?.role !== 'guest' && <Pressable onPress={shareExperience} style={styles.shareCard}><View style={styles.shareMark}><Ionicons name="share-social-outline" size={18} color={colors.accent} /></View><View style={styles.flex}><Text style={styles.shareTitle}>{shared ? 'Deel uitnodiging opnieuw' : 'Nodig iemand uit'}</Text><Text style={styles.shareBody}>De ontvanger kan de kaart openen, bekijken en meedoen op het eigen toestel.</Text></View><Ionicons name="arrow-forward" size={21} color={colors.gold} /></Pressable>}
        {shareStatus ? <Text style={styles.shareStatus}>{shareStatus}</Text> : null}
        {shared && <Pressable onPress={() => { setShared(undefined); setShareStatus('Gedeelde voorbereiding is op dit toestel gestopt.'); }} style={styles.stopSharingButton}><Text style={styles.stopSharingText}>{shared.role === 'guest' ? 'Verlaat gedeelde voorbereiding' : 'Trek deze lokale uitnodiging in'}</Text></Pressable>}
      </View>}
      <Text style={styles.fieldLabel}>HOEVEEL BEGELEIDING WIL JE?</Text><View style={styles.guideDepthList}>
        {([{ id: 'quiet', title: 'Rustig', body: 'Alleen de huidige aanwijzing; de gids blijft op afroep beschikbaar.' }, { id: 'guide', title: 'Gids', body: 'Huidige uitleg en actuele bronnen precies wanneer ze helpen.' }, { id: 'deep', title: 'Verdieping', body: 'Ook extra verhalen, alle inzichten en praktische achtergrond.' }] as Array<{ id: GuideDepth; title: string; body: string }>).map((item) => <Pressable accessibilityRole="radio" accessibilityState={{ selected: guideDepth === item.id }} key={item.id} onPress={() => { impactLight(); setGuideDepth(item.id); }} style={[styles.guideDepthChoice, guideDepth === item.id && styles.guideDepthChoiceSelected]}><View style={styles.flex}><Text style={styles.guideDepthTitle}>{item.title}</Text><Text style={styles.guideDepthBody}>{item.body}</Text></View><Ionicons name={guideDepth === item.id ? 'radio-button-on' : 'radio-button-off'} size={17} color={guideDepth === item.id ? colors.accent : colors.muted} /></Pressable>)}
      </View>
      </>}
      {/* Waarom/bron-laag (ADR-065, fase 1): eerlijkheid blijft één tik dieper
          beschikbaar — actuele aanwijzingen met bronnen, en de aannames achter
          tijden en geldigheid. Nooit als hoofdtekst. */}
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: whyOpen }} onPress={() => setWhyOpen((value) => !value)} style={styles.learningDisclosure}><View style={styles.flex}><Text style={styles.learningDisclosureTitle}>Waarom dit plan?</Text><Text style={styles.learningDisclosureBody}>{whyOpen ? 'Sluit de uitleg' : 'Actuele aanwijzingen, bronnen en aannames'}</Text></View><Ionicons name={whyOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.gold} /></Pressable>
      {whyOpen && <>
      {freshEvidence.length ? <View style={styles.prepareLiveCard}><Text style={styles.liveEvidenceTitle}>WAT DE WERELD NU LAAT ZIEN</Text>{freshEvidence.slice(0, 3).map((evidence) => <View key={`${evidence.sourceName}-${evidence.label}`} style={styles.prepareLiveRow}><View style={styles.liveEvidenceDot} /><View style={styles.flex}><Text style={styles.liveEvidenceLabel}>{evidence.label}</Text><Text style={styles.liveEvidenceMeta}>{evidence.sourceName} · {evidence.certainty === 'observation' ? 'recente waarneming' : 'actuele verwachting'} · {evidence.freshnessLabel.toLowerCase()}</Text></View></View>)}</View> : <View style={styles.editorialDepthCard}><Text style={styles.expectationLabel}>TIJDENS JE ERVARING</Text><Text style={styles.editorialDepthText}>{experience.steps.find((step) => step.insight)?.insight?.title ?? experience.wonder}</Text>{guide.evidence.some((item) => item.freshness === 'expired') ? <Text style={styles.expiredEvidenceText}>Eerdere broncontext is verlopen en wordt niet meer als actuele aanwijzing gebruikt.</Text> : null}</View>}
      {experience.routePlan && <View style={styles.commitmentCard}>
        <Text style={styles.commitmentLabel}>ZO ZIJN TIJDEN EN BRONNEN OPGEBOUWD</Text>
        <Text style={styles.commitmentBody}>Je gaat {transportLabels[transport].toLowerCase()} · rustig geschat (conservatieve voorinschatting){experience.routePlan.sourceLabel ? ` · ${experience.routePlan.sourceLabel}` : ''}</Text>
        {transport !== experience.routePlan.mode && <Text style={styles.commitmentBody}>De tijdsinschatting is samengesteld voor {transportLabels[experience.routePlan.mode].toLowerCase()}; jouw keuze past het plan aan zonder die eerlijke marge te verkorten.</Text>}
        <Text style={styles.commitmentBody}>{experience.routePlan.routeCapability?.detail ?? routingCapability().detail}</Text>
        {experience.routePlan.expiresAt && <Text style={styles.commitmentBody}>Bronvenster geldig tot {new Date(experience.routePlan.expiresAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}. Vlak voor vertrek volgt een nieuwe geldigheidscontrole.</Text>}
        {experience.routePlan.recheckLabel && <Text style={styles.commitmentBody}>{experience.routePlan.recheckLabel}</Text>}
      </View>}
      <View style={styles.commitmentCard}><Text style={styles.commitmentLabel}>ZO IS DIT PLAN SAMENGESTELD</Text><Text style={styles.commitmentBody}>{guide.coverageLabel}{guide.compositionLabel ? ` · ${guide.compositionLabel}` : ''}.</Text></View>
      </>}
    </ScrollView>
    {/* Go-CTA volgens concept: titel + eerlijke subregel + pijl; start
        Presence via de bestaande flow (push). */}
    <View style={styles.stickyActionBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${company === 'solo' ? 'Ik ga nu' : 'Wij gaan beginnen'} — ${ctaSubline(guideDepth, departure.end)}`}
        onPress={() => { impactMedium(); onStart(company, guideDepth, shared ? { ...shared, coordination } : undefined, transport); }}
        style={({ pressed }) => [vp.cta, pressed && vp.pressed]}
      >
        <View>
          <Text style={vp.ctaTitle}>{company === 'solo' ? 'Ik ga nu' : 'Wij gaan beginnen'}</Text>
          <Text style={vp.ctaSub}>{ctaSubline(guideDepth, departure.end)}</Text>
        </View>
        <Feather name="arrow-right" size={20} color={vp.accentInkSolid as string} />
      </Pressable>
    </View>
    </View>
    </FlowFrame>
  );
}

// Visuele taal (concept v2): zelfde palet als R1/R2 — near-black podium,
// glaspanelen, accentgroen uit de #34c772-familie, serif display voor de
// countdown. De lichte sibling volgt de dagpalet-tokens (ADR-064); alle
// tekst/achtergrond-paren houden WCAG AA. Detectie via palet-identiteit,
// zoals schemeStyles het aanlevert.
const vp = schemeStyles(({ colors: schemeColors }) => {
  const evening = schemeColors === palettes.dark.colors;
  const palette = evening
    ? {
        ink: '#F5F4F0',
        ink2: 'rgba(245,244,240,0.62)',
        accent: '#34C772',
        accentInk: '#06130C',
        glass: 'rgba(245,244,240,0.07)',
        line: 'rgba(245,244,240,0.12)',
        track: 'rgba(245,244,240,0.1)',
        rowLine: 'rgba(245,244,240,0.07)',
        iconTile: 'rgba(52,199,114,0.12)',
        gradientStart: 'rgba(52,199,114,0.16)',
        gradientEnd: 'rgba(52,199,114,0.05)',
        countBorder: 'rgba(52,199,114,0.35)',
        glow: 'rgba(52,199,114,0.5)',
      }
    : {
        ink: schemeColors.ink,
        ink2: 'rgba(34,37,45,0.66)',
        accent: schemeColors.accent,
        accentInk: schemeColors.onAccent,
        glass: 'rgba(34,37,45,0.05)',
        line: 'rgba(34,37,45,0.12)',
        track: 'rgba(34,37,45,0.14)',
        rowLine: 'rgba(34,37,45,0.08)',
        iconTile: 'rgba(32,128,73,0.10)',
        gradientStart: 'rgba(32,128,73,0.14)',
        gradientEnd: 'rgba(32,128,73,0.05)',
        countBorder: 'rgba(32,128,73,0.30)',
        glow: 'rgba(32,128,73,0.35)',
      };
  type VoorpretStyles = {
    inkSolid: string;
    accentSolid: string;
    accentInkSolid: string;
    gradientStart: string;
    gradientEnd: string;
    head: ViewStyle;
    back: ViewStyle;
    headTitle: TextStyle;
    headSub: TextStyle;
    count: ViewStyle;
    countLabel: TextStyle;
    countBigRow: ViewStyle;
    countBig: TextStyle;
    countMeta: TextStyle;
    countBarTrack: ViewStyle;
    countBarFill: ViewStyle;
    countBarLabels: ViewStyle;
    countBarLabel: TextStyle;
    card: ViewStyle;
    cardHead: ViewStyle;
    cardTitle: TextStyle;
    row: ViewStyle;
    rowBorder: ViewStyle;
    rowIcon: ViewStyle;
    stepNo: ViewStyle;
    stepNoText: TextStyle;
    rowTitle: TextStyle;
    rowSub: TextStyle;
    rowTrailing: TextStyle;
    briefingLoading: TextStyle;
    briefingRow: ViewStyle;
    briefingText: TextStyle;
    briefingSource: TextStyle;
    briefingFootnote: TextStyle;
    cta: ViewStyle;
    ctaTitle: TextStyle;
    ctaSub: TextStyle;
    pressed: ViewStyle;
  };
  const stylesDef: VoorpretStyles = {
    inkSolid: palette.ink,
    accentSolid: palette.accent,
    accentInkSolid: palette.accentInk,
    gradientStart: palette.gradientStart,
    gradientEnd: palette.gradientEnd,
    head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 12 },
    back: {
      width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
      backgroundColor: palette.glass, borderWidth: 1, borderColor: palette.line,
    },
    headTitle: { fontSize: 14.5, fontWeight: '600', color: palette.ink },
    headSub: { fontSize: 11.5, color: palette.ink2, marginTop: 1 },
    count: {
      marginHorizontal: 12, borderRadius: 26, padding: 18,
      borderWidth: 1, borderColor: palette.countBorder,
      shadowColor: '#000000', shadowOpacity: 0.4, shadowRadius: 30, shadowOffset: { width: 0, height: 16 }, elevation: 7,
    },
    countLabel: { fontSize: 10.5, letterSpacing: 2.1, fontWeight: '700', color: palette.accent, textTransform: 'uppercase' },
    countBigRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 6, flexWrap: 'wrap' },
    countBig: {
      fontFamily: typography.displayFamilyMedium, fontWeight: '400', fontSize: 44,
      letterSpacing: -0.9, color: palette.ink,
    },
    countMeta: { fontSize: 13, fontWeight: '600', color: palette.ink2 },
    countBarTrack: { marginTop: 12, height: 5, borderRadius: 999, backgroundColor: palette.track, overflow: 'hidden' },
    countBarFill: {
      height: '100%', borderRadius: 999, backgroundColor: palette.accent,
      shadowColor: palette.accent, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
    },
    countBarLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    countBarLabel: { fontSize: 10, color: palette.ink2, fontWeight: '500' },
    card: {
      marginHorizontal: 12, marginTop: 10, borderRadius: 22, paddingHorizontal: 15, paddingVertical: 14,
      backgroundColor: palette.glass, borderWidth: 1, borderColor: palette.line,
    },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
    cardTitle: { fontSize: 11, letterSpacing: 1.6, fontWeight: '700', color: palette.ink2, textTransform: 'uppercase' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 7 },
    rowBorder: { borderTopWidth: 1, borderTopColor: palette.rowLine },
    rowIcon: {
      width: 32, height: 32, borderRadius: 11, backgroundColor: palette.iconTile,
      alignItems: 'center', justifyContent: 'center',
    },
    stepNo: {
      width: 24, height: 24, borderRadius: 12, backgroundColor: palette.iconTile,
      borderWidth: 1, borderColor: palette.line,
      alignItems: 'center', justifyContent: 'center',
    },
    stepNoText: { fontSize: 10.5, fontWeight: '700', color: palette.accent },
    rowTitle: { fontSize: 13, fontWeight: '600', color: palette.ink },
    rowSub: { fontSize: 11, color: palette.ink2, marginTop: 1 },
    rowTrailing: { fontSize: 11.5, fontWeight: '600', color: palette.ink2 },
    briefingLoading: { fontSize: 12, color: palette.ink2, fontWeight: '500', paddingVertical: 4 },
    briefingRow: { paddingVertical: 7, gap: 3 },
    briefingText: { fontSize: 13.5, lineHeight: 20, color: palette.ink, fontWeight: '500' },
    briefingSource: { fontSize: 9.5, lineHeight: 13, color: palette.ink2, fontWeight: '600' },
    briefingFootnote: { fontSize: 9.5, lineHeight: 13, color: palette.ink2, marginTop: 8, fontStyle: 'italic' },
    cta: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: palette.accent, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 20,
      shadowColor: palette.glow, shadowOpacity: 0.9, shadowRadius: 26, shadowOffset: { width: 0, height: 10 }, elevation: 10,
    },
    ctaTitle: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.1, color: palette.accentInk },
    ctaSub: { fontSize: 10.5, fontWeight: '600', color: palette.accentInk, opacity: 0.7, marginTop: 1 },
    pressed: { opacity: 0.92 },
  };
  return stylesDef;
});
