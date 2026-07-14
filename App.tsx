import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ImageBackground,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  byId,
  Experience,
  ExperienceKind,
  experiences,
  Surface,
} from './src/product/experienceModel';
import {
  buildToday,
  Company,
  dayPartLabels,
  DayPart,
  defaultPrototypeContext,
  LocalDecision,
  PersonalLearningContext,
  profileLabels,
  PrototypeContext,
  PrototypeProfile,
  rankForMoment,
  TodayDecision,
} from './src/product/localIntelligence';
import {
  applyLearning,
  applyReflection,
  completeOnboarding,
  defaultPersonalProfile,
  directionLabels,
  directionTerms,
  experienceKindLabels,
  forgetLearningEvent,
  forgetReflection,
  hydratePersonalProfile,
  initiativeLabels,
  LearningOutcome,
  PersonalProfile,
  ReflectionAspect,
  ReflectionInput,
  reflectionAspectLabels,
  resetLearning,
} from './src/profile/personalModel';
import {
  composeLiveExperience,
  composeNearbyPlaceExperience,
  Coordinates,
  futureSourceRegistry,
  LiveWorldSnapshot,
  loadLiveWorld,
  loadPlaceContext,
} from './src/liveworld/liveWorld';
import {
  CalendarContextSnapshot,
  emptyCalendarContext,
  formatWindow,
  loadCalendarContext,
} from './src/context/calendarContext';
import { clearLiveWorldCache, loadLiveWorldCache, saveLiveWorldCache, snapshotAgeMinutes } from './src/liveworld/liveCache';
import { createWorldContext, ResolvedContentCatalog, resolveContentCatalog } from './src/content/contentCatalog';

type FlowStage = 'promise' | 'prepare' | 'presence' | 'remember' | 'profile' | null;
type Memory = { id: string; title: string; date: string; image: string; note: string };

const colors = {
  ink: '#071013', panel: '#101A1D', bone: '#F4EEE3', muted: '#AEB4AE',
  green: '#A4C55D', gold: '#D9B36B', line: 'rgba(244,238,227,0.14)',
};
const memoryKey = 'momentum.memories.v2';
const contextKey = 'momentum.prototype-context.v1';
const personalProfileKey = 'momentum.personal-profile.v1';
const timeOptions = [15, 30, 60, 120];
const defaultRegion = { coordinates: { latitude: 53.325, longitude: 5.999 }, label: 'Dokkum proefcontext · niet gebruikt voor keuzes' };

export default function App() {
  const { height } = useWindowDimensions();
  const [surface, setSurface] = useState<Surface>('now');
  const [flowStage, setFlowStage] = useState<FlowStage>(null);
  const [selected, setSelected] = useState<Experience>(byId('wadden-light'));
  const [origin, setOrigin] = useState<Surface>('now');
  const [prototypeContext, setPrototypeContext] = useState<PrototypeContext>(defaultPrototypeContext);
  const [contextHydrated, setContextHydrated] = useState(false);
  const [personalProfile, setPersonalProfile] = useState<PersonalProfile>(defaultPersonalProfile);
  const [personalHydrated, setPersonalHydrated] = useState(false);
  const [liveWorld, setLiveWorld] = useState<LiveWorldSnapshot | null>(null);
  const [selectionLocationConfirmed, setSelectionLocationConfirmed] = useState(false);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveMessage, setLiveMessage] = useState('Live bronnen worden gecontroleerd…');
  const [calendarContext, setCalendarContext] = useState<CalendarContextSnapshot>(emptyCalendarContext);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([
    { id: 'seed-1', title: 'Licht boven het Wad', date: '8 juli', image: byId('wadden-light').image, note: 'De lucht werd stiller dan verwacht.' },
    { id: 'seed-2', title: 'Een sterk halfuur', date: '5 juli', image: byId('kettlebell-focus').image, note: 'Kort, scherp en precies genoeg.' },
  ]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.backgroundColor = colors.ink;
      document.body.style.backgroundColor = colors.ink;
    }
    AsyncStorage.getItem(memoryKey).then((value) => {
      if (value) setMemories(JSON.parse(value));
    }).catch(() => undefined);
    AsyncStorage.getItem(contextKey).then((value) => {
      if (value) setPrototypeContext({ ...defaultPrototypeContext(), ...JSON.parse(value) });
    }).catch(() => undefined).finally(() => setContextHydrated(true));
    AsyncStorage.getItem(personalProfileKey).then((value) => {
      if (value) setPersonalProfile(hydratePersonalProfile(JSON.parse(value)));
    }).catch(() => undefined).finally(() => setPersonalHydrated(true));
    loadLiveWorldCache(defaultRegion.coordinates).then((cached) => {
      if (cached) { setLiveWorld(cached); setLiveMessage(`Eerdere regionale context · ${Math.round(snapshotAgeMinutes(cached))} min oud`); }
      return loadLiveWorld(defaultRegion.coordinates, defaultRegion.label);
    }).then((snapshot) => {
      setLiveWorld(snapshot); setLiveLoading(false); setLiveMessage('Snelle live bronnen bijgewerkt · plaatsen volgen'); saveLiveWorldCache(snapshot).catch(() => undefined);
      loadPlaceContext(snapshot).then((enhanced) => { setLiveWorld(enhanced); setLiveMessage('Live bronnen bijgewerkt'); saveLiveWorldCache(enhanced).catch(() => undefined); }).catch(() => undefined);
    }).catch(() => { setLiveLoading(false); setLiveMessage('Live bronnen konden niet worden bijgewerkt'); });
    loadCalendarContext(false).then(setCalendarContext).catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(memoryKey, JSON.stringify(memories)).catch(() => undefined);
  }, [memories]);

  useEffect(() => {
    if (!contextHydrated) return;
    AsyncStorage.setItem(contextKey, JSON.stringify(prototypeContext)).catch(() => undefined);
  }, [contextHydrated, prototypeContext]);

  useEffect(() => {
    if (!personalHydrated) return;
    AsyncStorage.setItem(personalProfileKey, JSON.stringify(personalProfile)).catch(() => undefined);
  }, [personalHydrated, personalProfile]);

  const effectiveContext = useMemo(() => calendarContext.state === 'live' && calendarContext.currentFreeMinutes
    ? { ...prototypeContext, availableMinutes: Math.max(15, Math.min(120, calendarContext.currentFreeMinutes)) }
    : prototypeContext, [calendarContext.currentFreeMinutes, calendarContext.state, prototypeContext]);
  const liveExperiences = useMemo(() => liveWorld && selectionLocationConfirmed ? [composeLiveExperience(liveWorld, effectiveContext), composeNearbyPlaceExperience(liveWorld, effectiveContext)].filter((item): item is Experience => Boolean(item)) : [], [effectiveContext, liveWorld, selectionLocationConfirmed]);
  const contentCatalog = useMemo(() => resolveContentCatalog(createWorldContext(liveWorld?.coordinates ?? defaultRegion.coordinates, new Date(), 'nl', selectionLocationConfirmed)), [liveWorld?.coordinates, selectionLocationConfirmed]);
  const candidatePool = useMemo(() => [...liveExperiences, ...contentCatalog.experiences], [contentCatalog.experiences, liveExperiences]);
  const learningContext = useMemo(() => ({
    kindAffinity: personalProfile.kindAffinity,
    blockedExperienceIds: personalProfile.blockedExperienceIds,
    favoriteExperienceIds: personalProfile.favoriteExperienceIds,
    recentExperienceIds: personalProfile.recentExperienceIds,
    directionTerms: directionTerms(personalProfile),
    durationBiasMinutes: personalProfile.durationBiasMinutes,
    intensityBalance: personalProfile.intensityBalance,
    maxTravelMinutes: personalProfile.maxTravelMinutes,
    travelBiasMinutes: personalProfile.travelBiasMinutes,
  }), [personalProfile]);
  const primaryDecision = useMemo(() => rankForMoment(effectiveContext, '', [], candidatePool, learningContext), [candidatePool, effectiveContext, learningContext]);
  const primaryExperience = primaryDecision.selected?.experience ?? byId('work-reset');
  const dayDecisions = useMemo(() => buildToday(effectiveContext, liveExperiences, learningContext, calendarContext.state === 'live' ? calendarContext.freeWindows : undefined, contentCatalog.experiences), [calendarContext.freeWindows, calendarContext.state, contentCatalog.experiences, effectiveContext, learningContext, liveExperiences]);

  const connectCalendar = async () => {
    setCalendarLoading(true);
    try { setCalendarContext(await loadCalendarContext(true)); }
    finally { setCalendarLoading(false); }
  };

  const refreshLiveWorld = async (coordinates: Coordinates = liveWorld?.coordinates ?? defaultRegion.coordinates, label = liveWorld?.regionLabel ?? defaultRegion.label) => {
    setLiveLoading(true); setLiveMessage('Live bronnen worden gecontroleerd…');
    try {
      const snapshot = await loadLiveWorld(coordinates, label);
      setLiveWorld(snapshot); setLiveMessage('Snelle live bronnen bijgewerkt · plaatsen volgen'); saveLiveWorldCache(snapshot).catch(() => undefined);
      loadPlaceContext(snapshot).then((enhanced) => { setLiveWorld(enhanced); setLiveMessage('Live bronnen bijgewerkt'); saveLiveWorldCache(enhanced).catch(() => undefined); }).catch(() => undefined);
      return true;
    } catch {
      setLiveMessage('Live bronnen konden niet worden bijgewerkt');
      return false;
    } finally { setLiveLoading(false); }
  };

  const useApproximateLocation = async () => {
    setLiveLoading(true); setLiveMessage('Toestemming voor globale omgeving wordt gevraagd…');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') { setLiveMessage('Locatie niet gedeeld · alleen wereldwijde ervaringen worden gekozen'); return; }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const coordinates = { latitude: Number(position.coords.latitude.toFixed(2)), longitude: Number(position.coords.longitude.toFixed(2)) };
      if (await refreshLiveWorld(coordinates, 'Jouw globale omgeving')) setSelectionLocationConfirmed(true);
    } catch { setLiveMessage('Globale locatie kon niet worden gebruikt'); }
    finally { setLiveLoading(false); }
  };

  const openExperience = (experience: Experience, from: Surface, stage: FlowStage = 'promise') => {
    setSelected(experience);
    setOrigin(from);
    setFlowStage(stage);
  };

  const closeFlow = () => setFlowStage(null);
  const finishExperience = (input: ReflectionInput) => {
    const memory: Memory = {
      id: `${selected.id}-${Date.now()}`,
      title: selected.title,
      date: 'Vandaag',
      image: selected.image,
      note: input.note || 'Een moment dat de moeite waard was.',
    };
    setMemories((current) => [memory, ...current.filter((item) => item.id !== selected.id)].slice(0, 12));
    setPersonalProfile((current) => applyReflection(current, selected, input));
    setFlowStage(null);
    setSurface('lifebook');
  };

  const finishOnboarding = (profile: PersonalProfile) => {
    const completed = completeOnboarding(profile);
    setPersonalProfile(completed);
    setPrototypeContext((current) => ({
      ...current,
      company: completed.defaultCompany,
      hasKettlebell: completed.equipment.kettlebell,
      profile: completed.preferredKinds.includes('connect') ? 'family' : completed.preferredKinds.includes('movement') ? 'mover' : completed.preferredKinds.includes('outside') ? 'explorer' : 'balanced',
    }));
  };

  if (!personalHydrated) return <View style={styles.root} />;
  if (!personalProfile.onboardingComplete) return <OnboardingScreen initial={personalProfile} onComplete={finishOnboarding} />;

  return (
    <View style={[styles.root, { minHeight: height }]}>
      <StatusBar style="light" />
      <View pointerEvents="none" style={styles.ambientGold} />
      <View pointerEvents="none" style={styles.ambientGreen} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.appFrame}>
          {flowStage === null && (
            <>
              {surface === 'now' && <NowScreen firstName={personalProfile.firstName} experience={primaryExperience} decision={primaryDecision} context={effectiveContext} calendar={calendarContext} liveWorld={liveWorld} liveLoading={liveLoading} onOpen={(item, stage) => openExperience(item, 'now', stage)} onProfile={() => setFlowStage('profile')} onDiscover={() => setSurface('discover')} onFeedback={(outcome) => setPersonalProfile((current) => applyLearning(current, primaryExperience, outcome))} />}
              {surface === 'today' && <TodayScreen decisions={dayDecisions} calendar={calendarContext} onOpen={(item) => openExperience(item, 'today')} />}
              {surface === 'discover' && <DiscoverScreen context={prototypeContext} candidatePool={candidatePool} learning={learningContext} onOpen={(item) => openExperience(item, 'discover')} />}
              {surface === 'lifebook' && <LifeBookScreen memories={memories} onOpen={(item) => { setPersonalProfile((current) => applyLearning(current, item, 'repeat')); openExperience(item, 'lifebook'); }} />}
              <BottomNav surface={surface} onChange={setSurface} />
            </>
          )}
          {flowStage === 'promise' && <PromiseScreen experience={selected} onClose={closeFlow} onAccept={() => setFlowStage('prepare')} />}
          {flowStage === 'prepare' && <PrepareScreen experience={selected} onBack={() => setFlowStage('promise')} onStart={() => setFlowStage('presence')} />}
          {flowStage === 'presence' && <PresenceScreen experience={selected} personal={personalProfile} onBack={() => setFlowStage('prepare')} onFinish={() => setFlowStage('remember')} />}
          {flowStage === 'remember' && <RememberScreen experience={selected} onSkip={() => { setFlowStage(null); setSurface(origin); }} onSave={finishExperience} />}
          {flowStage === 'profile' && <ProfileScreen personal={personalProfile} context={prototypeContext} calendar={calendarContext} calendarLoading={calendarLoading} liveWorld={liveWorld} contentCatalog={contentCatalog} liveLoading={liveLoading} liveMessage={liveMessage} onChange={setPrototypeContext} onPersonalChange={setPersonalProfile} onForgetReflection={(id) => setPersonalProfile((current) => forgetReflection(current, id))} onForgetLearningEvent={(id) => setPersonalProfile((current) => forgetLearningEvent(current, id))} onResetLearning={() => setPersonalProfile((current) => resetLearning(current))} onRedoOnboarding={() => setPersonalProfile((current) => ({ ...current, onboardingComplete: false }))} onClearLiveCache={() => { clearLiveWorldCache().catch(() => undefined); setLiveMessage('Regionale live cache gewist'); }} onConnectCalendar={connectCalendar} onRefresh={() => refreshLiveWorld()} onUseLocation={useApproximateLocation} onClose={closeFlow} />}
        </View>
      </SafeAreaView>
    </View>
  );
}

function OnboardingScreen({ initial, onComplete }: { initial: PersonalProfile; onComplete: (profile: PersonalProfile) => void }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(initial);
  const kinds = Object.keys(experienceKindLabels) as ExperienceKind[];
  const companyOptions: Array<{ id: Company; label: string }> = [
    { id: 'solo', label: 'Vaak alleen' }, { id: 'together', label: 'Vaak samen' }, { id: 'family', label: 'Vaak met gezin' },
  ];
  const next = () => step === 4 ? onComplete(draft) : setStep((value) => value + 1);
  const canContinue = step !== 1 || draft.preferredKinds.length > 0;
  return <View style={styles.root}>
    <StatusBar style="light" />
    <SafeAreaView style={styles.safe}><View style={styles.appFrame}>
      <ScrollView contentContainerStyle={styles.onboardingScroll} keyboardShouldPersistTaps="handled">
        <View style={styles.onboardingProgress}>{[0, 1, 2, 3, 4].map((item) => <View key={item} style={[styles.onboardingProgressPart, item <= step && styles.onboardingProgressActive]} />)}</View>
        {step === 0 && <>
          <Text style={styles.eyebrow}>WELKOM BIJ MOMENTUM</Text><Text style={styles.onboardingTitle}>Minder zoeken. Meer beleven.</Text>
          <Text style={styles.onboardingBody}>Momentum helpt je één passende volgende stap te zien en verdwijnt daarna weer naar de achtergrond. We beginnen zonder agenda, locatie of gezondheidsdata.</Text>
          <Text style={styles.fieldLabel}>HOE MOGEN WE JE NOEMEN?</Text>
          <TextInput value={draft.firstName} onChangeText={(firstName) => setDraft({ ...draft, firstName })} placeholder="Je voornaam (optioneel)" placeholderTextColor="rgba(174,180,174,0.52)" style={styles.singleInput} />
        </>}
        {step === 1 && <>
          <Text style={styles.eyebrow}>JOUW RICHTING</Text><Text style={styles.onboardingTitle}>Waar wil je vaker ruimte voor?</Text>
          <Text style={styles.onboardingBody}>Dit zijn startvoorkeuren, geen hokjes. Kies er gerust meerdere; je kunt alles later wijzigen.</Text>
          <View style={styles.onboardingChoices}>{kinds.map((kind) => <Pressable key={kind} onPress={() => setDraft({ ...draft, preferredKinds: draft.preferredKinds.includes(kind) ? draft.preferredKinds.filter((item) => item !== kind) : [...draft.preferredKinds, kind] })} style={[styles.onboardingChoice, draft.preferredKinds.includes(kind) && styles.onboardingChoiceSelected]}><Text style={styles.onboardingChoiceTitle}>{experienceKindLabels[kind]}</Text><Text style={styles.profileChoiceMark}>{draft.preferredKinds.includes(kind) ? '●' : '○'}</Text></Pressable>)}</View>
          <TextInput value={draft.aspiration} onChangeText={(aspiration) => setDraft({ ...draft, aspiration })} placeholder="Bijv. vaker echt iets doen met mijn vrije tijd" placeholderTextColor="rgba(174,180,174,0.52)" style={styles.singleInput} />
        </>}
        {step === 2 && <>
          <Text style={styles.eyebrow}>PRAKTISCHE BASIS</Text><Text style={styles.onboardingTitle}>Wat past meestal bij jouw leven?</Text>
          <Text style={styles.onboardingBody}>Hiermee voorkomt Momentum voorstellen die praktisch niet uitvoerbaar zijn.</Text>
          <Text style={styles.fieldLabel}>MET WIE?</Text><View style={styles.chipRow}>{companyOptions.map((item) => <ChoiceChip key={item.id} label={item.label} selected={draft.defaultCompany === item.id} onPress={() => setDraft({ ...draft, defaultCompany: item.id })} />)}</View>
          <Text style={styles.fieldLabel}>WAT HEB JE BESCHIKBAAR?</Text><View style={styles.chipRow}>
            <ChoiceChip label="Kettlebell" selected={draft.equipment.kettlebell} onPress={() => setDraft({ ...draft, equipment: { ...draft.equipment, kettlebell: !draft.equipment.kettlebell } })} />
            <ChoiceChip label="Fiets" selected={draft.equipment.bike} onPress={() => setDraft({ ...draft, equipment: { ...draft.equipment, bike: !draft.equipment.bike } })} />
            <ChoiceChip label="Auto" selected={draft.equipment.car} onPress={() => setDraft({ ...draft, equipment: { ...draft.equipment, car: !draft.equipment.car } })} />
          </View>
        </>}
        {step === 3 && <>
          <Text style={styles.eyebrow}>AFSTAND</Text><Text style={styles.onboardingTitle}>Hoe ver mag een mooi moment beginnen?</Text>
          <Text style={styles.onboardingBody}>Momentum telt reistijd mee. Een bijzondere kans mag verder weg zijn, maar alleen binnen jouw grens.</Text>
          <View style={styles.onboardingChoices}>{[10, 20, 35, 60].map((minutes) => <Pressable key={minutes} onPress={() => setDraft({ ...draft, maxTravelMinutes: minutes })} style={[styles.onboardingChoice, draft.maxTravelMinutes === minutes && styles.onboardingChoiceSelected]}><Text style={styles.onboardingChoiceTitle}>Maximaal {minutes} minuten reizen</Text><Text style={styles.profileChoiceMark}>{draft.maxTravelMinutes === minutes ? '●' : '○'}</Text></Pressable>)}</View>
        </>}
        {step === 4 && <>
          <Text style={styles.eyebrow}>INITIATIEF</Text><Text style={styles.onboardingTitle}>Wanneer mag Momentum meedenken?</Text>
          <Text style={styles.onboardingBody}>Je opent altijd zelf de deur. Proactieve meldingen worden pas later gebouwd en vragen dan afzonderlijk toestemming.</Text>
          <View style={styles.onboardingChoices}>{(Object.keys(initiativeLabels) as PersonalProfile['initiative'][]).map((initiative) => <Pressable key={initiative} onPress={() => setDraft({ ...draft, initiative })} style={[styles.onboardingChoice, draft.initiative === initiative && styles.onboardingChoiceSelected]}><View style={styles.flex}><Text style={styles.onboardingChoiceTitle}>{initiativeLabels[initiative]}</Text>{initiative === 'proactive-later' && <Text style={styles.profileChoiceBody}>Voorkeur onthouden · nog niet actief</Text>}</View><Text style={styles.profileChoiceMark}>{draft.initiative === initiative ? '●' : '○'}</Text></Pressable>)}</View>
          <View style={styles.trustCard}><Text style={styles.learningTitle}>Jouw profiel blijft van jou</Text><Text style={styles.learningBody}>Je kunt zien wat Momentum leert, signalen wissen en iedere voorkeur aanpassen. “Niet nu” wordt nooit als afwijzing van jou geïnterpreteerd.</Text></View>
        </>}
        <View style={styles.onboardingFooter}>{step > 0 && <SecondaryButton label="Terug" onPress={() => setStep((value) => value - 1)} />}<PrimaryButton label={step === 4 ? 'Toon mijn eerste moment' : 'Verder'} onPress={() => canContinue && next()} />{!canContinue && <Text style={styles.validationText}>Kies minimaal één richting om verder te gaan.</Text>}</View>
      </ScrollView>
    </View></SafeAreaView>
  </View>;
}

function ScreenHeader({ eyebrow, title, subtitle, onProfile }: { eyebrow?: string; title: string; subtitle?: string; onProfile?: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.screenTitle}>{title}</Text>
        {subtitle && <Text style={styles.screenSubtitle}>{subtitle}</Text>}
      </View>
      {onProfile && <Pressable accessibilityLabel="Open profiel" onPress={onProfile} style={styles.avatar}><Text style={styles.avatarText}>W</Text></Pressable>}
    </View>
  );
}

function NowScreen({ firstName, experience, decision, context, calendar, liveWorld, liveLoading, onOpen, onProfile, onDiscover, onFeedback }: { firstName: string; experience: Experience; decision: LocalDecision; context: PrototypeContext; calendar: CalendarContextSnapshot; liveWorld: LiveWorldSnapshot | null; liveLoading: boolean; onOpen: (item: Experience, stage?: FlowStage) => void; onProfile: () => void; onDiscover: () => void; onFeedback: (outcome: LearningOutcome) => void }) {
  const [declined, setDeclined] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  return (
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow={`${dayPartLabels[context.dayPart].toUpperCase()}${firstName ? ` · ${firstName.toUpperCase()}` : ''}`} title="Vandaag wacht er iets moois op je." subtitle="Eén voorstel voor dit moment." onProfile={onProfile} />
      <LiveWorldBar snapshot={liveWorld} loading={liveLoading} />
      {calendar.state === 'live' && calendar.currentFreeMinutes ? <View style={styles.contextNotice}><Text style={styles.contextNoticeMark}>◷</Text><View style={styles.flex}><Text style={styles.contextNoticeTitle}>{calendar.currentFreeMinutes} minuten ruimte herkend</Text><Text style={styles.contextNoticeBody}>Alleen begin- en eindtijden verwerkt · afspraakinhoud genegeerd</Text></View></View> : null}
      {!declined ? (
        <View style={styles.heroCard}>
          <ImageBackground source={{ uri: experience.image }} style={styles.heroImage} imageStyle={styles.heroImageStyle}>
            <View style={styles.imageShade} />
            <View style={styles.heroTop}><Pill label="NATURE MOMENT" accent={experience.accent} /><Text style={styles.heroTime}>VANAVOND</Text></View>
            <View style={styles.heroBottom}>
              <Text style={styles.heroTitle}>{experience.title}</Text>
              <Text style={styles.heroPromise}>{experience.promise}</Text>
              <View style={styles.heroFacts}>
                <MiniFact value={`${experience.duration} min`} label="wandeling" />
                <MiniFact value={experience.distance ?? 'dichtbij'} label="bereik" />
                <MiniFact value={experience.effort} label="tempo" />
              </View>
            </View>
          </ImageBackground>
          <View style={styles.heroActionArea}>
            <Text style={styles.wonderText}>{experience.wonder}</Text>
            <PrimaryButton label={experience.cta} onPress={() => onOpen(experience)} />
            <Pressable onPress={() => setWhyOpen((value) => !value)} style={styles.whyButton}>
              <Text style={styles.whyButtonText}>Waarom dit nu past</Text><Text style={styles.whyChevron}>{whyOpen ? '⌃' : '⌄'}</Text>
            </Pressable>
            {whyOpen && <View style={styles.whyPanel}>{decision.selected?.reasons.map((reason) => <Text key={reason.text} style={styles.whyReason}>{reason.certainty === 'chosen' ? 'Gekozen' : 'Berekend'} · {reason.text}</Text>)}<Text style={styles.proofNote}>Vertrouwen {decision.confidence} · {decision.rejected} niet-passende kandidaten verwijderd · {calendar.state === 'live' ? 'vrije agendatijd lokaal meegewogen' : 'geen agenda gebruikt'} · geen gezondheidsdata gebruikt</Text></View>}
            <Pressable onPress={() => { onFeedback('not-now'); setDeclined(true); }} style={styles.quietAction}><Text style={styles.quietActionText}>Niet nu</Text></Pressable>
            <Pressable onPress={() => { onFeedback('not-for-me'); setDeclined(true); }} style={styles.quietAction}><Text style={styles.quietCorrection}>Dit past niet bij mij</Text></Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.silentCard}>
          <Text style={styles.eyebrow}>MOMENTUM BLIJFT STIL</Text>
          <Text style={styles.silentTitle}>Prima. Dit moment hoeft niets te worden.</Text>
          <Text style={styles.screenSubtitle}>Je keuze verandert je blijvende voorkeuren niet.</Text>
          <SecondaryButton label="Toon het voorstel opnieuw" onPress={() => setDeclined(false)} />
        </View>
      )}
      <Pressable onPress={onDiscover} style={styles.spaceCard}>
        <View style={styles.spaceIcon}><Text style={styles.spaceIconText}>✦</Text></View>
        <View style={styles.flex}><Text style={styles.spaceTitle}>Er is ruimte ontstaan</Text><Text style={styles.spaceBody}>Vertel wat er veranderde of waar je zin in hebt</Text></View>
        <Text style={styles.arrow}>→</Text>
      </Pressable>
    </ScrollView>
  );
}

function TodayScreen({ decisions, calendar, onOpen }: { decisions: TodayDecision[]; calendar: CalendarContextSnapshot; onOpen: (item: Experience) => void }) {
  const localDate = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toLocaleUpperCase('nl-NL');
  return (
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow={localDate} title="Ruimte in je dag." subtitle="Niet om alles te vullen. Alleen om kansen te zien." />
      {calendar.state === 'live' && <View style={styles.calendarWindows}><Text style={styles.liveEvidenceTitle}>VRIJE VENSTERS UIT AGENDA</Text>{calendar.freeWindows.slice(0, 3).map((window) => <Text key={window.start} style={styles.calendarWindowText}>◷  {formatWindow(window)}</Text>)}</View>}
      <View style={styles.daySummary}><Text style={styles.daySummaryTitle}>{decisions.length} mogelijke openingen</Text><Text style={styles.daySummaryBody}>Elke opening komt uit dezelfde lokale selectie als Nu. Jij bepaalt welke tijd echt van jou is.</Text></View>
      <View style={styles.timeline}>
        {decisions.map((moment, index) => {
          const item = moment.result.experience;
          const directionReason = moment.result.reasons.find((reason) => reason.text.includes('richting'));
          return (
            <Pressable key={item.id} onPress={() => onOpen(item)} style={styles.timelineRow}>
              <View style={styles.timelineRail}><View style={[styles.timelineDot, { backgroundColor: item.accent }]} />{index < decisions.length - 1 && <View style={styles.timelineLine} />}</View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTime}>{moment.label} · {moment.time}</Text>
                <ImageBackground source={{ uri: item.image }} style={styles.dayCardImage} imageStyle={styles.dayCardImageStyle}>
                  <View style={styles.imageShade} />
                  <View style={styles.dayCardCopy}>
                    <Text style={styles.dayCardTitle}>{item.title}</Text>
                    <Text style={styles.dayCardPromise}>{item.promise}</Text>
                    <Text style={styles.dayCardMeta}>{item.duration} min · {item.effort} · lokaal gekozen  →</Text>
                    {directionReason && <Text style={styles.directionMatch}>Past bij een richting die jij zelf benoemde</Text>}
                  </View>
                </ImageBackground>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.quietDay}><Text style={styles.quietDayTitle}>Een volle dag is ook compleet.</Text><Text style={styles.quietDayBody}>Momentum voegt niets toe wanneer er geen echte ruimte is.</Text></View>
    </ScrollView>
  );
}

function DiscoverScreen({ context, candidatePool, learning, onOpen }: { context: PrototypeContext; candidatePool: Experience[]; learning: PersonalLearningContext; onOpen: (item: Experience) => void }) {
  const [minutes, setMinutes] = useState(60);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'idle' | 'result'>('idle');
  const result = useMemo(() => rankForMoment({ ...context, availableMinutes: minutes }, input, [], candidatePool, learning), [candidatePool, context, input, learning, minutes]);
  const primary = result.selected?.experience;
  const alternative = result.alternative?.experience;
  const surprise = () => { setInput(''); setMode('result'); };
  return (
    <ScrollView contentContainerStyle={styles.screenScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow="JIJ GEEFT RICHTING" title="Waar heb je ruimte voor?" subtitle="Zeg het in je eigen woorden. Momentum maakt er geen categorie van." />
      {mode === 'idle' ? (
        <View style={styles.intentPanel}>
          <Text style={styles.fieldLabel}>HOEVEEL TIJD HEB JE?</Text>
          <View style={styles.chipRow}>{timeOptions.map((option) => <ChoiceChip key={option} label={option < 60 ? `${option} min` : option === 60 ? '1 uur' : '2 uur'} selected={minutes === option} onPress={() => setMinutes(option)} />)}</View>
          <Text style={styles.fieldLabel}>WAT HEB JE IN GEDACHTEN?</Text>
          <TextInput
            accessibilityLabel="Beschrijf waar je ruimte voor hebt"
            value={input}
            onChangeText={setInput}
            placeholder="Bijv. iets met mijn kind, buiten fietsen, koken met wat ik heb…"
            placeholderTextColor="rgba(174,180,174,0.52)"
            multiline
            style={styles.intentInput}
          />
          <PrimaryButton label={input.trim() ? 'Vind wat hierbij past' : 'Help me kiezen'} onPress={() => setMode('result')} />
          <View style={styles.orRow}><View style={styles.orLine} /><Text style={styles.orText}>OF</Text><View style={styles.orLine} /></View>
          <SecondaryButton label="Verras me binnen deze tijd" onPress={surprise} />
          <Text style={styles.intentPrivacy}>Voor deze proef wordt je zin alleen lokaal geïnterpreteerd. Er wordt geen chatgeschiedenis gemaakt.</Text>
        </View>
      ) : (
        <View>
          <View style={styles.interpretation}><Text style={styles.interpretationLabel}>ZO HEB IK JE MOMENT BEGREPEN</Text><Text style={styles.interpretationText}>{input.trim() ? `Je eigen woorden: “${input.trim()}”` : 'Verras me met wat bij deze proefcontext past'} · {minutes} minuten · {context.company === 'solo' ? 'alleen' : context.company === 'family' ? 'met gezin' : 'samen'}</Text></View>
          {primary ? <>
            <Text style={styles.sectionLabel}>MIJN BESTE VOORSTEL · VERTROUWEN {result.confidence.toUpperCase()}</Text>
            <ExperienceTile experience={primary} large onPress={() => onOpen(primary)} />
            <View style={styles.selectionReasons}>{result.selected?.reasons.map((reason) => <Text key={reason.text} style={styles.selectionReason}>• {reason.text}</Text>)}</View>
            {alternative && <><Text style={styles.sectionLabel}>EEN ECHT ANDERE RICHTING</Text><ExperienceTile experience={alternative} onPress={() => onOpen(alternative)} /></>}
          </> : <View style={styles.silentCard}><Text style={styles.eyebrow}>GEEN EERLIJK VOORSTEL</Text><Text style={styles.silentTitle}>Binnen deze ruimte past nu niets compleet.</Text><Text style={styles.screenSubtitle}>Vergroot de beschikbare tijd of pas één praktische beperking aan.</Text></View>}
          <SecondaryButton label="Pas mijn woorden aan" onPress={() => setMode('idle')} />
          <Text style={styles.finiteNote}>Momentum toont bewust geen eindeloze lijst.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function LifeBookScreen({ memories, onOpen }: { memories: Memory[]; onOpen: (item: Experience) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow="JOUW ERVARINGEN" title="Leefboek" subtitle="Niet wat je volhield, maar wat de moeite waard was." />
      <View style={styles.lifeSummary}><Text style={styles.lifeSummaryBig}>{memories.length}</Text><View><Text style={styles.lifeSummaryTitle}>bewaarde momenten</Text><Text style={styles.lifeSummaryBody}>Lokaal op dit apparaat in deze proef.</Text></View></View>
      <Text style={styles.sectionLabel}>JULI</Text>
      <View style={styles.memoryGrid}>
        {memories.map((memory) => {
          const experience = experiences.find((item) => item.title === memory.title) ?? byId('wadden-light');
          return <Pressable key={memory.id} onPress={() => onOpen(experience)} style={styles.memoryCard}><ImageBackground source={{ uri: memory.image }} style={styles.memoryImage} imageStyle={styles.memoryImageStyle}><View style={styles.imageShade} /><View style={styles.memoryCopy}><Text style={styles.memoryDate}>{memory.date}</Text><Text style={styles.memoryTitle}>{memory.title}</Text><Text style={styles.memoryNote}>{memory.note}</Text></View></ImageBackground></Pressable>;
        })}
      </View>
      <View style={styles.learningCard}><Text style={styles.learningTitle}>Een voorzichtig patroon</Text><Text style={styles.learningBody}>Momenten met buitenlucht en een helder einde lijken vaak de moeite waard. Jij kunt dit later bekijken, corrigeren of verwijderen.</Text></View>
    </ScrollView>
  );
}

function PromiseScreen({ experience, onClose, onAccept }: { experience: Experience; onClose: () => void; onAccept: () => void }) {
  const [whyOpen, setWhyOpen] = useState(false);
  return (
    <ScrollView contentContainerStyle={styles.flowScroll} showsVerticalScrollIndicator={false}>
      <BackButton label="Sluiten" onPress={onClose} />
      <ImageBackground source={{ uri: experience.image }} style={styles.detailHero} imageStyle={styles.detailHeroImage}><View style={styles.imageShade} /><View style={styles.detailHeroCopy}><Pill label={experience.kind.toUpperCase()} accent={experience.accent} /><Text style={styles.detailTitle}>{experience.title}</Text><Text style={styles.detailPromise}>{experience.promise}</Text></View></ImageBackground>
      <Text style={styles.wonderHeadline}>Wat je kunt verwachten</Text>
      <Text style={styles.wonderLarge}>{experience.wonder}</Text>
      <View style={styles.factStrip}><MiniFact value={`${experience.duration} min`} label="totaal" /><MiniFact value={experience.effort} label="inspanning" /><MiniFact value={experience.timeWindow ?? 'nu mogelijk'} label="moment" /></View>
      {experience.liveEvidence?.length ? <View style={styles.liveEvidenceCard}>
        <Text style={styles.liveEvidenceTitle}>LIVE WORLD · BRONBEWIJS</Text>
        {experience.liveEvidence.map((evidence) => <View key={`${evidence.sourceName}-${evidence.label}`} style={styles.liveEvidenceRow}><View style={styles.liveEvidenceDot} /><View style={styles.flex}><Text style={styles.liveEvidenceLabel}>{evidence.label}</Text><Text style={styles.liveEvidenceMeta}>{evidence.certainty === 'observation' ? 'Waarneming' : 'Voorspelling'} · {evidence.sourceName} · vervalt automatisch</Text></View></View>)}
        <Text style={styles.liveEvidenceCaution}>Waarnemingen zijn geen garantie. Mariene modeldata is niet geschikt voor kustnavigatie en vervangt nooit lokale waarschuwingen.</Text>
      </View> : null}
      <PrimaryButton label={experience.cta} onPress={onAccept} />
      <Pressable onPress={() => setWhyOpen((value) => !value)} style={styles.whyButton}><Text style={styles.whyButtonText}>Waarom deze ervaring?</Text><Text style={styles.whyChevron}>{whyOpen ? '⌃' : '⌄'}</Text></Pressable>
      {whyOpen && <View style={styles.whyPanel}>{experience.why.map((reason) => <Text key={reason} style={styles.whyReason}>• {reason}</Text>)}</View>}
    </ScrollView>
  );
}

function PrepareScreen({ experience, onBack, onStart }: { experience: Experience; onBack: () => void; onStart: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.flowScroll} showsVerticalScrollIndicator={false}>
      <BackButton label="Terug" onPress={onBack} />
      <Text style={styles.eyebrow}>PREPARE</Text><Text style={styles.flowTitle}>{experience.prepareTitle}</Text><Text style={styles.screenSubtitle}>Alles wat nodig is. Niets dat je nog laat zoeken.</Text>
      <View style={styles.prepareCard}>{experience.prepare.map((item, index) => <View key={item} style={styles.prepareRow}><View style={[styles.stepNumber, { borderColor: experience.accent }]}><Text style={styles.stepNumberText}>{index + 1}</Text></View><Text style={styles.prepareText}>{item}</Text></View>)}</View>
      {experience.routePlan && <View style={styles.routePlanCard}>
        <Text style={styles.liveEvidenceTitle}>ROUTE COMPOSER</Text><Text style={styles.routePlanTitle}>{experience.routePlan.destinationName}</Text>
        <View style={styles.routeBudget}><MiniFact value={`${experience.routePlan.outboundMinutes} min`} label="heen" /><MiniFact value={`${experience.routePlan.experienceMinutes} min`} label="beleven" /><MiniFact value={`${experience.routePlan.returnMinutes} min`} label="terug" /><MiniFact value={`${experience.routePlan.bufferMinutes} min`} label="buffer" /></View>
        <Text style={styles.routeGuard}>{experience.routePlan.natureGuard}</Text>
      </View>}
      <View style={styles.commitmentCard}><Text style={styles.commitmentLabel}>TOTALE VERPLICHTING</Text><Text style={styles.commitmentValue}>{experience.duration} minuten · {experience.effort.toLowerCase()}</Text>{experience.distance && <Text style={styles.commitmentBody}>{experience.distance} is meegenomen voordat je begint.</Text>}</View>
      <PrimaryButton label="Ik ga nu" onPress={onStart} />
    </ScrollView>
  );
}

function PresenceScreen({ experience, personal, onBack, onFinish }: { experience: Experience; personal: PersonalProfile; onBack: () => void; onFinish: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [remaining, setRemaining] = useState(experience.steps[0]?.seconds ?? 0);
  const [timerRunning, setTimerRunning] = useState(false);
  const current = experience.steps[stepIndex] ?? { title: experience.presenceTitle, instruction: experience.presenceCue };
  const insightVisible = current.insight && personal.guidanceBalance > -0.2 && !personal.mutedInsightTopics.includes(current.insight.topic);
  const isLast = stepIndex >= experience.steps.length - 1;

  useEffect(() => {
    setRemaining(current.seconds ?? 0);
    setTimerRunning(false);
  }, [current.seconds, stepIndex]);

  useEffect(() => {
    if (!timerRunning || remaining <= 0) return;
    const timer = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [remaining, timerRunning]);

  const openHandoff = async () => {
    const plan = experience.routePlan;
    const source = plan?.source ? `${plan.source.latitude},${plan.source.longitude}` : undefined;
    const destination = plan?.destination ? `${plan.destination.latitude},${plan.destination.longitude}` : plan?.destinationName ?? experience.title;
    const params = new URLSearchParams({ destination, mode: plan?.mode ?? 'walking' });
    if (source) params.set('source', source);
    const url = `https://maps.apple.com/directions?${params.toString()}`;
    await Linking.openURL(url).catch(() => undefined);
  };
  const next = () => {
    if (isLast) onFinish();
    else setStepIndex((value) => value + 1);
  };
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  return (
    <View style={styles.presenceScreen}>
      <BackButton label="Voorbereiding" onPress={onBack} />
      <View style={styles.capsuleProgress}>
        {experience.steps.map((_, index) => <View key={index} style={[styles.capsuleProgressPart, index <= stepIndex && { backgroundColor: experience.accent }]} />)}
      </View>
      <ScrollView contentContainerStyle={styles.capsuleStep} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{experience.presenceMode === 'handoff' ? 'ROUTE & PRESENCE' : experience.presenceMode === 'quiet' ? 'QUIET GUIDE' : 'STAP VOOR STAP'}</Text>
        <Text style={styles.capsuleStepCount}>Stap {stepIndex + 1} van {experience.steps.length}</Text>
        <Text style={styles.presenceTitle}>{current.title}</Text>
        {current.meta && <View style={[styles.stepMetaPill, { borderColor: experience.accent }]}><Text style={styles.stepMetaText}>{current.meta}</Text></View>}
        <Text style={styles.presenceCue}>{current.instruction}</Text>
        {insightVisible && <View style={styles.insightCard}>
          <Text style={styles.insightEyebrow}>KLEIN INZICHT · ALLEEN ALS HET HELPT</Text>
          <Text style={styles.insightTitle}>{current.insight?.title}</Text>
          <Text style={styles.insightBody}>{current.insight?.body}</Text>
          <Text style={styles.insightSource}>{current.insight?.sourceKind === 'live' ? 'Actuele bron' : 'Redactioneel'} · {current.insight?.sourceLabel}</Text>
        </View>}
        {current.seconds ? (
          <View style={[styles.stepTimer, { borderColor: experience.accent }]}>
            <Text style={styles.stepTimerValue}>{formatTime(remaining)}</Text>
            <Text style={styles.presenceUnit}>{remaining === 0 ? 'KLAAR' : timerRunning ? 'LOOPT' : 'KLAAR OM TE STARTEN'}</Text>
            <Pressable onPress={() => remaining > 0 && setTimerRunning((value) => !value)} style={styles.timerControl}>
              <Text style={styles.timerControlText}>{remaining === 0 ? '✓' : timerRunning ? 'Pauze' : 'Start timer'}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.quietStepOrb, { borderColor: experience.accent }]}><Text style={[styles.quietStepSymbol, { color: experience.accent }]}>{experience.presenceMode === 'quiet' ? '◌' : experience.presenceMode === 'handoff' ? '↗' : '·'}</Text></View>
        )}
        {experience.presenceMode === 'handoff' && stepIndex === 0 && <SecondaryButton label="Open route in Kaarten" onPress={openHandoff} />}
      </ScrollView>
      <View>
        <PrimaryButton label={isLast ? 'Ervaring afronden' : 'Volgende stap'} onPress={next} />
        {stepIndex > 0 && <SecondaryButton label="Vorige stap" onPress={() => setStepIndex((value) => Math.max(0, value - 1))} />}
        <Text style={styles.presenceFooter}>{experience.presenceMode === 'quiet' ? 'Gebruik alleen de aanwijzing die helpt. Leg daarna je telefoon weg.' : 'Alleen de huidige stap vraagt aandacht.'}</Text>
      </View>
    </View>
  );
}

function RememberScreen({ experience, onSkip, onSave }: { experience: Experience; onSkip: () => void; onSave: (input: ReflectionInput) => void }) {
  const [note, setNote] = useState('');
  const [aspects, setAspects] = useState<ReflectionAspect[]>([]);
  const options = (Object.keys(reflectionAspectLabels) as ReflectionAspect[]).filter((aspect) => aspect !== 'content-not-useful' || experience.steps.some((step) => step.insight));
  const toggle = (aspect: ReflectionAspect) => setAspects((current) => current.includes(aspect) ? current.filter((item) => item !== aspect) : [...current, aspect]);
  const save = (outcome: LearningOutcome, selectedAspects = aspects) => onSave({ note, outcome, aspects: selectedAspects });
  return (
    <ScrollView contentContainerStyle={styles.flowScroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>MEMORY</Text><Text style={styles.flowTitle}>Wat blijft er over?</Text><Text style={styles.screenSubtitle}>{experience.memoryPrompt}</Text>
      <ImageBackground source={{ uri: experience.image }} style={styles.memoryPreview} imageStyle={styles.memoryImageStyle}><View style={styles.imageShade} /><Text style={styles.memoryPreviewTitle}>{experience.title}</Text></ImageBackground>
      <TextInput value={note} onChangeText={setNote} placeholder="Eén zin is genoeg…" placeholderTextColor="rgba(174,180,174,0.52)" multiline style={styles.memoryInput} />
      <Text style={styles.fieldLabel}>WAT MAG VOLGENDE KEER ANDERS?</Text>
      <Text style={styles.reflectionHint}>Alleen wat jij aantikt wordt onderdeel van je persoonlijke geheugen.</Text>
      <View style={styles.chipRow}>{options.map((aspect) => <ChoiceChip key={aspect} label={reflectionAspectLabels[aspect]} selected={aspects.includes(aspect)} onPress={() => toggle(aspect)} />)}</View>
      <PrimaryButton label={aspects.length ? 'Bewaar en leer hiervan' : 'Dit was de moeite waard'} onPress={() => save('worth-it')} />
      {aspects.length > 0 && <SecondaryButton label="Niet fijn, maar niet volledig uitsluiten" onPress={() => save('neutral')} />}
      <SecondaryButton label="Dit past niet bij mij" onPress={() => save('not-for-me')} />
      <SecondaryButton label="Bewaar zonder mijn profiel te veranderen" onPress={() => save('neutral', [])} />
      <SecondaryButton label="Afronden zonder bewaren" onPress={onSkip} />
    </ScrollView>
  );
}

function ProfileScreen({ personal, context, calendar, calendarLoading, liveWorld, contentCatalog, liveLoading, liveMessage, onChange, onPersonalChange, onForgetReflection, onForgetLearningEvent, onResetLearning, onRedoOnboarding, onClearLiveCache, onConnectCalendar, onRefresh, onUseLocation, onClose }: { personal: PersonalProfile; context: PrototypeContext; calendar: CalendarContextSnapshot; calendarLoading: boolean; liveWorld: LiveWorldSnapshot | null; contentCatalog: ResolvedContentCatalog; liveLoading: boolean; liveMessage: string; onChange: (context: PrototypeContext) => void; onPersonalChange: (profile: PersonalProfile) => void; onForgetReflection: (id: string) => void; onForgetLearningEvent: (id: string) => void; onResetLearning: () => void; onRedoOnboarding: () => void; onClearLiveCache: () => void; onConnectCalendar: () => void; onRefresh: () => void; onUseLocation: () => void; onClose: () => void }) {
  const dayParts: DayPart[] = ['morning', 'midday', 'afternoon', 'evening'];
  const profiles: PrototypeProfile[] = ['balanced', 'explorer', 'mover', 'family'];
  const companies: Array<{ id: Company; label: string }> = [{ id: 'solo', label: 'Alleen' }, { id: 'together', label: 'Samen' }, { id: 'family', label: 'Met gezin' }];
  return <ScrollView contentContainerStyle={styles.flowScroll}>
    <BackButton label="Sluiten" onPress={onClose} />
    <Text style={styles.eyebrow}>JOUW MOMENTUM</Text><Text style={styles.flowTitle}>Jij houdt de regie.</Text>
    <Text style={styles.screenSubtitle}>Bekijk wat Momentum gebruikt, pas het aan of wis wat het heeft geleerd. Alles hieronder blijft lokaal op dit apparaat.</Text>
    <View style={styles.personalCard}>
      <ProfileRow label="Naam" value={personal.firstName || 'Niet ingevuld'} />
      <ProfileRow label="Initiatief" value={initiativeLabels[personal.initiative]} />
      <ProfileRow label="Reisbereidheid" value={`maximaal ${personal.maxTravelMinutes} min`} />
      <ProfileRow label="Begeleiding" value={personal.guidanceBalance <= -0.2 ? 'Zo weinig mogelijk uitleg' : personal.guidanceBalance >= 0.2 ? 'Graag wat meer context' : 'In balans'} />
    </View>
    <Text style={styles.fieldLabel}>MIJN RICHTING</Text>
    <Text style={styles.screenSubtitle}>Dit zijn woorden die jij zelf kiest. Momentum gebruikt ze als zachte richting, nooit als opdracht of score.</Text>
    {(Object.keys(directionLabels) as Array<keyof typeof directionLabels>).map((horizon) => <DirectionEditor key={horizon} horizon={horizon} values={personal.directions[horizon]} onSave={(values) => onPersonalChange({ ...personal, directions: { ...personal.directions, [horizon]: values } })} />)}
    <Text style={styles.fieldLabel}>ZELF GEKOZEN VOORKEUREN</Text>
    <View style={styles.chipRow}>{(Object.keys(experienceKindLabels) as ExperienceKind[]).map((kind) => <ChoiceChip key={kind} label={experienceKindLabels[kind]} selected={personal.preferredKinds.includes(kind)} onPress={() => onPersonalChange({ ...personal, preferredKinds: personal.preferredKinds.includes(kind) ? personal.preferredKinds.filter((item) => item !== kind) : [...personal.preferredKinds, kind] })} />)}</View>
    <Text style={styles.fieldLabel}>WAT MOMENTUM HEEFT GELEERD</Text>
    <View style={styles.learningCard}>
      <Text style={styles.learningTitle}>{personal.reflectionMemories.length || personal.learningEvents.length ? `${personal.reflectionMemories.length + personal.learningEvents.length} expliciete signalen` : 'Nog geen duurzaam leersignaal'}</Text>
      <Text style={styles.learningBody}>{personal.reflectionMemories[0]?.explanation ?? personal.learningEvents[0]?.explanation ?? '“Niet nu” verandert niets. Alleen bevestigingen en correcties die jij bewust geeft worden onthouden.'}</Text>
      {personal.reflectionMemories.slice(0, 5).map((memory) => <View key={memory.id} style={styles.memorySignalRow}><View style={styles.flex}><Text style={styles.learningEvent}>• {memory.explanation}</Text>{memory.note && <Text style={styles.memorySignalNote}>“{memory.note}”</Text>}</View><Pressable accessibilityLabel={`Vergeet feedback over ${memory.experienceTitle}`} onPress={() => onForgetReflection(memory.id)} style={styles.forgetSignal}><Text style={styles.forgetSignalText}>Vergeet</Text></Pressable></View>)}
      {personal.learningEvents.filter((event) => !personal.reflectionMemories.some((memory) => memory.learningEventId === event.id)).slice(0, 5).map((event) => <View key={event.id} style={styles.memorySignalRow}><Text style={[styles.learningEvent, styles.flex]}>• {event.explanation}</Text><Pressable accessibilityLabel={`Vergeet leersignaal over ${event.experienceId}`} onPress={() => onForgetLearningEvent(event.id)} style={styles.forgetSignal}><Text style={styles.forgetSignalText}>Vergeet</Text></Pressable></View>)}
      {personal.mutedInsightTopics.length > 0 && <Text style={styles.learningEvent}>Minder uitleg over: {personal.mutedInsightTopics.join(', ')}.</Text>}
    </View>
    <SecondaryButton label="Wis alleen wat Momentum heeft geleerd" onPress={onResetLearning} />
    <SecondaryButton label="Doorloop mijn startkeuzes opnieuw" onPress={onRedoOnboarding} />
    <Text style={styles.fieldLabel}>TESTCONTEXT</Text>
    <Text style={styles.screenSubtitle}>Deze waarden simuleren voorlopig context die later alleen met jouw toestemming uit apparaatbronnen kan komen.</Text>
    <Text style={styles.fieldLabel}>MOMENT VAN DE DAG</Text><View style={styles.chipRow}>{dayParts.map((item) => <ChoiceChip key={item} label={dayPartLabels[item]} selected={context.dayPart === item} onPress={() => onChange({ ...context, dayPart: item })} />)}</View>
    <Text style={styles.fieldLabel}>PROEFPROFIEL</Text>
    <View style={styles.profileChoiceList}>{profiles.map((item) => <Pressable key={item} onPress={() => onChange({ ...context, profile: item })} style={[styles.profileChoice, context.profile === item && styles.profileChoiceSelected]}><View style={styles.flex}><Text style={styles.profileChoiceTitle}>{profileLabels[item].title}</Text><Text style={styles.profileChoiceBody}>{profileLabels[item].body}</Text></View><Text style={styles.profileChoiceMark}>{context.profile === item ? '●' : '○'}</Text></Pressable>)}</View>
    <Text style={styles.fieldLabel}>MET WIE?</Text><View style={styles.chipRow}>{companies.map((item) => <ChoiceChip key={item.id} label={item.label} selected={context.company === item.id} onPress={() => onChange({ ...context, company: item.id })} />)}</View>
    <Text style={styles.fieldLabel}>BESCHIKBAAR MATERIAAL</Text><View style={styles.chipRow}><ChoiceChip label="Kettlebell" selected={context.hasKettlebell} onPress={() => onChange({ ...context, hasKettlebell: !context.hasKettlebell })} /><ChoiceChip label="Geen trainingsmateriaal" selected={!context.hasKettlebell} onPress={() => onChange({ ...context, hasKettlebell: false })} /></View>
    <View style={styles.profileCard}><ProfileRow label="Locatie" value={liveWorld?.regionLabel ?? 'Niet gekoppeld'} /><ProfileRow label="Ervaringen" value={contentCatalog.coverageLabel} /><ProfileRow label="Seizoen" value={contentCatalog.context.season === 'spring' ? 'Lente' : contentCatalog.context.season === 'summer' ? 'Zomer' : contentCatalog.context.season === 'autumn' ? 'Herfst' : 'Winter'} /><ProfileRow label="Agenda" value={calendar.state === 'live' ? 'Lokaal gekoppeld' : calendar.state === 'denied' ? 'Niet toegestaan' : 'Niet gekoppeld'} /><ProfileRow label="Weer" value={liveWorld?.weather ? 'Live gekoppeld' : 'Niet gekoppeld'} /><ProfileRow label="Gezondheid" value="Niet gekoppeld" /></View>
    <View style={styles.calendarControlCard}>
      <Text style={styles.liveEvidenceTitle}>AGENDA · VRIJE RUIMTE</Text>
      <Text style={styles.liveControlMessage}>{calendar.detail}</Text>
      {calendar.state === 'live' && calendar.freeWindows.slice(0, 3).map((window) => <Text key={window.start} style={styles.calendarWindowText}>◷  {formatWindow(window)}</Text>)}
      {calendar.state !== 'live' && <SecondaryButton label={calendarLoading ? 'Agenda wordt gecontroleerd…' : Platform.OS === 'web' ? 'Beschikbaar in development build' : 'Koppel mijn agenda'} onPress={onConnectCalendar} />}
      <Text style={styles.sourcePrivacy}>Momentum vraagt dit pas hier. Na toestemming worden alleen bezette begin- en eindtijden gebruikt; titels, locaties, deelnemers en notities worden direct genegeerd.</Text>
    </View>
    <View style={styles.liveControlCard}>
      <Text style={styles.liveEvidenceTitle}>LIVE WORLD · {liveWorld?.regionLabel ?? defaultRegion.label}</Text>
      <Text style={styles.liveControlMessage}>{liveMessage}</Text>
      {(liveWorld?.sources ?? []).map((source) => <View key={source.id} style={styles.sourceRow}><View style={[styles.sourceState, source.state === 'live' ? styles.sourceLive : source.state === 'error' ? styles.sourceError : styles.sourceWaiting]} /><View style={styles.flex}><Text style={styles.sourceName}>{source.name}</Text><Text style={styles.sourceDetail}>{source.detail}</Text></View></View>)}
      <View style={styles.liveControlActions}><SecondaryButton label={liveLoading ? 'Bezig met vernieuwen…' : 'Vernieuw live bronnen'} onPress={onRefresh} /><SecondaryButton label="Gebruik mijn globale omgeving" onPress={onUseLocation} /><SecondaryButton label="Wis regionale live cache" onPress={onClearLiveCache} /></View>
      <Text style={styles.sourcePrivacy}>Globale locatie wordt alleen na jouw tik opgevraagd en afgerond voordat bronnen worden benaderd.</Text>
    </View>
    <View style={styles.futureSources}><Text style={styles.fieldLabel}>VOLGENDE LIVE BRONNEN</Text>{futureSourceRegistry.map((source) => <View key={source.id} style={styles.futureSourceRow}><Text style={styles.futureSourceLabel}>{source.label}</Text><Text style={styles.futureSourceState}>GEPLAND</Text></View>)}</View>
    <View style={styles.learningCard}><Text style={styles.learningTitle}>Transparante lokale selectie</Text><Text style={styles.learningBody}>Momentum filtert eerst op tijd, gezelschap en materiaal. Daarna wegen moment, jouw eigen woorden, bevestigde voorkeuren, actuele bronnen en voldoende afwisseling mee.</Text></View>
    <PrimaryButton label="Gebruik deze proefcontext" onPress={onClose} />
  </ScrollView>;
}

function LiveWorldBar({ snapshot, loading }: { snapshot: LiveWorldSnapshot | null; loading: boolean }) {
  const weather = snapshot?.weather;
  const air = snapshot?.airQuality;
  const liveCount = snapshot?.sources.filter((source) => source.state === 'live').length ?? 0;
  const staleCount = snapshot?.sources.filter((source) => source.state === 'stale').length ?? 0;
  return <View style={styles.liveWorldBar}>
    <View style={[styles.sourceState, liveCount ? styles.sourceLive : styles.sourceWaiting]} />
    <View style={styles.flex}><Text style={styles.liveWorldBarTitle}>{loading && !snapshot ? 'Live World wordt bijgewerkt' : liveCount ? `${liveCount} live bron${liveCount === 1 ? '' : 'nen'} · ${snapshot?.regionLabel ?? defaultRegion.label}` : staleCount ? `Eerdere context · ${snapshot?.regionLabel ?? 'regio'}` : `Evergreen · ${snapshot?.regionLabel ?? 'jouw regio'}`}</Text><Text style={styles.liveWorldBarDetail}>{weather ? `${Math.round(weather.temperature)}°C · wind ${Math.round(weather.windSpeed)} km/u · zicht ${Math.round(weather.visibilityMeters / 1000)} km${air ? ` · luchtindex ${Math.round(air.europeanAqi)}` : ''}` : 'Evergreen ervaringen blijven beschikbaar'}</Text></View>
    <Text style={styles.liveWorldMark}>◎</Text>
  </View>;
}

function BottomNav({ surface, onChange }: { surface: Surface; onChange: (surface: Surface) => void }) {
  const items: Array<{ id: Surface; label: string; icon: string }> = [
    { id: 'now', label: 'Nu', icon: '◉' }, { id: 'today', label: 'Vandaag', icon: '☼' },
    { id: 'discover', label: 'Ontdekken', icon: '✦' }, { id: 'lifebook', label: 'Leefboek', icon: '▣' },
  ];
  return <View style={styles.bottomNav}>{items.map((item) => <Pressable key={item.id} onPress={() => onChange(item.id)} style={styles.navItem}><Text style={[styles.navIcon, surface === item.id && styles.navActive]}>{item.icon}</Text><Text style={[styles.navLabel, surface === item.id && styles.navActive]}>{item.label}</Text></Pressable>)}</View>;
}

function ExperienceTile({ experience, large, onPress }: { experience: Experience; large?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.experienceTile}><ImageBackground source={{ uri: experience.image }} style={[styles.tileImage, large && styles.tileImageLarge]} imageStyle={styles.tileImageStyle}><View style={styles.imageShade} /><View style={styles.tileCopy}><Pill label={experience.kind.toUpperCase()} accent={experience.accent} /><Text style={styles.tileTitle}>{experience.title}</Text><Text style={styles.tilePromise}>{experience.promise}</Text><Text style={styles.tileMeta}>{experience.duration} min · {experience.effort}  →</Text></View></ImageBackground></Pressable>;
}

function Pill({ label, accent }: { label: string; accent: string }) { return <View style={[styles.pill, { borderColor: accent }]}><View style={[styles.pillDot, { backgroundColor: accent }]} /><Text style={[styles.pillText, { color: accent }]}>{label}</Text></View>; }
function MiniFact({ value, label }: { value: string; label: string }) { return <View style={styles.miniFact}><Text numberOfLines={1} style={styles.miniFactValue}>{value}</Text><Text style={styles.miniFactLabel}>{label}</Text></View>; }
function ChoiceChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.choiceChip, selected && styles.choiceChipSelected]}><Text style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>{label}</Text></Pressable>; }
function DirectionEditor({ horizon, values, onSave }: { horizon: keyof typeof directionLabels; values: string[]; onSave: (values: string[]) => void }) {
  const [draft, setDraft] = useState(values.join('\n'));
  useEffect(() => setDraft(values.join('\n')), [values]);
  const save = () => onSave(draft.split('\n').map((item) => item.trim()).filter(Boolean));
  const placeholder = horizon === 'near' ? 'Bijvoorbeeld: vaker samen naar buiten' : horizon === 'growth' ? 'Bijvoorbeeld: sterker en nieuwsgieriger worden' : 'Bijvoorbeeld: aandacht voor gezin en natuur';
  return <View style={styles.directionCard}>
    <Text style={styles.directionTitle}>{directionLabels[horizon].title}</Text><Text style={styles.directionBody}>{directionLabels[horizon].body}</Text>
    <TextInput value={draft} onChangeText={setDraft} onBlur={save} placeholder={placeholder} placeholderTextColor="rgba(174,180,174,0.48)" multiline style={styles.directionInput} />
    <Pressable onPress={save} style={styles.directionSave}><Text style={styles.directionSaveText}>Richting bewaren</Text></Pressable>
  </View>;
}
function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>{label}</Text><Text style={styles.primaryArrow}>→</Text></Pressable>; }
function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>{label}</Text></Pressable>; }
function BackButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.backButton}><Text style={styles.backButtonText}>‹  {label}</Text></Pressable>; }
function ProfileRow({ label, value }: { label: string; value: string }) { return <View style={styles.profileRow}><Text style={styles.profileLabel}>{label}</Text><Text style={styles.profileValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink }, safe: { flex: 1, alignItems: 'center' }, appFrame: { flex: 1, width: '100%', maxWidth: 520 }, flex: { flex: 1 },
  onboardingScroll: { flexGrow: 1, padding: 24, paddingTop: 18, paddingBottom: 42 },
  onboardingProgress: { flexDirection: 'row', gap: 6, marginBottom: 48 },
  onboardingProgressPart: { height: 3, flex: 1, borderRadius: 2, backgroundColor: 'rgba(244,238,227,0.12)' },
  onboardingProgressActive: { backgroundColor: colors.green },
  onboardingTitle: { color: colors.bone, fontSize: 44, lineHeight: 48, letterSpacing: -1.4, fontWeight: '300', maxWidth: 430 },
  onboardingBody: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 18, marginBottom: 32, maxWidth: 430 },
  singleInput: { minHeight: 56, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(16,26,29,0.76)', color: colors.bone, fontSize: 16, paddingHorizontal: 16, marginBottom: 18 },
  onboardingChoices: { gap: 9, marginBottom: 24 },
  onboardingChoice: { minHeight: 60, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(16,26,29,0.62)', paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  onboardingChoiceSelected: { borderColor: colors.green, backgroundColor: 'rgba(164,197,93,0.12)' },
  onboardingChoiceTitle: { color: colors.bone, fontSize: 15, fontWeight: '600' },
  onboardingFooter: { marginTop: 'auto', paddingTop: 24 },
  trustCard: { borderRadius: 22, borderWidth: 1, borderColor: 'rgba(164,197,93,0.28)', backgroundColor: 'rgba(164,197,93,0.06)', padding: 18, marginTop: 8 },
  validationText: { color: colors.gold, fontSize: 11, textAlign: 'center', marginTop: 10 },
  quietCorrection: { color: 'rgba(217,179,107,0.8)', fontSize: 11 },
  personalCard: { borderRadius: 24, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', marginTop: 24, marginBottom: 26 },
  learningEvent: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 9 },
  directionCard: { borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(16,26,29,0.64)', padding: 16, marginBottom: 10 },
  directionTitle: { color: colors.bone, fontSize: 15, fontWeight: '700' },
  directionBody: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4, marginBottom: 11 },
  directionInput: { minHeight: 66, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(164,197,93,0.22)', color: colors.bone, padding: 12, textAlignVertical: 'top', fontSize: 13, lineHeight: 20 },
  directionSave: { alignSelf: 'flex-end', paddingVertical: 9, paddingHorizontal: 4 },
  directionSaveText: { color: colors.green, fontSize: 11, fontWeight: '700' },
  reflectionHint: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: -4, marginBottom: 12 },
  memorySignalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 7, borderTopWidth: 1, borderTopColor: colors.line, marginTop: 9 },
  memorySignalNote: { color: 'rgba(174,180,174,0.72)', fontSize: 9, lineHeight: 14, marginTop: 3 },
  forgetSignal: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(217,179,107,0.28)', paddingHorizontal: 10, paddingVertical: 7 },
  forgetSignalText: { color: colors.gold, fontSize: 9, fontWeight: '700' },
  directionMatch: { color: colors.green, fontSize: 9, lineHeight: 14, marginTop: 7, fontWeight: '700' },
  selectionReasons: { borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(16,26,29,0.58)', padding: 13, marginTop: 10, marginBottom: 8 },
  selectionReason: { color: colors.muted, fontSize: 10, lineHeight: 16 },
  insightCard: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(217,179,107,0.32)', backgroundColor: 'rgba(217,179,107,0.07)', padding: 17, marginTop: 22 },
  insightEyebrow: { color: colors.gold, fontSize: 9, letterSpacing: 1.2, fontWeight: '700' },
  insightTitle: { color: colors.bone, fontSize: 17, fontWeight: '700', marginTop: 8 },
  insightBody: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 7 },
  insightSource: { color: 'rgba(174,180,174,0.62)', fontSize: 9, marginTop: 11 },
  ambientGold: { position: 'absolute', width: 520, height: 520, borderRadius: 260, backgroundColor: 'rgba(143,93,42,0.19)', top: -350, right: -260 },
  ambientGreen: { position: 'absolute', width: 500, height: 500, borderRadius: 250, backgroundColor: 'rgba(58,87,66,0.15)', bottom: -330, left: -270 },
  screenScroll: { padding: 20, paddingTop: 12, paddingBottom: 116 }, flowScroll: { padding: 22, paddingTop: 12, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 }, headerCopy: { flex: 1, paddingRight: 12 },
  eyebrow: { color: colors.gold, fontSize: 10, letterSpacing: 1.9, fontWeight: '700', marginBottom: 10 },
  screenTitle: { color: colors.bone, fontSize: 40, lineHeight: 44, letterSpacing: -1.3, fontWeight: '300' }, screenSubtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.bone, fontSize: 15, fontWeight: '700' },
  heroCard: { borderRadius: 30, overflow: 'hidden', backgroundColor: 'rgba(16,26,29,0.96)', borderWidth: 1, borderColor: colors.line }, heroImage: { height: 390, padding: 18, justifyContent: 'space-between' }, heroImageStyle: { borderTopLeftRadius: 29, borderTopRightRadius: 29 }, imageShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(3,8,9,0.36)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, heroTime: { color: colors.bone, fontSize: 10, letterSpacing: 1.4 }, heroBottom: { gap: 11 }, heroTitle: { color: '#FFF9EF', fontSize: 38, lineHeight: 41, fontWeight: '300', letterSpacing: -1.1 }, heroPromise: { color: 'rgba(255,249,239,0.88)', fontSize: 16, lineHeight: 23, maxWidth: 390 }, heroFacts: { flexDirection: 'row', gap: 18, marginTop: 8 },
  heroActionArea: { padding: 18 }, wonderText: { color: colors.bone, fontSize: 15, lineHeight: 22, marginBottom: 16 },
  liveWorldBar: { minHeight: 64, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(16,26,29,0.72)', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 14 }, liveWorldBarTitle: { color: colors.bone, fontSize: 12, fontWeight: '600' }, liveWorldBarDetail: { color: colors.muted, fontSize: 10, marginTop: 3 }, liveWorldMark: { color: colors.green, fontSize: 22 },
  contextNotice: { minHeight: 58, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(217,179,107,0.28)', backgroundColor: 'rgba(217,179,107,0.05)', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 14 }, contextNoticeMark: { color: colors.gold, fontSize: 21 }, contextNoticeTitle: { color: colors.bone, fontSize: 12, fontWeight: '700' }, contextNoticeBody: { color: colors.muted, fontSize: 9, marginTop: 3 },
  pill: { alignSelf: 'flex-start', borderRadius: 99, borderWidth: 1, backgroundColor: 'rgba(5,10,10,0.56)', paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 7 }, pillDot: { width: 6, height: 6, borderRadius: 3 }, pillText: { fontSize: 9, letterSpacing: 1.2, fontWeight: '700' },
  miniFact: { minWidth: 70 }, miniFactValue: { color: colors.bone, fontSize: 13, fontWeight: '600' }, miniFactLabel: { color: 'rgba(244,238,227,0.62)', fontSize: 9, marginTop: 3 },
  primaryButton: { minHeight: 56, borderRadius: 19, backgroundColor: colors.green, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, primaryButtonText: { color: '#10160D', fontSize: 16, fontWeight: '700' }, primaryArrow: { color: '#10160D', fontSize: 22 },
  secondaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }, secondaryButtonText: { color: colors.bone, fontSize: 14, fontWeight: '600' }, pressed: { opacity: 0.74, transform: [{ scale: 0.992 }] },
  whyButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }, whyButtonText: { color: colors.muted, fontSize: 13 }, whyChevron: { color: colors.gold, fontSize: 18 }, whyPanel: { borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(164,197,93,0.06)', padding: 15, gap: 8 }, whyReason: { color: colors.bone, fontSize: 12, lineHeight: 18 }, proofNote: { color: 'rgba(174,180,174,0.58)', fontSize: 9, lineHeight: 14, marginTop: 3 }, quietAction: { minHeight: 38, alignItems: 'center', justifyContent: 'center' }, quietActionText: { color: colors.muted, fontSize: 12 },
  silentCard: { minHeight: 520, borderRadius: 30, borderWidth: 1, borderColor: colors.line, padding: 24, justifyContent: 'center', backgroundColor: 'rgba(16,26,29,0.6)' }, silentTitle: { color: colors.bone, fontSize: 36, lineHeight: 42, fontWeight: '300' },
  spaceCard: { marginTop: 16, minHeight: 90, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(217,179,107,0.3)', backgroundColor: 'rgba(16,26,29,0.75)', padding: 16, flexDirection: 'row', alignItems: 'center' }, spaceIcon: { width: 45, height: 45, borderRadius: 23, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginRight: 13 }, spaceIconText: { color: colors.gold, fontSize: 19 }, spaceTitle: { color: colors.bone, fontSize: 17, fontWeight: '600' }, spaceBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 }, arrow: { color: colors.gold, fontSize: 25 },
  daySummary: { borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(16,26,29,0.78)', padding: 17, marginBottom: 26 }, daySummaryTitle: { color: colors.bone, fontSize: 17 }, daySummaryBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 }, timeline: { gap: 0 }, timelineRow: { flexDirection: 'row' }, timelineRail: { width: 28, alignItems: 'center' }, timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 }, timelineLine: { flex: 1, width: 1, backgroundColor: colors.line, marginVertical: 7 }, timelineContent: { flex: 1, paddingBottom: 20 }, timelineTime: { color: colors.gold, fontSize: 9, letterSpacing: 1.3, fontWeight: '700', marginBottom: 9 }, dayCardImage: { minHeight: 190, justifyContent: 'flex-end' }, dayCardImageStyle: { borderRadius: 22 }, dayCardCopy: { padding: 17 }, dayCardTitle: { color: colors.bone, fontSize: 25, lineHeight: 29, fontWeight: '300' }, dayCardPromise: { color: 'rgba(244,238,227,0.8)', fontSize: 12, lineHeight: 17, marginTop: 6, maxWidth: 330 }, dayCardMeta: { color: colors.bone, fontSize: 11, marginTop: 12 }, quietDay: { borderTopWidth: 1, borderColor: colors.line, paddingTop: 20, marginTop: 2 }, quietDayTitle: { color: colors.bone, fontSize: 16 }, quietDayBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  calendarWindows: { borderRadius: 22, borderWidth: 1, borderColor: 'rgba(217,179,107,0.3)', backgroundColor: 'rgba(217,179,107,0.05)', padding: 17, marginBottom: 16, gap: 9 }, calendarWindowText: { color: colors.bone, fontSize: 11, lineHeight: 17 },
  intentPanel: { borderRadius: 28, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(16,26,29,0.88)', padding: 20 }, fieldLabel: { color: colors.gold, fontSize: 9, letterSpacing: 1.5, fontWeight: '700', marginTop: 6, marginBottom: 12 }, chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }, choiceChip: { borderRadius: 99, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 15, paddingVertical: 11 }, choiceChipSelected: { borderColor: colors.green, backgroundColor: 'rgba(164,197,93,0.16)' }, choiceChipText: { color: colors.muted, fontSize: 13 }, choiceChipTextSelected: { color: colors.bone }, intentInput: { minHeight: 118, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(4,10,12,0.48)', color: colors.bone, fontSize: 16, lineHeight: 23, padding: 16, textAlignVertical: 'top', marginBottom: 14 }, orRow: { flexDirection: 'row', alignItems: 'center', marginTop: 13 }, orLine: { flex: 1, height: 1, backgroundColor: colors.line }, orText: { color: colors.muted, fontSize: 9, marginHorizontal: 12 }, intentPrivacy: { color: 'rgba(174,180,174,0.6)', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 10 }, interpretation: { borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 15, marginBottom: 24 }, interpretationLabel: { color: colors.green, fontSize: 9, letterSpacing: 1.4, fontWeight: '700' }, interpretationText: { color: colors.bone, fontSize: 13, lineHeight: 19, marginTop: 7 }, sectionLabel: { color: colors.gold, fontSize: 9, letterSpacing: 1.5, fontWeight: '700', marginTop: 6, marginBottom: 10 }, experienceTile: { marginBottom: 20 }, tileImage: { minHeight: 210, justifyContent: 'flex-end' }, tileImageLarge: { minHeight: 310 }, tileImageStyle: { borderRadius: 25 }, tileCopy: { padding: 18 }, tileTitle: { color: colors.bone, fontSize: 29, lineHeight: 33, fontWeight: '300', marginTop: 12 }, tilePromise: { color: 'rgba(244,238,227,0.82)', fontSize: 13, lineHeight: 19, marginTop: 7 }, tileMeta: { color: colors.bone, fontSize: 11, marginTop: 14 }, finiteNote: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 2 },
  lifeSummary: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, paddingVertical: 18, marginBottom: 28 }, lifeSummaryBig: { color: colors.green, fontSize: 48, fontWeight: '200', marginRight: 16 }, lifeSummaryTitle: { color: colors.bone, fontSize: 16 }, lifeSummaryBody: { color: colors.muted, fontSize: 11, marginTop: 4 }, memoryGrid: { gap: 14 }, memoryCard: { minHeight: 230 }, memoryImage: { minHeight: 230, justifyContent: 'flex-end' }, memoryImageStyle: { borderRadius: 24 }, memoryCopy: { padding: 18 }, memoryDate: { color: colors.gold, fontSize: 9, letterSpacing: 1.2 }, memoryTitle: { color: colors.bone, fontSize: 27, lineHeight: 31, fontWeight: '300', marginTop: 7 }, memoryNote: { color: 'rgba(244,238,227,0.74)', fontSize: 12, lineHeight: 17, marginTop: 6 }, learningCard: { borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(164,197,93,0.06)', padding: 18, marginTop: 22 }, learningTitle: { color: colors.green, fontSize: 14, fontWeight: '700' }, learningBody: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 7 },
  bottomNav: { position: 'absolute', left: 14, right: 14, bottom: 10, minHeight: 72, borderRadius: 26, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(9,17,20,0.96)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5, minHeight: 62 }, navIcon: { color: colors.muted, fontSize: 18 }, navLabel: { color: colors.muted, fontSize: 10 }, navActive: { color: colors.green },
  backButton: { alignSelf: 'flex-start', minHeight: 42, justifyContent: 'center', marginBottom: 12 }, backButtonText: { color: colors.muted, fontSize: 14 }, detailHero: { height: 430, justifyContent: 'flex-end', marginHorizontal: -22, marginTop: -66, marginBottom: 24 }, detailHeroImage: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }, detailHeroCopy: { padding: 22, paddingTop: 120 }, detailTitle: { color: colors.bone, fontSize: 42, lineHeight: 45, fontWeight: '300', letterSpacing: -1.3, marginTop: 13 }, detailPromise: { color: 'rgba(244,238,227,0.84)', fontSize: 16, lineHeight: 23, marginTop: 10 }, wonderHeadline: { color: colors.gold, fontSize: 10, letterSpacing: 1.4, fontWeight: '700' }, wonderLarge: { color: colors.bone, fontSize: 21, lineHeight: 30, fontWeight: '300', marginTop: 10 }, factStrip: { flexDirection: 'row', gap: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, paddingVertical: 16, marginVertical: 22 },
  liveEvidenceCard: { borderRadius: 22, borderWidth: 1, borderColor: 'rgba(164,197,93,0.32)', backgroundColor: 'rgba(164,197,93,0.06)', padding: 16, gap: 12, marginBottom: 20 }, liveEvidenceTitle: { color: colors.green, fontSize: 9, letterSpacing: 1.35, fontWeight: '700' }, liveEvidenceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, liveEvidenceDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green, marginTop: 5 }, liveEvidenceLabel: { color: colors.bone, fontSize: 12, lineHeight: 17 }, liveEvidenceMeta: { color: colors.muted, fontSize: 9, marginTop: 3 }, liveEvidenceCaution: { color: colors.gold, fontSize: 10, lineHeight: 15, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  flowTitle: { color: colors.bone, fontSize: 41, lineHeight: 45, fontWeight: '300', letterSpacing: -1.2 }, prepareCard: { borderRadius: 25, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(16,26,29,0.82)', padding: 18, gap: 18, marginVertical: 28 }, prepareRow: { flexDirection: 'row', alignItems: 'center' }, stepNumber: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 13 }, stepNumberText: { color: colors.bone, fontSize: 12 }, prepareText: { color: colors.bone, fontSize: 16, flex: 1 }, commitmentCard: { borderRadius: 20, borderWidth: 1, borderColor: colors.line, padding: 16, marginBottom: 22 }, commitmentLabel: { color: colors.gold, fontSize: 9, letterSpacing: 1.3, fontWeight: '700' }, commitmentValue: { color: colors.bone, fontSize: 17, marginTop: 7 }, commitmentBody: { color: colors.muted, fontSize: 11, marginTop: 5 },
  routePlanCard: { borderRadius: 22, borderWidth: 1, borderColor: 'rgba(217,179,107,0.35)', backgroundColor: 'rgba(217,179,107,0.05)', padding: 16, marginBottom: 20 }, routePlanTitle: { color: colors.bone, fontSize: 20, lineHeight: 25, marginTop: 8 }, routeBudget: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 }, routeGuard: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 14, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 },
  presenceScreen: { flex: 1, padding: 22, paddingTop: 12, paddingBottom: 24 }, presenceTitle: { color: colors.bone, fontSize: 38, lineHeight: 43, fontWeight: '300', textAlign: 'center' }, presenceCue: { color: colors.muted, fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 370, marginTop: 18 }, presenceUnit: { color: colors.muted, fontSize: 9, letterSpacing: 1.5 }, presenceFooter: { color: colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 10 },
  capsuleProgress: { flexDirection: 'row', gap: 5, marginBottom: 12 }, capsuleProgressPart: { height: 3, flex: 1, borderRadius: 2, backgroundColor: 'rgba(244,238,227,0.12)' },
  capsuleStep: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 18 }, capsuleStepCount: { color: colors.muted, fontSize: 11, marginBottom: 14 },
  stepMetaPill: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 13, paddingVertical: 8, marginTop: 18 }, stepMetaText: { color: colors.bone, fontSize: 11, fontWeight: '600' },
  stepTimer: { width: 205, height: 205, borderRadius: 103, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginTop: 32 }, stepTimerValue: { color: colors.bone, fontSize: 48, fontWeight: '200', fontVariant: ['tabular-nums'] }, timerControl: { marginTop: 13, minHeight: 35, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }, timerControlText: { color: colors.bone, fontSize: 11, fontWeight: '700' },
  quietStepOrb: { width: 130, height: 130, borderRadius: 65, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 34 }, quietStepSymbol: { fontSize: 42, fontWeight: '200' },
  memoryPreview: { minHeight: 280, justifyContent: 'flex-end', marginVertical: 28 }, memoryPreviewTitle: { color: colors.bone, fontSize: 30, fontWeight: '300', padding: 18 }, memoryInput: { minHeight: 120, borderRadius: 20, borderWidth: 1, borderColor: colors.line, color: colors.bone, fontSize: 16, lineHeight: 23, padding: 16, textAlignVertical: 'top', marginBottom: 16, backgroundColor: 'rgba(16,26,29,0.7)' },
  profileCard: { borderRadius: 24, borderWidth: 1, borderColor: colors.line, marginTop: 28, overflow: 'hidden' }, profileRow: { minHeight: 58, borderBottomWidth: 1, borderBottomColor: colors.line, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, profileLabel: { color: colors.muted, fontSize: 13 }, profileValue: { color: colors.bone, fontSize: 13 },
  profileChoiceList: { gap: 8, marginBottom: 24 }, profileChoice: { minHeight: 64, borderRadius: 18, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11 }, profileChoiceSelected: { borderColor: colors.green, backgroundColor: 'rgba(164,197,93,0.12)' }, profileChoiceTitle: { color: colors.bone, fontSize: 15, fontWeight: '600' }, profileChoiceBody: { color: colors.muted, fontSize: 11, marginTop: 4 }, profileChoiceMark: { color: colors.green, fontSize: 14, marginLeft: 12 },
  liveControlCard: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(164,197,93,0.3)', backgroundColor: 'rgba(164,197,93,0.05)', padding: 17, marginTop: 22 }, liveControlMessage: { color: colors.muted, fontSize: 11, marginTop: 6, marginBottom: 14 }, sourceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 11 }, sourceState: { width: 8, height: 8, borderRadius: 4, marginTop: 4 }, sourceLive: { backgroundColor: colors.green }, sourceError: { backgroundColor: '#C56F61' }, sourceWaiting: { backgroundColor: colors.gold }, sourceName: { color: colors.bone, fontSize: 12, fontWeight: '600' }, sourceDetail: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 2 }, liveControlActions: { marginTop: 12 }, sourcePrivacy: { color: 'rgba(174,180,174,0.6)', fontSize: 9, lineHeight: 14, textAlign: 'center' }, futureSources: { marginTop: 24 }, futureSourceRow: { minHeight: 42, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, futureSourceLabel: { color: colors.muted, fontSize: 12 }, futureSourceState: { color: colors.gold, fontSize: 8, letterSpacing: 1.2, fontWeight: '700' },
  calendarControlCard: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(217,179,107,0.3)', backgroundColor: 'rgba(217,179,107,0.05)', padding: 17, marginTop: 22, gap: 9 },
});
