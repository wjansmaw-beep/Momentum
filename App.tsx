import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import {
  byId,
  Experience,
  ExperienceKind,
  experienceFactLabels,
  experiences,
  Surface,
} from './src/product/experienceModel';
import { composeContextualBlueprints, composeExperienceBlueprints, IntentClarificationOption, understandActiveIntent } from './src/product/experienceBlueprintComposer';
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
  Coordinates,
  futureSourceRegistry,
  LiveWorldSnapshot,
  loadLiveWorld,
  loadPlaceContext,
  overlayVerifiedWorldContext,
} from './src/liveworld/liveWorld';
import { composeLivingWorldOpportunities, opportunityToExperience, OpportunityEngineResult } from './src/liveworld/opportunityEngine';
import { livingWorldSourceRegistry } from './src/liveworld/sourceRegistry';
import { applyPlaceKnowledgeLens, attachNearestPlaceKnowledge } from './src/liveworld/placeKnowledgeLens';
import {
  CalendarContextSnapshot,
  emptyCalendarContext,
  formatWindow,
  loadCalendarContext,
} from './src/context/calendarContext';
import { clearLiveWorldCache, loadLiveWorldCache, saveLiveWorldCache, snapshotAgeMinutes } from './src/liveworld/liveCache';
import { createWorldContext, ResolvedContentCatalog, resolveContentCatalog } from './src/content/contentCatalog';
import {
  buildInviteUrl,
  clearInviteFromCurrentUrl,
  createSharedInvite,
  hostSharedState,
  readInviteFromCurrentUrl,
  SharedCapsuleInvite,
  SharedCapsuleState,
  SharedCoordination,
  sharedStateFromInvite,
} from './src/sharing/sharedCapsule';
import { ExperienceGuidePanel } from './src/guidance/ExperienceGuidePanel';
import { buildExperienceGuide, evidenceSummary, GuideDepth } from './src/guidance/experienceGuide';
import { composeGuideMoments } from './src/guidance/guideComposer';
import { auditCandidatePool, CompositionSummary } from './src/guidance/compositionAudit';
import { colors, radii, typography } from './src/design/theme';
import { useFonts } from 'expo-font';
import { Fraunces_500Medium, Fraunces_500Medium_Italic, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Ionicons } from '@expo/vector-icons';
import { CoverImage, DimShade, ImageShade } from './src/ui/CoverImage';
import { Glass } from './src/ui/Glass';
import { QuietCanvas } from './src/ui/QuietCanvas';
import { impactLight, impactMedium, notificationSuccess } from './src/design/haptics';
import { useBreathing, useImageContinuity, useKenBurns, usePressSpring, useStaggeredEntrance } from './src/design/motion';
// Horizon B (ADR-057): Reanimated + gesture-handler voor drag-/swipe-fysica,
// pull-to-refresh en ademende ambient-lagen. De Horizon A-entree en pressed-
// springs blijven bewust op de ingebouwde Animated API (zie src/design/motion.ts).
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { attachMeaningThread, meaningThreadFitsExperience } from './src/product/meaningThread';
import { generateContextualSuggestion, generateExperienceCandidates, GenerationOutcome, GeneratorRuntimeStatus, inspectGeneratorRuntime, isRemoteGenerationConfigured } from './src/product/generativeExperience';
import { routingCapability, verifyRouteBeforeHandoff } from './src/routing/routeIntelligence';
import { GeneratorEvaluationSignal as GenerationEvaluationSignal, GeneratorEvaluationTrial, generatorEvaluationPlan, generatorEvaluationProgress, nextGeneratorEvaluationScenario, scenarioContext } from './src/product/generatorEvaluation';

type FlowStage = 'invite' | 'prepare' | 'presence' | 'remember' | 'profile' | null;
type Memory = { id: string; title: string; date: string; image: string; note: string; sharedWith?: string[]; meaning?: string; experienceSnapshot?: Experience };
type ActiveSession = { experienceId: string; experienceSnapshot?: Experience; stage: 'prepare' | 'presence'; stepIndex: number; origin: Surface; company?: Company; guideDepth?: GuideDepth; shared?: SharedCapsuleState; updatedAt: string };
type GenerationKindEvidence = { shown: number; evaluated: number; personal: number; surprising: number; executable: number; contentUseful: number };
type PrototypeEvidence = {
  started: number;
  completed: number;
  reflected: number;
  skippedReflection: number;
  generatedShown: number;
  generatedRejected: number;
  generatedEvaluated: number;
  generationSignals: Record<GenerationEvaluationSignal, number>;
  generationByKind: Record<ExperienceKind, GenerationKindEvidence>;
  generationTrials: GeneratorEvaluationTrial[];
  lastGenerationNote?: string;
  lastUpdated?: string;
};
type ContextualSuggestionCache = { signature: string; expiresAt: string; experience: Experience };

const appFont = typography.family;
// Redactionele display-serif (ADR-057 Horizon A): Fraunces voor titels met verhaalkarakter;
// het systeem-sans blijft de stem van de interface.
const editorialFont = typography.displayFamily;
const editorialMediumFont = typography.displayFamilyMedium;
const editorialItalicFont = typography.displayFamilyItalic;
const memoryKey = 'momentum.memories.v2';
const contextKey = 'momentum.prototype-context.v1';
const personalProfileKey = 'momentum.personal-profile.v1';
const activeSessionKey = 'momentum.active-session.v1';
const evidenceKey = 'momentum.prototype-evidence.v1';
const contextualSuggestionKey = 'momentum.contextual-suggestion.v1';
const emptyGenerationSignals = (): Record<GenerationEvaluationSignal, number> => ({ personal: 0, surprising: 0, executable: 0, 'content-useful': 0 });
const emptyKindEvidence = (): GenerationKindEvidence => ({ shown: 0, evaluated: 0, personal: 0, surprising: 0, executable: 0, contentUseful: 0 });
const emptyGenerationByKind = (): Record<ExperienceKind, GenerationKindEvidence> => ({ outside: emptyKindEvidence(), food: emptyKindEvidence(), movement: emptyKindEvidence(), restore: emptyKindEvidence(), connect: emptyKindEvidence(), learn: emptyKindEvidence(), culture: emptyKindEvidence() });
const emptyPrototypeEvidence = (): PrototypeEvidence => ({ started: 0, completed: 0, reflected: 0, skippedReflection: 0, generatedShown: 0, generatedRejected: 0, generatedEvaluated: 0, generationSignals: emptyGenerationSignals(), generationByKind: emptyGenerationByKind(), generationTrials: [] });
const timeOptions = [15, 30, 60, 120];
const dutchMonthNames = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
const defaultRegion = { coordinates: { latitude: 53.325, longitude: 5.999 }, label: 'Dokkum' };
// Profiel-lab (evaluatie, dekkingsmatrix, proefbank) staat alleen aan achter een debug-vlag (ADR-057).
const MOMENTUM_DEBUG = (globalThis as any).__DEV__ === true
  || (globalThis as any).process?.env?.EXPO_PUBLIC_MOMENTUM_DEBUG === '1';
export default function App() {
  const { height } = useWindowDimensions();
  const [displayFontsLoaded] = useFonts({ Fraunces_500Medium, Fraunces_500Medium_Italic, Fraunces_600SemiBold });
  const [surface, setSurface] = useState<Surface>('now');
  const [flowStage, setFlowStage] = useState<FlowStage>(null);
  const [selected, setSelected] = useState<Experience>(byId('wadden-light'));
  const [origin, setOrigin] = useState<Surface>('now');
  const [prototypeContext, setPrototypeContext] = useState<PrototypeContext>(defaultPrototypeContext);
  const [contextHydrated, setContextHydrated] = useState(false);
  const [personalProfile, setPersonalProfile] = useState<PersonalProfile>(defaultPersonalProfile);
  const [personalHydrated, setPersonalHydrated] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [completedSession, setCompletedSession] = useState<ActiveSession | null>(null);
  const [incomingInvite, setIncomingInvite] = useState<SharedCapsuleInvite | null>(null);
  const [inviteIssue, setInviteIssue] = useState<'invalid' | 'expired' | null>(null);
  const [sharedDraft, setSharedDraft] = useState<SharedCapsuleState | null>(null);
  const [inviteGuestMode, setInviteGuestMode] = useState(false);
  const [evidence, setEvidence] = useState<PrototypeEvidence>(emptyPrototypeEvidence);

  useEffect(() => {
    if (Platform.OS === 'web') (globalThis as any).scrollTo?.(0, 0);
  }, [surface, flowStage]);
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const [evidenceHydrated, setEvidenceHydrated] = useState(false);
  const [liveWorld, setLiveWorld] = useState<LiveWorldSnapshot | null>(null);
  const [selectionLocationConfirmed, setSelectionLocationConfirmed] = useState(false);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveMessage, setLiveMessage] = useState('Live bronnen worden gecontroleerd…');
  const [calendarContext, setCalendarContext] = useState<CalendarContextSnapshot>(emptyCalendarContext);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [contextualGenerated, setContextualGenerated] = useState<Experience | null>(null);
  const [pendingContextual, setPendingContextual] = useState<Experience | null>(null);
  const [generatorStatus, setGeneratorStatus] = useState<GeneratorRuntimeStatus>({ state: 'checking', label: 'Generator controleren', detail: 'Momentum controleert welke synthese beschikbaar is.' });
  const [momentGenerationLoading, setMomentGenerationLoading] = useState(false);
  const [momentNotice, setMomentNotice] = useState('');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.backgroundColor = colors.ink;
      document.body.style.backgroundColor = colors.ink;
      if (appFont) document.body.style.fontFamily = appFont;
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
    AsyncStorage.getItem(activeSessionKey).then((value) => {
      if (!value) return;
      const stored = JSON.parse(value) as ActiveSession;
      if (stored.experienceId && ['prepare', 'presence'].includes(stored.stage)) setActiveSession(stored);
    }).catch(() => undefined).finally(() => setSessionHydrated(true));
    AsyncStorage.getItem(evidenceKey).then((value) => {
      if (!value) return;
      const stored = JSON.parse(value) as Partial<PrototypeEvidence>;
      const storedByKind = stored.generationByKind ?? {} as Partial<Record<ExperienceKind, Partial<GenerationKindEvidence>>>;
      setEvidence((current) => {
        const currentByKind = current.generationByKind ?? emptyGenerationByKind();
        return {
          ...current,
          ...stored,
          generationSignals: { ...(current.generationSignals ?? emptyGenerationSignals()), ...(stored.generationSignals ?? {}) },
          generationByKind: (Object.keys(currentByKind) as ExperienceKind[]).reduce((all, kind) => ({ ...all, [kind]: { ...currentByKind[kind], ...(storedByKind[kind] ?? {}) } }), currentByKind),
          generationTrials: Array.isArray(stored.generationTrials) ? stored.generationTrials.slice(-100) : [],
        };
      });
    }).catch(() => undefined).finally(() => setEvidenceHydrated(true));
    loadLiveWorldCache(defaultRegion.coordinates).then((cached) => {
      if (cached) { setLiveWorld(cached); setLiveMessage(`Eerdere regionale context · ${Math.round(snapshotAgeMinutes(cached))} min oud`); }
      return loadLiveWorld(defaultRegion.coordinates, defaultRegion.label);
    }).then((snapshot) => {
      setLiveWorld(snapshot); setLiveLoading(false); setLiveMessage('Snelle live bronnen bijgewerkt · plaatsen volgen'); saveLiveWorldCache(snapshot).catch(() => undefined);
      loadPlaceContext(snapshot).then((enhanced) => { setLiveWorld(enhanced); setLiveMessage('Live bronnen bijgewerkt'); saveLiveWorldCache(enhanced).catch(() => undefined); }).catch(() => undefined);
    }).catch(() => { setLiveLoading(false); setLiveMessage('Live bronnen konden niet worden bijgewerkt'); });
    loadCalendarContext(false).then(setCalendarContext).catch(() => undefined);
    inspectGeneratorRuntime().then(setGeneratorStatus).catch(() => undefined);
    const inviteResult = readInviteFromCurrentUrl();
    if (inviteResult.state === 'valid') { setIncomingInvite(inviteResult.invite); setFlowStage('invite'); }
    if (inviteResult.state === 'expired') { setIncomingInvite(inviteResult.invite); setInviteIssue('expired'); setFlowStage('invite'); }
    if (inviteResult.state === 'invalid') { setInviteIssue('invalid'); setFlowStage('invite'); }
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

  useEffect(() => {
    if (!sessionHydrated) return;
    if (activeSession) AsyncStorage.setItem(activeSessionKey, JSON.stringify(activeSession)).catch(() => undefined);
    else AsyncStorage.removeItem(activeSessionKey).catch(() => undefined);
  }, [activeSession, sessionHydrated]);

  useEffect(() => { if (evidenceHydrated) AsyncStorage.setItem(evidenceKey, JSON.stringify(evidence)).catch(() => undefined); }, [evidence, evidenceHydrated]);

  useEffect(() => {
    if (!momentNotice) return;
    const timer = setTimeout(() => setMomentNotice(''), 8000);
    return () => clearTimeout(timer);
  }, [momentNotice]);

  const effectiveContext = useMemo(() => calendarContext.state === 'live' && calendarContext.currentFreeMinutes
    ? { ...prototypeContext, availableMinutes: Math.max(15, Math.min(120, calendarContext.currentFreeMinutes)) }
    : prototypeContext, [calendarContext.currentFreeMinutes, calendarContext.state, prototypeContext]);
  const opportunityResult = useMemo<OpportunityEngineResult>(() => liveWorld && selectionLocationConfirmed
    ? composeLivingWorldOpportunities(liveWorld, effectiveContext, { maxTravelMinutes: personalProfile.maxTravelMinutes, bike: personalProfile.equipment.bike })
    : { ready: [], withheld: [], considered: 0, sourceLabel: 'Globale omgeving niet gekoppeld', sourceMix: [], perspectiveCount: 0, knowledgeCount: 0 }, [effectiveContext, liveWorld, personalProfile.equipment.bike, personalProfile.maxTravelMinutes, selectionLocationConfirmed]);
  const liveExperiences = useMemo(() => opportunityResult.ready.map((opportunity) => composeGuideMoments(opportunityToExperience(opportunity))), [opportunityResult]);
  const contentCatalog = useMemo(() => resolveContentCatalog(createWorldContext(liveWorld?.coordinates ?? defaultRegion.coordinates, new Date(), 'nl', selectionLocationConfirmed)), [liveWorld?.coordinates, selectionLocationConfirmed]);
  const guidedCatalogExperiences = useMemo(() => contentCatalog.experiences.map((item) => composeGuideMoments(item)), [contentCatalog.experiences]);
  const contextualBlueprints = useMemo(() => applyPlaceKnowledgeLens(
    composeContextualBlueprints(effectiveContext, guidedCatalogExperiences, personalProfile.preferredKinds).map((item) => attachMeaningThread(item, personalProfile)),
    selectionLocationConfirmed ? liveWorld ?? undefined : undefined,
  ), [effectiveContext, guidedCatalogExperiences, liveWorld, personalProfile, selectionLocationConfirmed]);
  const meaningfulLiveExperiences = useMemo(() => liveExperiences.map((item) => attachMeaningThread(item, personalProfile)), [liveExperiences, personalProfile]);
  const baseCompositionAudit = useMemo(() => auditCandidatePool([...meaningfulLiveExperiences, ...contextualBlueprints]), [contextualBlueprints, meaningfulLiveExperiences]);
  const baseCandidatePool = baseCompositionAudit.accepted.length ? baseCompositionAudit.accepted : guidedCatalogExperiences;
  const contextualPrepared = useMemo(() => contextualGenerated
    ? attachMeaningThread(composeGuideMoments(attachNearestPlaceKnowledge(overlayVerifiedWorldContext(contextualGenerated, selectionLocationConfirmed ? liveWorld ?? undefined : undefined), selectionLocationConfirmed ? liveWorld ?? undefined : undefined)), personalProfile)
    : null, [contextualGenerated, liveWorld, personalProfile, selectionLocationConfirmed]);
  const compositionAudit = useMemo(() => auditCandidatePool([...(contextualPrepared ? [contextualPrepared] : []), ...baseCandidatePool]), [baseCandidatePool, contextualPrepared]);
  const candidatePool = compositionAudit.accepted.length ? compositionAudit.accepted : baseCandidatePool;
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
  const nowSuggestions = useMemo(() => {
    const items: Array<{ experience: Experience; decision: LocalDecision }> = [];
    const excluded: string[] = [];
    for (let index = 0; index < 3; index += 1) {
      const decision = rankForMoment(effectiveContext, '', excluded, candidatePool, learningContext);
      const experience = decision.selected?.experience;
      if (!experience) break;
      items.push({ experience, decision });
      excluded.push(experience.id);
    }
    return items.length ? items : [{ experience: primaryExperience, decision: primaryDecision }];
  }, [candidatePool, effectiveContext, learningContext, primaryDecision, primaryExperience]);
  const resumableExperience = activeSession ? activeSession.experienceSnapshot ?? candidatePool.find((experience) => experience.id === activeSession.experienceId) ?? experiences.find((experience) => experience.id === activeSession.experienceId) : undefined;
  const dayDecisions = useMemo(() => buildToday(effectiveContext, meaningfulLiveExperiences, learningContext, calendarContext.state === 'live' ? calendarContext.freeWindows : undefined, [...(contextualPrepared ? [contextualPrepared] : []), ...contextualBlueprints]), [calendarContext.freeWindows, calendarContext.state, contextualBlueprints, contextualPrepared, effectiveContext, learningContext, meaningfulLiveExperiences]);

  const contextualDomain = useMemo(() => {
    const choices = personalProfile.preferredKinds.length ? personalProfile.preferredKinds : (['outside', 'restore', 'learn'] as ExperienceKind[]);
    const dateKey = new Date().toISOString().slice(0, 10);
    const seed = Array.from(`${dateKey}-${effectiveContext.dayPart}`).reduce((sum, character) => sum + character.charCodeAt(0), 0);
    return choices[seed % choices.length];
  }, [effectiveContext.dayPart, personalProfile.preferredKinds]);
  const contextualSignature = `${new Date().toISOString().slice(0, 10)}:${effectiveContext.dayPart}:${effectiveContext.company}:${Math.round(effectiveContext.availableMinutes / 15) * 15}:${contextualDomain}`;

  // Hero stability (review finding): an arriving generated candidate may never replace the
  // hero while the user is looking at it. Chosen variant: a calm, user-gated switch.
  // `heroAnchorRef` holds the signature of the hero currently established on screen;
  // `contextualGeneratedRef` mirrors state so the async effect can compare without stale closures.
  const heroAnchorRef = useRef<string | null>(null);
  const contextualGeneratedRef = useRef<Experience | null>(null);
  useEffect(() => { contextualGeneratedRef.current = contextualGenerated; }, [contextualGenerated]);
  // A pending candidate belongs to the signature it was created for; drop it on any natural change.
  useEffect(() => { setPendingContextual(null); }, [contextualSignature]);

  // Adoption policy (the 6-hour cache and signature logic below are unchanged):
  // - The same capsule arriving again (an effect re-run) is adopted silently and never shows the pill.
  // - First arrival after opening: a cache hit lands inside the opening frame and adopts directly;
  //   a fresh generation resolves seconds later, while the user is already reading the hero,
  //   so it is offered as a quiet "Nieuwe blik beschikbaar" pill instead of swapping the hero.
  // - A new day-part signature is a natural change and adopts directly again.
  // - An explicit refresh (createFreshMoment) already adopts by design, and pressing the pill
  //   is the user's conscious switch. Declining the hero leaves the pill available.
  const settleContextualCandidate = (experience: Experience, fromCache: boolean, signature: string) => {
    if (contextualGeneratedRef.current?.id === experience.id) { setPendingContextual(null); return; }
    const anchor = heroAnchorRef.current;
    if (anchor === null) {
      heroAnchorRef.current = signature;
      if (fromCache) { setContextualGenerated(experience); setPendingContextual(null); }
      else setPendingContextual(experience);
      return;
    }
    if (anchor !== signature) {
      heroAnchorRef.current = signature;
      setContextualGenerated(experience);
      setPendingContextual(null);
      return;
    }
    setPendingContextual(experience);
  };
  const showPendingContextual = () => {
    if (!pendingContextual) return;
    heroAnchorRef.current = contextualSignature;
    setContextualGenerated(pendingContextual);
    setPendingContextual(null);
  };

  useEffect(() => {
    if (!personalHydrated || !contextHydrated || !personalProfile.onboardingComplete || activeSession) return;
    let active = true;
    AsyncStorage.getItem(contextualSuggestionKey).then(async (stored) => {
      if (!active) return;
      if (stored) {
        try {
          const cached = JSON.parse(stored) as ContextualSuggestionCache;
          if (cached.signature === contextualSignature && Date.parse(cached.expiresAt) > Date.now() && cached.experience) {
            settleContextualCandidate(cached.experience, true, contextualSignature); return;
          }
        } catch {
          AsyncStorage.removeItem(contextualSuggestionKey).catch(() => undefined);
        }
      }
      const outcome = await generateContextualSuggestion(contextualDomain, effectiveContext, baseCandidatePool, contextualSignature);
      const experience = outcome.experiences[0];
      if (!active || !experience) return;
      settleContextualCandidate(experience, false, contextualSignature);
      const cache: ContextualSuggestionCache = { signature: contextualSignature, expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), experience };
      AsyncStorage.setItem(contextualSuggestionKey, JSON.stringify(cache)).catch(() => undefined);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [activeSession, baseCandidatePool, contextHydrated, contextualDomain, contextualSignature, effectiveContext, personalHydrated, personalProfile.onboardingComplete]);

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

  const openExperience = (experience: Experience, from: Surface, stage: FlowStage = 'prepare') => {
    setSelected(experience);
    setOrigin(from);
    setSharedDraft(null);
    setFlowStage(stage);
  };

  const createFreshMoment = async () => {
    if (momentGenerationLoading) return;
    setMomentGenerationLoading(true);
    setMomentNotice('');
    try {
      const choices = personalProfile.preferredKinds.length ? personalProfile.preferredKinds : (['outside', 'restore', 'learn'] as ExperienceKind[]);
      const currentIndex = contextualGenerated ? choices.indexOf(contextualGenerated.kind) : -1;
      const nextDomain = choices[(currentIndex + 1 + choices.length) % choices.length];
      const outcome = await generateContextualSuggestion(nextDomain, effectiveContext, baseCandidatePool, `momentmaker-${Date.now()}`);
      const draft = outcome.experiences[0];
      setEvidence((current) => ({
        ...current,
        generatedShown: current.generatedShown + outcome.experiences.length,
        generatedRejected: current.generatedRejected + outcome.rejected,
        generationByKind: draft ? { ...current.generationByKind, [draft.kind]: { ...current.generationByKind[draft.kind], shown: current.generationByKind[draft.kind].shown + 1 } } : current.generationByKind,
        lastGenerationNote: outcome.rejected > 0 ? `${outcome.rejected} concept(en) voldeden niet aan het capsulecontract.` : 'De gegenereerde capsule voldeed aan het contract en werd zichtbaar gemaakt.',
        lastUpdated: new Date().toISOString(),
      }));
      if (!draft) { setMomentNotice('Het lukte niet om iets nieuws samen te stellen — je huidige voorstel blijft staan.'); return; }
      const prepared = attachMeaningThread(
        composeGuideMoments(attachNearestPlaceKnowledge(overlayVerifiedWorldContext(draft, selectionLocationConfirmed ? liveWorld ?? undefined : undefined), selectionLocationConfirmed ? liveWorld ?? undefined : undefined)),
        personalProfile,
      );
      setContextualGenerated(draft);
      setSelected(prepared);
      setOrigin('now');
      setFlowStage('prepare');
      const cache: ContextualSuggestionCache = { signature: contextualSignature, expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), experience: draft };
      AsyncStorage.setItem(contextualSuggestionKey, JSON.stringify(cache)).catch(() => undefined);
    } finally {
      setGeneratorStatus(await inspectGeneratorRuntime());
      setMomentGenerationLoading(false);
    }
  };

  const createEvaluationMoment = async (kind: ExperienceKind, evaluationContext: PrototypeContext) => {
    if (momentGenerationLoading) return;
    setMomentGenerationLoading(true);
    try {
      const plannedScenario = generatorEvaluationPlan.find((scenario) => scenario.kind === kind
        && scenario.availableMinutes === evaluationContext.availableMinutes
        && scenario.dayPart === evaluationContext.dayPart
        && scenario.company === evaluationContext.company
        && (kind !== 'movement' || scenario.hasKettlebell === evaluationContext.hasKettlebell));
      const outcome = await generateContextualSuggestion(kind, evaluationContext, baseCandidatePool, `lab-${kind}-${evaluationContext.dayPart}-${evaluationContext.company}-${evaluationContext.availableMinutes}-${evaluationContext.hasKettlebell}-${Date.now()}`);
      const draft = outcome.experiences[0];
      setEvidence((current) => ({
        ...current,
        generatedShown: current.generatedShown + outcome.experiences.length,
        generatedRejected: current.generatedRejected + outcome.rejected,
        generationByKind: draft ? { ...current.generationByKind, [draft.kind]: { ...current.generationByKind[draft.kind], shown: current.generationByKind[draft.kind].shown + 1 } } : current.generationByKind,
        generationTrials: [...current.generationTrials, {
          id: plannedScenario?.id ?? `free-${kind}-${evaluationContext.availableMinutes}-${evaluationContext.dayPart}-${evaluationContext.company}-${evaluationContext.hasKettlebell}`,
          label: plannedScenario?.label ?? 'Vrije proef',
          kind,
          availableMinutes: evaluationContext.availableMinutes,
          dayPart: evaluationContext.dayPart,
          company: evaluationContext.company,
          hasKettlebell: evaluationContext.hasKettlebell,
          attemptedAt: new Date().toISOString(),
          status: draft ? 'shown' as const : 'rejected' as const,
          experienceId: draft?.id,
          signals: [],
        }].slice(-100),
        lastGenerationNote: draft ? `${experienceKindLabels[draft.kind]}: de capsule voldeed aan het contract en werd geopend.` : `${experienceKindLabels[kind]}: geen concept doorstond alle controles.`,
        lastUpdated: new Date().toISOString(),
      }));
      if (!draft) return;
      const prepared = attachMeaningThread(
        composeGuideMoments(attachNearestPlaceKnowledge(overlayVerifiedWorldContext(draft, selectionLocationConfirmed ? liveWorld ?? undefined : undefined), selectionLocationConfirmed ? liveWorld ?? undefined : undefined)),
        personalProfile,
      );
      setSelected(prepared);
      setOrigin('now');
      setFlowStage('prepare');
    } finally {
      setGeneratorStatus(await inspectGeneratorRuntime());
      setMomentGenerationLoading(false);
    }
  };

  const startPresence = (company: Company, guideDepth: GuideDepth, shared?: SharedCapsuleState) => {
    const isNew = activeSession?.experienceId !== selected.id;
    setActiveSession({ experienceId: selected.id, experienceSnapshot: selected, stage: 'presence', stepIndex: isNew ? 0 : activeSession?.stepIndex ?? 0, origin, company, guideDepth, shared, updatedAt: new Date().toISOString() });
    if (isNew) setEvidence((current) => ({ ...current, started: current.started + 1, lastUpdated: new Date().toISOString() }));
    setFlowStage('presence');
  };

  const savePreparation = (company: Company, guideDepth: GuideDepth, shared?: SharedCapsuleState) => {
    setSharedDraft(shared ?? null);
    setActiveSession((current) => {
      return { experienceId: selected.id, experienceSnapshot: selected, stage: 'prepare', stepIndex: current?.experienceId === selected.id ? current.stepIndex : 0, origin, company, guideDepth, shared, updatedAt: new Date().toISOString() };
    });
  };

  const resumeSession = () => {
    if (!activeSession) return;
    const sessionExperience = activeSession.experienceSnapshot ?? candidatePool.find((experience) => experience.id === activeSession.experienceId) ?? experiences.find((experience) => experience.id === activeSession.experienceId);
    if (!sessionExperience) return;
    setSelected(sessionExperience); setOrigin(activeSession.origin); setFlowStage(activeSession.stage);
  };

  const finishPresence = () => {
    notificationSuccess();
    setEvidence((current) => ({ ...current, completed: current.completed + 1, lastUpdated: new Date().toISOString() }));
    setCompletedSession(activeSession);
    setActiveSession(null); setFlowStage('remember');
  };

  const acceptIncomingInvite = (guestName: string) => {
    if (!incomingInvite) return;
    const invitedExperience = candidatePool.find((item) => item.id === incomingInvite.experienceId) ?? experiences.find((item) => item.id === incomingInvite.experienceId);
    if (!invitedExperience) return;
    const shared = sharedStateFromInvite(incomingInvite, guestName);
    setInviteGuestMode(true);
    setSelected(invitedExperience);
    setOrigin('now');
    setPrototypeContext((current) => ({ ...current, company: incomingInvite.company }));
    setSharedDraft(shared);
    setActiveSession({ experienceId: invitedExperience.id, experienceSnapshot: invitedExperience, stage: 'prepare', stepIndex: 0, origin: 'now', company: incomingInvite.company, guideDepth: incomingInvite.guideDepth, shared, updatedAt: new Date().toISOString() });
    setIncomingInvite(null);
    setInviteIssue(null);
    clearInviteFromCurrentUrl();
    setFlowStage('prepare');
  };

  const declineIncomingInvite = () => {
    setIncomingInvite(null);
    setInviteIssue(null);
    clearInviteFromCurrentUrl();
    setFlowStage(null);
  };

  const closeFlow = () => setFlowStage(null);
  const finishExperience = (input: ReflectionInput, generationEvaluation: GenerationEvaluationSignal[] = []) => {
    notificationSuccess();
    const memory: Memory = {
      id: `${selected.id}-${Date.now()}`,
      title: selected.title,
      date: 'Vandaag',
      image: selected.image,
      note: input.note || 'Een moment dat de moeite waard was.',
      sharedWith: completedSession?.shared?.participants.filter((participant) => participant.status === 'ready' && participant.role !== completedSession.shared?.role).map((participant) => participant.name),
      meaning: selected.meaningThread?.label,
      experienceSnapshot: selected,
    };
    setMemories((current) => [memory, ...current.filter((item) => item.id !== selected.id)].slice(0, 12));
    setPersonalProfile((current) => applyReflection(current, selected, input));
    setEvidence((current) => ({
      ...current,
      reflected: current.reflected + 1,
      generatedEvaluated: current.generatedEvaluated + (selected.generation ? 1 : 0),
      generationSignals: selected.generation ? generationEvaluation.reduce((counts, signal) => ({ ...counts, [signal]: counts[signal] + 1 }), current.generationSignals) : current.generationSignals,
      generationByKind: selected.generation ? {
        ...current.generationByKind,
        [selected.kind]: generationEvaluation.reduce((kindEvidence, signal) => ({
          ...kindEvidence,
          [signal === 'content-useful' ? 'contentUseful' : signal]: kindEvidence[signal === 'content-useful' ? 'contentUseful' : signal] + 1,
        }), { ...current.generationByKind[selected.kind], evaluated: current.generationByKind[selected.kind].evaluated + 1 }),
      } : current.generationByKind,
      generationTrials: selected.generation ? (() => {
        const latestIndex = current.generationTrials.map((trial) => trial.experienceId === selected.id && trial.status === 'shown').lastIndexOf(true);
        return latestIndex < 0 ? current.generationTrials : current.generationTrials.map((trial, index) => index === latestIndex ? { ...trial, status: 'evaluated' as const, signals: generationEvaluation } : trial);
      })() : current.generationTrials,
      lastUpdated: new Date().toISOString(),
    }));
    setFlowStage(null);
    setCompletedSession(null);
    setSurface('lifebook');
  };

  const skipReflection = () => {
    setEvidence((current) => ({ ...current, skippedReflection: current.skippedReflection + 1, lastUpdated: new Date().toISOString() }));
    setCompletedSession(null); setFlowStage(null); setSurface(origin);
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

  const presenceBackHandlerRef = useRef<() => boolean>(() => false);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (flowStage === 'presence') {
        if (presenceBackHandlerRef.current()) return true;
        setActiveSession((current) => (current ? { ...current, stage: 'prepare', updatedAt: new Date().toISOString() } : current));
        setFlowStage('prepare');
        return true;
      }
      if (flowStage === 'remember') { skipReflection(); return true; }
      if (flowStage === 'invite') { declineIncomingInvite(); return true; }
      if (flowStage) { closeFlow(); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [flowStage, origin]);

  if (!personalHydrated || !displayFontsLoaded) return <View style={styles.root} />;
  if (flowStage === 'invite' && incomingInvite) return <IncomingInviteScreen invite={incomingInvite} expired={inviteIssue === 'expired'} available={candidatePool.some((item) => item.id === incomingInvite.experienceId) || experiences.some((item) => item.id === incomingInvite.experienceId)} onAccept={acceptIncomingInvite} onDecline={declineIncomingInvite} />;
  if (flowStage === 'invite' && inviteIssue === 'invalid') return <InvalidInviteScreen onClose={declineIncomingInvite} />;
  if (!personalProfile.onboardingComplete && !inviteGuestMode) return <OnboardingScreen initial={personalProfile} onComplete={finishOnboarding} />;

  return (
    <View style={[styles.root, { minHeight: height }]}>
      <StatusBar style={flowStage === 'presence' ? 'light' : 'dark'} />
      <AmbientBlobs />
      <SafeAreaView style={styles.safe}>
        <View style={[styles.appFrame, Platform.OS === 'web' && styles.webAppFrame]}>
          {flowStage === null && (
            <>
              {surface === 'now' && <NowScreen firstName={personalProfile.firstName} suggestions={nowSuggestions} resumableExperience={resumableExperience} context={effectiveContext} calendar={calendarContext} liveWorld={liveWorld} liveLoading={liveLoading} generatorStatus={generatorStatus} generatingMoment={momentGenerationLoading} momentNotice={momentNotice} onDismissMomentNotice={() => setMomentNotice('')} onGenerateMoment={createFreshMoment} pendingExperience={pendingContextual} onShowPendingExperience={showPendingContextual} onResume={resumeSession} onDiscardSession={() => setActiveSession(null)} onOpen={(item, stage) => openExperience(item, 'now', stage)} onProfile={() => setFlowStage('profile')} onDiscover={() => setSurface('discover')} onRefresh={() => refreshLiveWorld()} onFeedback={(item, outcome) => setPersonalProfile((current) => applyLearning(current, item, outcome))} />}
              {surface === 'today' && <TodayScreen decisions={dayDecisions} calendar={calendarContext} onOpen={(item) => openExperience(item, 'today')} />}
              {surface === 'discover' && <DiscoverScreen context={prototypeContext} candidatePool={candidatePool} learning={learningContext} personal={personalProfile} onOpen={(item) => openExperience(item, 'discover')} />}
              {surface === 'lifebook' && <LifeBookScreen memories={memories} personal={personalProfile} onProfile={() => setFlowStage('profile')} onOpen={(item) => { setPersonalProfile((current) => applyLearning(current, item, 'repeat')); openExperience(item, 'lifebook'); }} />}
              <BottomNav surface={surface} onChange={setSurface} />
            </>
          )}
          {flowStage === 'prepare' && <PrepareScreen experience={selected} personal={personalProfile} hostName={personalProfile.firstName || 'Iemand'} initialCompany={(activeSession?.experienceId === selected.id ? activeSession.company : sharedDraft ? 'together' : personalProfile.defaultCompany) ?? 'solo'} initialGuideDepth={activeSession?.experienceId === selected.id ? activeSession.guideDepth : undefined} initialShared={activeSession?.experienceId === selected.id ? activeSession.shared : sharedDraft ?? undefined} onBack={closeFlow} onDraftChange={savePreparation} onStart={startPresence} />}
          {flowStage === 'presence' && <PresenceScreen experience={selected} personal={personalProfile} company={activeSession?.company ?? personalProfile.defaultCompany} guideDepth={activeSession?.guideDepth ?? 'guide'} shared={activeSession?.shared} initialStep={activeSession?.experienceId === selected.id ? activeSession.stepIndex : 0} onStepChange={(stepIndex) => setActiveSession((current) => current && current.experienceId === selected.id ? { ...current, stage: 'presence', stepIndex, updatedAt: new Date().toISOString() } : current)} onBack={() => { setActiveSession((current) => current ? { ...current, stage: 'prepare', updatedAt: new Date().toISOString() } : current); setFlowStage('prepare'); }} onFinish={finishPresence} backHandlerRef={presenceBackHandlerRef} />}
          {flowStage === 'remember' && <RememberScreen experience={selected} personal={personalProfile} shared={completedSession?.shared} onSkip={skipReflection} onSave={finishExperience} />}
          {flowStage === 'profile' && <ProfileScreen personal={personalProfile} evidence={evidence} composition={compositionAudit.summary} opportunitySummary={opportunityResult} generatorStatus={generatorStatus} generatingMoment={momentGenerationLoading} context={prototypeContext} calendar={calendarContext} calendarLoading={calendarLoading} liveWorld={liveWorld} locationConfirmed={selectionLocationConfirmed} contentCatalog={contentCatalog} liveLoading={liveLoading} liveMessage={liveMessage} onChange={setPrototypeContext} onEvaluateGenerator={createEvaluationMoment} onPersonalChange={setPersonalProfile} onForgetReflection={(id) => setPersonalProfile((current) => forgetReflection(current, id))} onForgetLearningEvent={(id) => setPersonalProfile((current) => forgetLearningEvent(current, id))} onResetEvidence={() => setEvidence(emptyPrototypeEvidence())} onResetLearning={() => setPersonalProfile((current) => resetLearning(current))} onRedoOnboarding={() => setPersonalProfile((current) => ({ ...current, onboardingComplete: false }))} onClearLiveCache={() => { clearLiveWorldCache().catch(() => undefined); setLiveMessage('Regionale live cache gewist'); }} onConnectCalendar={connectCalendar} onRefresh={() => refreshLiveWorld()} onUseLocation={useApproximateLocation} onClose={closeFlow} />}
        </View>
      </SafeAreaView>
    </View>
  );
}

// Living Canvas (ADR-057, Horizon B): de twee ambient-lagen ademen heel traag
// (sub-perceptueel, ≥12s per cyclus). Bij reduced-motion staan ze volledig stil;
// de loops worden opgeschoond bij unmount (centraal in useBreathing).
function AmbientBlobs({ goldOnly = false }: { goldOnly?: boolean }) {
  const goldBreath = useBreathing({ period: 13000, scaleTo: 1.06, opacityTo: 0.78 });
  const umberBreath = useBreathing({ period: 17000, scaleTo: 1.05, opacityTo: 0.82, delay: 2600 });
  return <>
    <Reanimated.View pointerEvents="none" style={[styles.ambientGold, goldBreath]} />
    {!goldOnly && <Reanimated.View pointerEvents="none" style={[styles.ambientUmber, umberBreath]} />}
  </>;
}

function IncomingInviteScreen({ invite, expired, available, onAccept, onDecline }: { invite: SharedCapsuleInvite; expired: boolean; available: boolean; onAccept: (guestName: string) => void; onDecline: () => void }) {
  const [guestName, setGuestName] = useState('');
  return <View style={styles.root}>
    <StatusBar style="light" />
    <AmbientBlobs goldOnly />
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.inviteScreen} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>UITNODIGING VAN {invite.hostName.toUpperCase()}</Text>
        <Text style={styles.inviteHeadline}>Dit moment kunnen jullie samen beleven.</Text>
        <View style={styles.invitePromiseCard}>
          <Text style={styles.expectationLabel}>GEDEELDE EXPERIENCE CAPSULE</Text>
          <Text style={styles.inviteTitle}>{invite.title}</Text>
          <Text style={styles.invitePromise}>{invite.promise}</Text>
          <View style={styles.factStrip}><MiniFact value={`${invite.duration} min`} label="totaal" /><MiniFact value={invite.company === 'family' ? 'Gezin' : 'Samen'} label="gezelschap" /><MiniFact value={invite.coordination === 'meet-there' ? 'Startpunt' : 'Samen'} label="afspraak" /></View>
        </View>
        <View style={styles.inviteTrustCard}><Text style={styles.inviteTrustTitle}>Jouw gegevens blijven van jou</Text><Text style={styles.inviteTrustBody}>Deze uitnodiging bevat alleen de ervaring en gezamenlijke afspraak. Jouw profiel, agenda, locatiegeschiedenis en voorkeuren worden niet met {invite.hostName} gedeeld.</Text></View>
        <Text style={styles.fieldLabel}>HOE MOGEN WE JE IN DEZE ERVARING NOEMEN?</Text>
        <TextInput value={guestName} onChangeText={setGuestName} placeholder="Je voornaam" placeholderTextColor={colors.placeholder} style={styles.inviteNameInput} />
        {expired ? <View style={styles.unavailableInvite}><Text style={styles.unavailableInviteTitle}>Deze uitnodiging is verlopen</Text><Text style={styles.unavailableInviteBody}>Een uitnodiging blijft 72 uur bruikbaar. Vraag {invite.hostName} om de actuele kaart opnieuw te delen.</Text></View> : available ? <PrimaryButton label="Ik ga mee" onPress={() => onAccept(guestName)} /> : <View style={styles.unavailableInvite}><Text style={styles.unavailableInviteTitle}>Deze kaart is hier nog niet beschikbaar</Text><Text style={styles.unavailableInviteBody}>Open de uitnodiging op een apparaat met dezelfde Momentum-versie. Live informatie wordt altijd opnieuw gecontroleerd.</Text></View>}
        <SecondaryButton label="Niet nu" onPress={onDecline} />
        <Text style={styles.invitePrototypeNote}>In deze prototypefase wordt deelname alleen op dit apparaat bijgehouden. Veilige synchronisatie volgt pas met een expliciet account- en privacyontwerp.</Text>
      </ScrollView>
    </SafeAreaView>
  </View>;
}

function InvalidInviteScreen({ onClose }: { onClose: () => void }) {
  return <View style={styles.root}><StatusBar style="light" /><SafeAreaView style={styles.safe}><View style={styles.invalidInviteScreen}><Text style={styles.eyebrow}>UITNODIGING</Text><Text style={styles.inviteHeadline}>Deze link kunnen we niet veilig openen.</Text><Text style={styles.screenSubtitle}>De uitnodiging is onvolledig of gemaakt met een niet-ondersteunde versie. Er wordt geen andere ervaring voor in de plaats gekozen.</Text><PrimaryButton label="Ga naar Momentum" onPress={onClose} /></View></SafeAreaView></View>;
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
          <TextInput value={draft.firstName} onChangeText={(firstName) => setDraft({ ...draft, firstName })} placeholder="Je voornaam (optioneel)" placeholderTextColor={colors.placeholder} style={styles.singleInput} />
        </>}
        {step === 1 && <>
          <Text style={styles.eyebrow}>JOUW RICHTING</Text><Text style={styles.onboardingTitle}>Waar wil je vaker ruimte voor?</Text>
          <Text style={styles.onboardingBody}>Dit zijn startvoorkeuren, geen hokjes. Kies er gerust meerdere; je kunt alles later wijzigen.</Text>
          <View style={styles.onboardingChoices}>{kinds.map((kind) => <Pressable key={kind} onPress={() => { impactLight(); setDraft({ ...draft, preferredKinds: draft.preferredKinds.includes(kind) ? draft.preferredKinds.filter((item) => item !== kind) : [...draft.preferredKinds, kind] }); }} style={[styles.onboardingChoice, draft.preferredKinds.includes(kind) && styles.onboardingChoiceSelected]}><Text style={styles.onboardingChoiceTitle}>{experienceKindLabels[kind]}</Text><Ionicons name={draft.preferredKinds.includes(kind) ? 'radio-button-on' : 'radio-button-off'} size={17} color={draft.preferredKinds.includes(kind) ? colors.accent : colors.muted} style={styles.profileChoiceMark} /></Pressable>)}</View>
          <TextInput value={draft.aspiration} onChangeText={(aspiration) => setDraft({ ...draft, aspiration })} placeholder="Bijv. vaker echt iets doen met mijn vrije tijd" placeholderTextColor={colors.placeholder} style={styles.singleInput} />
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
          <View style={styles.onboardingChoices}>{[10, 20, 35, 60].map((minutes) => <Pressable key={minutes} onPress={() => { impactLight(); setDraft({ ...draft, maxTravelMinutes: minutes }); }} style={[styles.onboardingChoice, draft.maxTravelMinutes === minutes && styles.onboardingChoiceSelected]}><Text style={styles.onboardingChoiceTitle}>Maximaal {minutes} minuten reizen</Text><Ionicons name={draft.maxTravelMinutes === minutes ? 'radio-button-on' : 'radio-button-off'} size={17} color={draft.maxTravelMinutes === minutes ? colors.accent : colors.muted} style={styles.profileChoiceMark} /></Pressable>)}</View>
        </>}
        {step === 4 && <>
          <Text style={styles.eyebrow}>INITIATIEF</Text><Text style={styles.onboardingTitle}>Wanneer mag Momentum meedenken?</Text>
          <Text style={styles.onboardingBody}>Je opent altijd zelf de deur. Proactieve meldingen worden pas later gebouwd en vragen dan afzonderlijk toestemming.</Text>
          <View style={styles.onboardingChoices}>{(Object.keys(initiativeLabels) as PersonalProfile['initiative'][]).map((initiative) => <Pressable key={initiative} onPress={() => { impactLight(); setDraft({ ...draft, initiative }); }} style={[styles.onboardingChoice, draft.initiative === initiative && styles.onboardingChoiceSelected]}><View style={styles.flex}><Text style={styles.onboardingChoiceTitle}>{initiativeLabels[initiative]}</Text>{initiative === 'proactive-later' && <Text style={styles.profileChoiceBody}>Voorkeur onthouden · nog niet actief</Text>}</View><Ionicons name={draft.initiative === initiative ? 'radio-button-on' : 'radio-button-off'} size={17} color={draft.initiative === initiative ? colors.accent : colors.muted} style={styles.profileChoiceMark} /></Pressable>)}</View>
          <View style={styles.trustCard}><Text style={styles.learningTitle}>Jouw profiel blijft van jou</Text><Text style={styles.learningBody}>Je kunt zien wat Momentum leert, signalen wissen en iedere voorkeur aanpassen. “Niet nu” wordt nooit als afwijzing van jou geïnterpreteerd.</Text></View>
        </>}
        <View style={styles.onboardingFooter}>{step > 0 && <SecondaryButton label="Terug" onPress={() => setStep((value) => value - 1)} />}<PrimaryButton label={step === 4 ? 'Toon mijn eerste moment' : 'Verder'} onPress={() => canContinue && next()} />{!canContinue && <Text style={styles.validationText}>Kies minimaal één richting om verder te gaan.</Text>}</View>
      </ScrollView>
    </View></SafeAreaView>
  </View>;
}

function ScreenHeader({ eyebrow, title, subtitle, onProfile, profileName }: { eyebrow?: string; title: string; subtitle?: string; onProfile?: () => void; profileName?: string }) {
  const profileInitial = (profileName ?? '').trim().slice(0, 1).toUpperCase() || 'M';
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.screenTitle}>{title}</Text>
        {subtitle && <Text style={styles.screenSubtitle}>{subtitle}</Text>}
      </View>
      {onProfile && <Pressable accessibilityLabel="Open profiel" onPress={onProfile} style={styles.avatar}><Text style={styles.avatarText}>{profileInitial}</Text></Pressable>}
    </View>
  );
}

function NowScreen({ firstName, suggestions, resumableExperience, context, calendar, liveWorld, liveLoading, generatorStatus, generatingMoment, momentNotice, onDismissMomentNotice, onGenerateMoment, pendingExperience, onShowPendingExperience, onResume, onDiscardSession, onOpen, onProfile, onDiscover, onRefresh, onFeedback }: { firstName: string; suggestions: Array<{ experience: Experience; decision: LocalDecision }>; resumableExperience?: Experience; context: PrototypeContext; calendar: CalendarContextSnapshot; liveWorld: LiveWorldSnapshot | null; liveLoading: boolean; generatorStatus: GeneratorRuntimeStatus; generatingMoment: boolean; momentNotice?: string; onDismissMomentNotice?: () => void; onGenerateMoment: () => void; pendingExperience?: Experience | null; onShowPendingExperience?: () => void; onResume: () => void; onDiscardSession: () => void; onOpen: (item: Experience, stage?: FlowStage) => void; onProfile: () => void; onDiscover: () => void; onRefresh: () => Promise<boolean>; onFeedback: (item: Experience, outcome: LearningOutcome) => void }) {
  const [declined, setDeclined] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  // Entree volgens ADR-057: hero-lagen verschijnen verspringend (respecteert reduced-motion).
  const heroEntrance = useStaggeredEntrance(5);
  // Living Canvas (Horizon B): sub-perceptuele Ken Burns op de hero (≤4%, ≥8s, stil bij reduced-motion).
  const kenBurns = useKenBurns();
  const currentSuggestion = suggestions[Math.min(suggestionIndex, suggestions.length - 1)] ?? suggestions[0];
  const experience = currentSuggestion.experience;
  const decision = currentSuggestion.decision;
  const grounding = evidenceSummary(experience);
  useEffect(() => { setSuggestionIndex(0); setWhyOpen(false); setDeclined(false); }, [suggestions.map((item) => item.experience.id).join('|')]);
  const showSuggestion = (index: number) => { setSuggestionIndex(index); setWhyOpen(false); setDeclined(false); };
  // suggestionIndexRef spiegelt de state zodat gebaar-callbacks nooit met een
  // verouderde closure werken.
  const suggestionIndexRef = useRef(suggestionIndex);
  useEffect(() => { suggestionIndexRef.current = suggestionIndex; }, [suggestionIndex]);
  const shiftSuggestion = (direction: number) => {
    const nextIndex = Math.max(0, Math.min(suggestions.length - 1, suggestionIndexRef.current + direction));
    if (nextIndex === suggestionIndexRef.current) return;
    impactLight();
    showSuggestion(nextIndex);
  };

  // Swipe tussen de eindige Nu-suggesties (Horizon B): horizontale pan op de
  // hero-pager; de pijltjes en dots blijven als rustige fallback (web/toegankelijkheid).
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-16, 16])
    .failOffsetY([-12, 12])
    .onEnd((event) => {
      'worklet';
      if (event.translationX < -48 || event.velocityX < -420) runOnJS(shiftSuggestion)(1);
      else if (event.translationX > 48 || event.velocityX > 420) runOnJS(shiftSuggestion)(-1);
    });

  // Pull-to-refresh (Horizon B): omlaag trekken bovenaan de scroll ververst de
  // live wereld via het bestaande refreshLiveWorld-pad, met rubber-band-demping.
  // Op web blijft de verversknop in de LiveWorldBar de expliciete fallback.
  const scrollTop = useSharedValue(0);
  const pull = useSharedValue(0);
  const runRefresh = async () => {
    setPullRefreshing(true);
    impactLight();
    try { await onRefresh(); }
    finally {
      setPullRefreshing(false);
      pull.value = withSpring(0, { damping: 22, stiffness: 200 });
    }
  };
  const pullGesture = Gesture.Pan()
    .activeOffsetY(26)
    .failOffsetX([-14, 14])
    .onUpdate((event) => {
      'worklet';
      if (scrollTop.value <= 0 && event.translationY > 0) {
        // Rubber-band: de afstand wordt logaritmisch gedempt naarmate je verder trekt.
        pull.value = Math.min(112, event.translationY * 0.42);
      }
    })
    .onEnd(() => {
      'worklet';
      if (pull.value >= 58) {
        pull.value = withSpring(46, { damping: 20, stiffness: 190 });
        runOnJS(runRefresh)();
      } else {
        pull.value = withSpring(0, { damping: 22, stiffness: 200 });
      }
    });
  const pullContentStyle = useAnimatedStyle(() => ({ transform: [{ translateY: pull.value }] }));
  const pullIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pull.value, [8, 46], [0, 1], 'clamp'),
    transform: [{ translateY: interpolate(pull.value, [0, 46], [-14, 0], 'clamp') }],
  }));

  return (
    <GestureDetector gesture={pullGesture}>
      <View style={styles.flex}>
        <Reanimated.View pointerEvents="none" style={[styles.pullIndicator, pullIndicatorStyle]}>
          <Ionicons name="arrow-down" size={13} color={colors.accent} />
          <Text style={styles.pullIndicatorText}>{pullRefreshing ? 'Live wereld wordt ververst…' : 'Loslaten om de live wereld te verversen'}</Text>
        </Reanimated.View>
        <Reanimated.View style={[styles.flex, pullContentStyle]}>
          <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false} onScroll={(event) => { scrollTop.value = event.nativeEvent.contentOffset.y; }} scrollEventThrottle={16}>
      <ScreenHeader eyebrow={`${dayPartLabels[context.dayPart].toUpperCase()}${firstName ? ` · ${firstName.toUpperCase()}` : ''}`} title="Vandaag wacht er iets moois op je." subtitle="Dit past waarschijnlijk bij je moment. Jij beslist." onProfile={onProfile} profileName={firstName} />
      <LiveWorldBar snapshot={liveWorld} loading={liveLoading} onRefresh={Platform.OS === 'web' ? onRefresh : undefined} />
      {pendingExperience ? <Pressable accessibilityRole="button" accessibilityLabel={`Toon de nieuwe blik: ${pendingExperience.title}`} onPress={onShowPendingExperience} style={styles.pendingHeroPill}><Ionicons name="sparkles" size={14} color={colors.accent} /><View style={styles.flex}><Text style={styles.pendingHeroPillText}>Nieuwe blik beschikbaar</Text><Text style={styles.pendingHeroPillBody}>{pendingExperience.title} wacht rustig tot jij wilt wisselen.</Text></View><Text style={styles.pendingHeroPillAction}>Toon</Text></Pressable> : null}
      {resumableExperience && <View style={styles.resumeCard}><Pressable accessibilityLabel={`Hervat ${resumableExperience.title}`} onPress={onResume} style={styles.resumeMain}><View style={styles.resumeMark}><Ionicons name="play" size={14} color={colors.accent} /></View><View style={styles.flex}><Text style={styles.resumeLabel}>GA VERDER</Text><Text style={styles.resumeTitle}>{resumableExperience.title}</Text></View><Ionicons name="arrow-forward" size={21} color={colors.gold} /></Pressable><Pressable accessibilityLabel="Sluit open ervaring" onPress={onDiscardSession} style={styles.resumeDiscard}><Text style={styles.resumeDiscardText}>Sluit</Text></Pressable></View>}
      {calendar.state === 'live' && calendar.currentFreeMinutes ? <View style={styles.contextNotice}><Ionicons name="time-outline" size={20} color={colors.gold} /><View style={styles.flex}><Text style={styles.contextNoticeTitle}>{calendar.currentFreeMinutes} minuten ruimte herkend</Text><Text style={styles.contextNoticeBody}>Alleen begin- en eindtijden verwerkt · afspraakinhoud genegeerd</Text></View></View> : null}
      {decision.confidence === 'low' && !declined ? <QuietCanvas eyebrow="NOG GEEN EERLIJK BESTE VOORSTEL" title="Wat zou dit moment voor jou de moeite waard maken?">
        <Text style={styles.screenSubtitle}>Momentum mist voldoende onderscheid. Geef één korte richting; je beschikbare tijd blijft behouden.</Text>
        <PrimaryButton label="Geef richting" onPress={onDiscover} /><SecondaryButton label="Laat dit moment open" onPress={() => setDeclined(true)} />
      </QuietCanvas> : !declined ? (
        <View style={styles.heroCard}>
          <GestureDetector gesture={swipeGesture}>
            <View collapsable={false}>
              <CoverImage uri={experience.image} style={styles.heroImage} imageStyle={styles.heroImageStyle} imageContainerStyle={kenBurns as StyleProp<ViewStyle>}>
            <ImageShade />
            <Animated.View style={[styles.heroTop, heroEntrance[0]]}><Pill label={`${experienceKindLabels[experience.kind].toUpperCase()} MOMENT`} accent={experience.accent} /><Text style={styles.heroTime}>{grounding.currentCount ? `LIVE VERRIJKT · ${grounding.currentCount}` : experience.generation ? 'VOOR DIT MOMENT GEMAAKT' : suggestionIndex === 0 ? 'BESTE MATCH' : 'ANDERE BLIK'}</Text></Animated.View>
            <View style={styles.heroBottom}>
              <Animated.View style={heroEntrance[1]}><Text style={styles.heroTitle}>{experience.title}</Text></Animated.View>
              <Animated.View style={heroEntrance[2]}>
                <Text style={styles.heroPromise}>{experience.promise}</Text>
                {(experience.generation || experience.liveEvidence?.length) ? <View style={styles.heroGrounding}><Ionicons name={grounding.currentCount ? 'ellipse' : 'ellipse-outline'} size={9} color={colors.onImageAccent} /><Text style={styles.heroGroundingText}>{experience.generation ? 'Nieuw samengesteld' : 'Geselecteerd'} · {grounding.label}</Text></View> : null}
              </Animated.View>
              <Animated.View style={heroEntrance[3]}>
                <View style={styles.heroFacts}>
                  <MiniFact value={`${experience.duration} min`} label={experienceFactLabels[experience.kind].duration} onImage />
                  <MiniFact value={experience.distance ?? (experience.kind === 'food' ? 'zelf kiezen' : 'dichtbij')} label={experienceFactLabels[experience.kind].distance} onImage />
                  <MiniFact value={experience.effort} label={experienceFactLabels[experience.kind].effort} onImage />
                </View>
                <Text style={styles.heroWonder}>{experience.wonder}</Text>
              </Animated.View>
              <Animated.View style={heroEntrance[4]}>
                <Pressable accessibilityRole="button" accessibilityLabel={experience.cta} onPress={() => { impactLight(); onOpen(experience); }} style={({ pressed }) => [styles.heroPrimaryAction, pressed && styles.pressed]}><Text style={styles.heroPrimaryActionText}>{experience.cta}</Text><Ionicons name="arrow-forward" size={21} color={colors.accent} /></Pressable>
              </Animated.View>
            </View>
          </CoverImage>
            </View>
          </GestureDetector>
          <View style={styles.heroActionArea}>
            {suggestions.length > 1 && <View style={styles.suggestionSwitcher}>
              <Pressable accessibilityLabel="Vorige suggestie" disabled={suggestionIndex === 0} onPress={() => { impactLight(); showSuggestion(Math.max(0, suggestionIndex - 1)); }} style={[styles.suggestionArrow, suggestionIndex === 0 && styles.suggestionArrowDisabled]}><Ionicons name="chevron-back" size={20} color={colors.bone} /></Pressable>
              <View style={styles.suggestionPosition}><View style={styles.suggestionDots}>{suggestions.map((_, index) => <View key={index} style={[styles.suggestionDot, index === suggestionIndex && styles.suggestionDotActive]} />)}</View><Text style={styles.suggestionPositionBody}>{suggestionIndex === 0 ? 'Beste match voor nu' : 'Een andere richting'}</Text></View>
              <Pressable accessibilityLabel="Volgende suggestie" disabled={suggestionIndex >= suggestions.length - 1} onPress={() => { impactLight(); showSuggestion(Math.min(suggestions.length - 1, suggestionIndex + 1)); }} style={[styles.suggestionArrow, suggestionIndex >= suggestions.length - 1 && styles.suggestionArrowDisabled]}><Ionicons name="chevron-forward" size={20} color={colors.bone} /></Pressable>
            </View>}
            <Pressable onPress={() => setWhyOpen((value) => !value)} style={styles.whyButton}>
              <Text style={styles.whyButtonText}>Waarom dit nu past</Text><Ionicons name={whyOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.gold} />
            </Pressable>
            {whyOpen && <View style={styles.whyPanel}>{decision.selected?.reasons.slice(0, 3).map((reason) => <Text key={reason.text} style={styles.whyReason}>• {reason.text}</Text>)}<Text style={styles.proofNote}>{calendar.state === 'live' ? 'Vrije tijd is lokaal meegewogen.' : 'Er is geen agenda gebruikt.'} Geen gezondheidsdata gebruikt.</Text></View>}
            <View style={styles.feedbackActions}><Pressable onPress={() => { onFeedback(experience, 'not-now'); setDeclined(true); }} style={styles.quietAction}><Text style={styles.quietActionText}>Niet nu</Text></Pressable><View style={styles.feedbackDivider} /><Pressable onPress={() => { onFeedback(experience, 'not-for-me'); setDeclined(true); }} style={styles.quietAction}><Text style={styles.quietCorrection}>Past niet bij mij</Text></Pressable></View>
          </View>
        </View>
      ) : (
        <QuietCanvas eyebrow="MOMENTUM BLIJFT STIL" title="Prima. Dit moment hoeft niets te worden.">
          <Text style={styles.screenSubtitle}>Je keuze verandert je blijvende voorkeuren niet.</Text>
          <SecondaryButton label="Toon het voorstel opnieuw" onPress={() => setDeclined(false)} />
        </QuietCanvas>
      )}
      <View style={styles.momentMakerCard}>
        <Text style={styles.momentMakerEyebrow}>NOG NIETS GERAAKT?</Text>
        <Text style={styles.momentMakerTitle}>Laat Momentum een nieuwe blik samenstellen.</Text>
        <Text style={styles.momentMakerBody}>Gebaseerd op je beschikbare tijd en praktische voorkeuren.</Text>
        <SecondaryButton label={generatingMoment ? 'Nieuwe blik wordt voorbereid…' : 'Maak een nieuwe blik'} onPress={onGenerateMoment} />
      </View>
      {momentNotice ? <Pressable accessibilityLabel="Sluit melding" onPress={onDismissMomentNotice} style={styles.contextNotice}><Ionicons name="sparkles-outline" size={20} color={colors.gold} /><View style={styles.flex}><Text style={styles.contextNoticeTitle}>Geen nieuwe blik dit keer</Text><Text style={styles.contextNoticeBody}>{momentNotice}</Text></View></Pressable> : null}
      <Pressable onPress={onDiscover} style={styles.spaceCard}>
        <View style={styles.spaceIcon}><Ionicons name="sparkles-outline" size={20} color={colors.gold} /></View>
        <View style={styles.flex}><Text style={styles.spaceTitle}>Er is ruimte ontstaan</Text><Text style={styles.spaceBody}>Vertel wat er veranderde of waar je zin in hebt</Text></View>
        <Ionicons name="arrow-forward" size={21} color={colors.gold} />
      </Pressable>
          </ScrollView>
        </Reanimated.View>
      </View>
    </GestureDetector>
  );
}

function TodayScreen({ decisions, calendar, onOpen }: { decisions: TodayDecision[]; calendar: CalendarContextSnapshot; onOpen: (item: Experience) => void }) {
  const localDate = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toLocaleUpperCase('nl-NL');
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const startMinutes = (value: string) => {
    const match = value.match(/(\d{1,2}):(\d{2})/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : Number.MAX_SAFE_INTEGER;
  };
  const foundNextIndex = decisions.findIndex((moment) => startMinutes(moment.time) >= nowMinutes - 20);
  const nextIndex = foundNextIndex < 0 ? Math.max(0, decisions.length - 1) : foundNextIndex;
  return (
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow={localDate} title="Ruimte in je dag." subtitle="Niet om alles te vullen. Alleen om kansen te zien." />
      {calendar.state === 'live' && <View style={styles.calendarWindows}><Text style={styles.liveEvidenceTitle}>VRIJE VENSTERS UIT AGENDA</Text>{calendar.freeWindows.slice(0, 3).map((window) => <View key={window.start} style={styles.calendarWindowRow}><Ionicons name="time-outline" size={13} color={colors.bone} /><Text style={styles.calendarWindowText}>{formatWindow(window)}</Text></View>)}</View>}
      <View style={styles.daySummary}><Text style={styles.daySummaryEyebrow}>{decisions.length} MOMENTEN DIE KUNNEN PASSEN</Text><Text style={styles.daySummaryBody}>Het eerstvolgende moment krijgt de meeste ruimte. Later vandaag blijft rustig op de achtergrond.</Text></View>
      <View style={styles.timeline}>
        {decisions.map((moment, index) => {
          const item = moment.result.experience;
          const directionReason = moment.result.reasons.find((reason) => reason.text.includes('richting'));
          const isLead = index === nextIndex;
          const isPast = startMinutes(moment.time) < nowMinutes - 20;
          return (
            <Pressable key={item.id} onPress={() => onOpen(item)} style={[styles.timelineRow, isPast && styles.timelineRowPast]}>
              <View style={styles.timelineContent}>
                <View style={styles.dayMomentHeader}><View style={[styles.dayMomentMark, { backgroundColor: item.accent }]} /><Text style={styles.timelineTime}>{isLead ? 'EERSTVOLGENDE · ' : ''}{moment.label} · {moment.time}</Text></View>
                <CoverImage uri={item.image} style={[styles.dayCardImage, isLead ? styles.dayCardImagePrimary : styles.dayCardImageSecondary]} imageStyle={styles.dayCardImageStyle}>
                  <ImageShade />
                  <View style={styles.dayCardCopy}>
                    <Text style={styles.dayCardTitle}>{item.title}</Text>
                    <Text style={styles.dayCardPromise}>{item.promise}</Text>
                    <View style={[styles.iconMetaRow, { marginTop: 12 }]}><Text style={styles.dayCardMeta}>{item.duration} min · {item.effort}</Text><Ionicons name="arrow-forward" size={13} color={colors.onImage} /></View>
                    {item.generation || item.liveEvidence?.length ? <Text style={[styles.directionMatch, styles.onImageAccentText]}>{item.generation ? 'Nieuw samengesteld' : 'Contextueel gekozen'} · {evidenceSummary(item).label}</Text> : directionReason && <Text style={[styles.directionMatch, styles.onImageAccentText]}>Past bij een richting die jij zelf benoemde</Text>}
                  </View>
                </CoverImage>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.quietDay}><Text style={styles.quietDayTitle}>Een volle dag is ook compleet.</Text><Text style={styles.quietDayBody}>Momentum voegt niets toe wanneer er geen echte ruimte is.</Text></View>
    </ScrollView>
  );
}

function DiscoverScreen({ context, candidatePool, learning, personal, onOpen }: { context: PrototypeContext; candidatePool: Experience[]; learning: PersonalLearningContext; personal: PersonalProfile; onOpen: (item: Experience) => void }) {
  const [minutes, setMinutes] = useState(60);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'idle' | 'clarify' | 'result'>('idle');
  const [clarificationChoice, setClarificationChoice] = useState<IntentClarificationOption | null>(null);
  const [generation, setGeneration] = useState<GenerationOutcome | null>(null);
  const [generating, setGenerating] = useState(false);
  const discoveryCanvas = candidatePool.find((item) => item.kind === 'outside') ?? candidatePool[0];
  const remoteGenerationConfigured = isRemoteGenerationConfigured();
  const intentExamples = context.company === 'family'
    ? ['Iets samen buiten', 'Een klein spel thuis', 'Samen iets maken']
    : context.dayPart === 'evening'
      ? ['Even naar buiten', 'Iets lekkers maken', 'Rust met een goed verhaal']
      : ['Buiten bewegen', 'Iets nieuws dichtbij', 'Koken met wat ik heb'];
  const understanding = useMemo(() => understandActiveIntent(input), [input]);
  const effectiveIntent = `${input} ${clarificationChoice?.terms ?? ''}`.trim();
  const explicitCompany: Company = /kind|kinderen|gezin/i.test(effectiveIntent) ? 'family' : /samen|partner|vriend/i.test(effectiveIntent) ? 'together' : context.company;
  const intentContext = useMemo(() => ({ ...context, company: explicitCompany, availableMinutes: minutes }), [context, explicitCompany, minutes]);
  const blueprintComposition = useMemo(() => composeExperienceBlueprints(input, intentContext, candidatePool, clarificationChoice?.terms), [candidatePool, clarificationChoice?.terms, input, intentContext]);
  const generatedExperiences = useMemo(() => {
    const prepared = (generation?.experiences ?? [])
      .map((experience) => composeGuideMoments(experience))
      .map((experience) => attachMeaningThread(experience, personal));
    return auditCandidatePool(prepared).accepted;
  }, [generation, personal]);
  const intentPool = useMemo(() => [...generatedExperiences, ...blueprintComposition.experiences, ...candidatePool].filter((experience, index, all) => all.findIndex((item) => item.id === experience.id) === index), [blueprintComposition.experiences, candidatePool, generatedExperiences]);
  const result = useMemo(() => rankForMoment(intentContext, effectiveIntent, [], intentPool, learning), [effectiveIntent, intentContext, intentPool, learning]);
  const primary = result.selected?.experience;
  const alternative = result.alternative?.experience;
  useEffect(() => {
    if (mode !== 'result' || (!input.trim() && !clarificationChoice)) { setGeneration(null); setGenerating(false); return; }
    let active = true;
    setGenerating(true);
    setGeneration(null);
    generateExperienceCandidates(input, clarificationChoice?.terms ?? '', intentContext, candidatePool)
      .then((outcome) => { if (active) setGeneration(outcome); })
      .finally(() => { if (active) setGenerating(false); });
    return () => { active = false; };
  }, [candidatePool, clarificationChoice, input, intentContext, mode]);
  const submitIntent = () => { setClarificationChoice(null); setGeneration(null); setMode(understanding.clarification ? 'clarify' : 'result'); };
  const chooseClarification = (option: IntentClarificationOption) => { setClarificationChoice(option); setGeneration(null); setMode('result'); };
  const surprise = () => { setInput(''); setClarificationChoice(null); setGeneration(null); setMode('result'); };
  return (
    <ScrollView contentContainerStyle={styles.screenScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow="JIJ GEEFT RICHTING" title="Waar heb je nu ruimte voor?" subtitle="Kies je tijd en vertel wat je ongeveer zoekt." />
      {mode === 'idle' ? (
        <View>
        {discoveryCanvas && <CoverImage uri={discoveryCanvas.image} style={styles.discoveryCanvas} imageStyle={styles.discoveryCanvasImage}><ImageShade /><View style={styles.discoveryCanvasCopy}><Text style={styles.discoveryCanvasLabel}>ER IS RUIMTE</Text><Text style={styles.discoveryCanvasTitle}>Geef één richting. Momentum zoekt uit wat nu echt kan.</Text><Text style={styles.discoveryCanvasBody}>Dichtbij, thuis of onderweg — jij hoeft nog niet te weten wat je precies wilt doen.</Text></View></CoverImage>}
        <View style={styles.intentPanel}>
          <Text style={styles.fieldLabel}>HOEVEEL TIJD HEB JE?</Text>
          <View style={styles.chipRow}>{timeOptions.map((option) => <ChoiceChip key={option} label={option < 60 ? `${option} min` : option === 60 ? '1 uur' : '2 uur'} selected={minutes === option} onPress={() => setMinutes(option)} />)}</View>
          <Text style={styles.fieldLabel}>WAT HEB JE IN GEDACHTEN?</Text>
          <TextInput
            accessibilityLabel="Beschrijf waar je ruimte voor hebt"
            value={input}
            onChangeText={setInput}
            placeholder="Bijv. iets met mijn kind, buiten fietsen, koken met wat ik heb…"
            placeholderTextColor={colors.placeholder}
            multiline
            style={styles.intentInput}
          />
          <View style={styles.intentExamples}>{intentExamples.map((example) => <Pressable key={example} onPress={() => setInput(example)} style={styles.intentExample}><Text style={styles.intentExampleText}>{example}</Text></Pressable>)}</View>
          <PrimaryButton label={input.trim() ? 'Vind wat hierbij past' : 'Help me kiezen'} onPress={submitIntent} />
          <View style={styles.orRow}><View style={styles.orLine} /><Text style={styles.orText}>OF</Text><View style={styles.orLine} /></View>
          <SecondaryButton label="Verras me binnen deze tijd" onPress={surprise} />
          <Text style={styles.intentPrivacy}>{remoteGenerationConfigured ? 'Alleen je vraag, beschikbare tijd en praktische keuzes worden gebruikt. Geen chatgeschiedenis of herinneringen.' : 'Je woorden worden alleen voor deze keuze gebruikt.'}</Text>
        </View>
        </View>
      ) : mode === 'clarify' && understanding.clarification ? (
        <View style={styles.clarificationPanel}>
          <Text style={styles.interpretationLabel}>ÉÉN KEUZE MAAKT HET VERSCHIL</Text>
          <Text style={styles.clarificationTitle}>{understanding.clarification.question}</Text>
          <Text style={styles.clarificationBody}>{understanding.clarification.reason}</Text>
          {input.trim() && <Text style={styles.intentQuote}>“{input.trim()}”</Text>}
          <View style={styles.clarificationOptions}>{understanding.clarification.options.map((option) => <Pressable key={option.id} onPress={() => { impactLight(); chooseClarification(option); }} style={styles.clarificationOption}><Text style={styles.clarificationOptionText}>{option.label}</Text><Ionicons name="arrow-forward" size={19} color={colors.gold} /></Pressable>)}</View>
          <SecondaryButton label="Pas mijn woorden aan" onPress={() => setMode('idle')} />
        </View>
      ) : (
        <View>
          <View style={styles.interpretation}>
            <Text style={styles.interpretationLabel}>ZO HEB IK JE MOMENT BEGREPEN</Text>
            {input.trim() && <Text style={styles.intentQuote}>“{input.trim()}”</Text>}
            <Text style={styles.interpretationText}>{blueprintComposition.interpretation} · {minutes} minuten · {explicitCompany === 'solo' ? 'alleen' : explicitCompany === 'family' ? 'met gezin' : 'samen'}{clarificationChoice ? ` · ${clarificationChoice.label.toLowerCase()}` : ''}</Text>
            {!generating && primary?.blueprint && <Text style={styles.blueprintTrust}>Samengesteld met {primary.blueprint.validationLabel.toLowerCase()}.</Text>}
          </View>
          {generating ? <View style={styles.generationCard}><Ionicons name="sparkles" size={18} color={colors.accent} style={styles.generationMarkIcon} /><View style={styles.flex}><Text style={styles.generationTitle}>Momentum maakt een nieuwe combinatie</Text><Text style={styles.generationBody}>Je huidige vraag wordt vertaald naar een complete capsule en daarna gecontroleerd.</Text></View></View> : generation ? <View style={styles.generationCard}>{generation.mode === 'remote' ? <Text style={styles.generationMark}>AI</Text> : <Ionicons name="construct-outline" size={17} color={colors.accent} style={styles.generationMarkIcon} />}<View style={styles.flex}><Text style={styles.generationTitle}>{generation.mode === 'remote' ? 'Nieuw voor dit moment gemaakt' : 'Lokaal nieuw gecombineerd'}</Text><Text style={styles.generationBody}>{generation.message} Alleen complete kandidaten gaan door.</Text></View></View> : null}
          {!generating && (primary ? <>
            <Text style={styles.sectionLabel}>MIJN BESTE VOORSTEL · VERTROUWEN {result.confidence.toUpperCase()}</Text>
            <ExperienceTile experience={primary} large onPress={() => onOpen(primary)} />
            {primary.generation && <GeneratedCapsulePreview experience={primary} />}
            <View style={styles.selectionReasons}>{result.selected?.reasons.map((reason) => <Text key={reason.text} style={styles.selectionReason}>• {reason.text}</Text>)}</View>
            {alternative && <><Text style={styles.sectionLabel}>EEN ECHT ANDERE RICHTING</Text><ExperienceTile experience={alternative} onPress={() => onOpen(alternative)} /></>}
          </> : <QuietCanvas eyebrow="GEEN EERLIJK VOORSTEL" title="Binnen deze ruimte past nu niets compleet."><Text style={styles.screenSubtitle}>Vergroot de beschikbare tijd of pas één praktische beperking aan.</Text></QuietCanvas>)}
          <SecondaryButton label="Pas mijn woorden aan" onPress={() => { setClarificationChoice(null); setGeneration(null); setMode('idle'); }} />
          <Text style={styles.finiteNote}>Momentum toont bewust geen eindeloze lijst.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function LifeBookScreen({ memories, personal, onOpen, onProfile }: { memories: Memory[]; personal: PersonalProfile; onOpen: (item: Experience) => void; onProfile: () => void }) {
  const themes = Array.from(new Set(memories.flatMap((memory) => memory.meaning ? [memory.meaning] : []).filter(Boolean))).slice(0, 3);
  const memoryMonths = Array.from(new Set(memories.map((memory) => dutchMonthNames.find((month) => memory.date.toLowerCase().includes(month))).filter((month): month is string => Boolean(month))));
  const periodLabel = memoryMonths.length === 1 ? memoryMonths[0].toUpperCase() : 'BEWAARDE MOMENTEN';
  const learningSignal = personal.reflectionMemories[0]?.explanation ?? personal.learningEvents[0]?.explanation;
  return (
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow="JOUW ERVARINGEN" title="Leefboek" subtitle="Niet wat je volhield, maar wat de moeite waard was." />
      <View style={styles.lifeLandscape}><View><Text style={styles.lifeSummaryEyebrow}>JOUW LANDSCHAP</Text><Text style={styles.lifeSummaryHeadline}>{memories.length ? 'Hier krijgt je leven langzaam vorm.' : 'Hier komen je beleefde momenten samen.'}</Text></View><Text style={styles.lifeSummaryTitle}>{memories.length} bewaarde momenten · alleen op dit apparaat</Text>{themes.length > 0 && <View style={styles.lifeThemeRow}>{themes.map((theme) => <View key={theme} style={styles.lifeTheme}><Text style={styles.lifeThemeText}>{theme}</Text></View>)}</View>}</View>
      {memories.length > 0 && <Text style={styles.sectionLabel}>{periodLabel}</Text>}
      {memories.length === 0 && <QuietCanvas eyebrow="NOG GEEN BEWAARDE MOMENTEN" title="Hier komen je beleefde momenten samen.">
        <Text style={styles.screenSubtitle}>Bewaar straks wat de moeite waard was. Je herinneringen blijven alleen op dit apparaat.</Text>
      </QuietCanvas>}
      <View style={styles.memoryGrid}>
        {memories.map((memory, index) => {
          const experience = memory.experienceSnapshot ?? experiences.find((item) => item.title === memory.title) ?? byId('wadden-light');
          return <Pressable key={memory.id} onPress={() => onOpen(experience)} style={[styles.memoryCard, index > 0 && styles.memoryCardCompact]}><CoverImage uri={memory.image} style={[styles.memoryImage, index > 0 && styles.memoryImageCompact]} imageStyle={styles.memoryImageStyle}><ImageShade /><View style={styles.memoryCopy}><Text style={[styles.memoryDate, styles.onImageAccentText]}>{memory.date}</Text><Text style={[styles.memoryTitle, index > 0 && styles.memoryTitleCompact, styles.onImageText]}>{memory.title}</Text><Text style={[styles.memoryNote, styles.onImageMutedText]}>{memory.note}</Text>{memory.meaning ? <Text style={[styles.memoryMeaning, styles.onImageAccentText]}>Raakte aan: {memory.meaning}</Text> : null}{memory.sharedWith?.length ? <Text style={[styles.memoryShared, styles.onImageAccentText]}>Samen met {memory.sharedWith.join(', ')}</Text> : null}</View></CoverImage></Pressable>;
        })}
      </View>
      {learningSignal ? <View style={styles.learningCard}><Text style={styles.learningTitle}>Een voorzichtig patroon</Text><Text style={styles.learningBody}>{learningSignal} Jij houdt de regie over wat Momentum hiervan onthoudt.</Text><Pressable onPress={onProfile} style={styles.learningAction}><View style={styles.iconMetaRow}><Text style={styles.learningActionText}>Bekijk of corrigeer dit</Text><Ionicons name="arrow-forward" size={13} color={colors.accent} /></View></Pressable></View> : null}
    </ScrollView>
  );
}

function PrepareScreen({ experience, personal, hostName, initialCompany, initialGuideDepth, initialShared, onBack, onDraftChange, onStart }: { experience: Experience; personal: PersonalProfile; hostName: string; initialCompany: Company; initialGuideDepth?: GuideDepth; initialShared?: SharedCapsuleState; onBack: () => void; onDraftChange: (company: Company, guideDepth: GuideDepth, shared?: SharedCapsuleState) => void; onStart: (company: Company, guideDepth: GuideDepth, shared?: SharedCapsuleState) => void }) {
  const supportedCompanies = experience.company;
  const [company, setCompany] = useState<Company>(supportedCompanies.includes(initialCompany) ? initialCompany : supportedCompanies[0]);
  const guidanceMuted = personal.mutedInsightExperienceIds.includes(experience.id);
  const preferredGuideDepth: GuideDepth = guidanceMuted || personal.guidanceBalance <= -0.2 ? 'quiet' : personal.guidanceBalance >= 0.45 ? 'deep' : experience.presenceMode === 'quiet' ? 'quiet' : 'guide';
  const [guideDepth, setGuideDepth] = useState<GuideDepth>(initialGuideDepth ?? preferredGuideDepth);
  const [coordination, setCoordination] = useState<SharedCoordination>(initialShared?.coordination ?? 'leave-together');
  const [shared, setShared] = useState<SharedCapsuleState | undefined>(initialShared);
  const [shareStatus, setShareStatus] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const guide = buildExperienceGuide(experience, 0);
  const freshEvidence = guide.evidence.filter((item) => item.freshness === 'current');
  const guideInsights = ([guide.currentInsight, ...guide.furtherInsights].filter(Boolean) as NonNullable<typeof guide.currentInsight>[]).filter((insight) => !guidanceMuted && !personal.mutedInsightTopics.includes(insight.topic));
  const companyChoices: Array<{ id: Company; label: string }> = [{ id: 'solo', label: 'Alleen' }, { id: 'together', label: 'Samen' }, { id: 'family', label: 'Met gezin' }];
  useEffect(() => {
    onDraftChange(company, guideDepth, shared ? { ...shared, coordination } : undefined);
  }, [company, coordination, guideDepth, shared]);
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
  const toggleReadiness = (key: keyof NonNullable<SharedCapsuleState['readiness']>) => {
    impactLight();
    setShared((current) => current ? {
      ...current,
      readiness: { ...(current.readiness ?? { timing: false, pace: false, practical: false }), [key]: !(current.readiness?.[key] ?? false) },
    } : current);
  };
  // Beeldcontinuïteit (Horizon B, punt 6): dezelfde beeld-uri als op Nu reist mee;
  // de container legt het beeld met één rustige scale/fade neer (zie motion.ts).
  const imageContinuity = useImageContinuity();
  // North Star Frame 5: de voorbereiding toont in eerste zicht alleen het noodzakelijke —
  // fotokaart/belofte → capsule-essentie (tijd, wat je nodig hebt, gezelschap) → primaire actie.
  // Verdieping (live-aanwijzingen, route, verhaal van de plek) blijft ongewijzigd beschikbaar
  // achter een rustige disclosure; de primaire actie blijft via een sticky voettekst altijd
  // zichtbaar, zonder content te overlappen (extra padding onderaan de scroll).
  return (
    <View style={styles.flowScreen}>
    <ScrollView contentContainerStyle={[styles.flowScroll, styles.flowScrollStickyAction]} showsVerticalScrollIndicator={false}>
      <BackButton label="Terug" onPress={onBack} />
      <Text style={styles.eyebrow}>{experienceKindLabels[experience.kind].toUpperCase()} · UITNODIGING</Text><Text style={styles.flowTitle}>{experience.title}</Text><Text style={styles.screenSubtitle}>{experience.promise}</Text>
      <CoverImage uri={experience.image} style={styles.prepareExpectationCard} imageStyle={styles.prepareExpectationImage} imageContainerStyle={imageContinuity as StyleProp<ViewStyle>}>
        <ImageShade />
        <View style={styles.prepareExpectationCopy}>
          <Text style={styles.prepareExpectationLabel}>WAT JE KUNT VERWACHTEN</Text>
          <Text style={styles.prepareExpectationTitle}>{experience.wonder}</Text>
          <Text style={styles.prepareExpectationBody}>{experience.prepareTitle}</Text>
        </View>
      </CoverImage>
      <CapsuleShapePreview experience={experience} />
      {experience.meaningThread && <MeaningThreadCard experience={experience} compact />}
      <View style={styles.commitmentCard}><Text style={styles.commitmentLabel}>TIJD EN INSPANNING</Text><Text style={styles.commitmentValue}>{experience.duration} minuten · {experience.effort.toLowerCase()}</Text>{experience.distance && <Text style={styles.commitmentBody}>{experience.distance} is meegenomen voordat je begint.</Text>}</View>
      <Text style={styles.fieldLabel}>{experience.kind === 'food' ? 'INGREDIËNTEN EN KEUKEN' : experience.kind === 'movement' ? 'MATERIAAL EN OPBOUW' : experience.kind === 'restore' ? 'MAAK RUIMTE VOOR RUST' : experience.kind === 'outside' ? 'VOOR ROUTE EN OMSTANDIGHEDEN' : 'ALLEEN WAT JE NODIG HEBT'}</Text><View style={styles.prepareCard}>{experience.prepare.map((item) => <View key={item} style={styles.prepareRow}><View style={[styles.prepareBullet, { backgroundColor: experience.accent }]} /><Text style={styles.prepareText}>{item}</Text></View>)}</View>
      <View style={styles.readySummary}>
        <View style={styles.flex}><Text style={styles.readySummaryLabel}>ZO GA JE</Text><Text style={styles.readySummaryTitle}>{company === 'solo' ? 'Alleen' : company === 'family' ? 'Met gezin' : 'Samen'} · {guideDepth === 'quiet' ? 'rustige begeleiding' : guideDepth === 'deep' ? 'verdiepende gids' : 'gids op het juiste moment'}</Text></View>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: detailsOpen }} onPress={() => setDetailsOpen((value) => !value)} style={styles.adjustButton}><Text style={styles.adjustButtonText}>{detailsOpen ? 'Sluit keuzes' : 'Gezelschap & gids'}</Text></Pressable>
      </View>
      {detailsOpen && <>
      <Text style={styles.fieldLabel}>MET WIE BELEEF JE DIT?</Text><View style={styles.chipRow}>{companyChoices.filter((item) => supportedCompanies.includes(item.id)).map((item) => <ChoiceChip key={item.id} label={item.label} selected={company === item.id} onPress={() => chooseCompany(item.id)} />)}</View>
      {company !== 'solo' && <View style={styles.sharedPlanCard}>
        <Text style={styles.expectationLabel}>SAMEN AFSTEMMEN</Text>
        <Text style={styles.sharedPlanTitle}>Hoe komen jullie samen bij het begin?</Text>
        <View style={styles.guideDepthList}>
          <Pressable onPress={() => { impactLight(); setCoordination('leave-together'); }} style={[styles.guideDepthChoice, coordination === 'leave-together' && styles.guideDepthChoiceSelected]}><View style={styles.flex}><Text style={styles.guideDepthTitle}>Samen vertrekken</Text><Text style={styles.guideDepthBody}>Eén toestel kan de voorbereiding en gids dragen.</Text></View><Ionicons name={coordination === 'leave-together' ? 'radio-button-on' : 'radio-button-off'} size={17} color={coordination === 'leave-together' ? colors.accent : colors.muted} /></Pressable>
          <Pressable onPress={() => { impactLight(); setCoordination('meet-there'); }} style={[styles.guideDepthChoice, coordination === 'meet-there' && styles.guideDepthChoiceSelected]}><View style={styles.flex}><Text style={styles.guideDepthTitle}>Ontmoet bij het startpunt</Text><Text style={styles.guideDepthBody}>Iedereen regelt de eigen reis; de ervaring begint samen.</Text></View><Ionicons name={coordination === 'meet-there' ? 'radio-button-on' : 'radio-button-off'} size={17} color={coordination === 'meet-there' ? colors.accent : colors.muted} /></Pressable>
        </View>
        {shared ? <View style={styles.participantList}>
          {shared.participants.map((participant) => <View key={participant.id} style={styles.participantRow}><View style={[styles.participantAvatar, participant.status === 'ready' && styles.participantAvatarReady]}><Text style={styles.participantAvatarText}>{participant.name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.flex}><Text style={styles.participantName}>{participant.name}</Text><Text style={styles.participantStatus}>{participant.role === 'host' ? 'Organiseert' : participant.status === 'ready' ? 'Doet mee op dit toestel' : 'Uitnodiging gedeeld · reactie nog niet gesynchroniseerd'}</Text></View></View>)}
          <Text style={styles.localSharedNote}>Alleen deze ervaring wordt gedeeld. Profiel, agenda, locatiegeschiedenis en redenen achter de aanbeveling blijven privé.</Text>
          <Text style={styles.sharedReadinessTitle}>LOKAAL SAMEN CONTROLEREN</Text>
          {([{ key: 'timing', label: 'De tijd klopt voor ons' }, { key: 'pace', label: 'Tempo en uitdaging passen' }, { key: 'practical', label: 'Startpunt en praktisch zijn duidelijk' }] as const).map((item) => <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: shared.readiness?.[item.key] ?? false }} key={item.key} onPress={() => toggleReadiness(item.key)} style={styles.sharedReadinessRow}><Ionicons name={(shared.readiness?.[item.key] ?? false) ? 'checkmark-circle' : 'ellipse-outline'} size={19} color={(shared.readiness?.[item.key] ?? false) ? experience.accent : colors.muted} style={styles.sharedReadinessMark} /><Text style={styles.sharedReadinessLabel}>{item.label}</Text></Pressable>)}
          <Text style={styles.localSharedNote}>{Object.values(shared.readiness ?? {}).filter(Boolean).length === 3 ? 'Op dit toestel is alles samen gecontroleerd.' : 'Deze controle is alleen lokaal en blokkeert het starten niet.'}</Text>
        </View> : null}
        {shared?.role !== 'guest' && <Pressable onPress={shareExperience} style={styles.shareCard}><View style={styles.shareMark}><Ionicons name="share-social-outline" size={18} color={colors.accent} /></View><View style={styles.flex}><Text style={styles.shareTitle}>{shared ? 'Deel uitnodiging opnieuw' : 'Nodig iemand uit'}</Text><Text style={styles.shareBody}>De ontvanger kan de kaart openen, bekijken en lokaal deelnemen.</Text></View><Ionicons name="arrow-forward" size={21} color={colors.gold} /></Pressable>}
        {shareStatus ? <Text style={styles.shareStatus}>{shareStatus}</Text> : null}
        {shared && <Pressable onPress={() => { setShared(undefined); setShareStatus('Gedeelde voorbereiding is op dit toestel gestopt.'); }} style={styles.stopSharingButton}><Text style={styles.stopSharingText}>{shared.role === 'guest' ? 'Verlaat gedeelde voorbereiding' : 'Trek deze lokale uitnodiging in'}</Text></Pressable>}
      </View>}
      <Text style={styles.fieldLabel}>HOEVEEL BEGELEIDING WIL JE?</Text><View style={styles.guideDepthList}>
        {([{ id: 'quiet', title: 'Rustig', body: 'Alleen de huidige aanwijzing; de gids blijft op afroep beschikbaar.' }, { id: 'guide', title: 'Gids', body: 'Huidige uitleg en actuele bronnen precies wanneer ze helpen.' }, { id: 'deep', title: 'Verdieping', body: 'Ook extra verhalen, alle inzichten en praktische achtergrond.' }] as Array<{ id: GuideDepth; title: string; body: string }>).map((item) => <Pressable accessibilityRole="radio" accessibilityState={{ selected: guideDepth === item.id }} key={item.id} onPress={() => { impactLight(); setGuideDepth(item.id); }} style={[styles.guideDepthChoice, guideDepth === item.id && styles.guideDepthChoiceSelected]}><View style={styles.flex}><Text style={styles.guideDepthTitle}>{item.title}</Text><Text style={styles.guideDepthBody}>{item.body}</Text></View><Ionicons name={guideDepth === item.id ? 'radio-button-on' : 'radio-button-off'} size={17} color={guideDepth === item.id ? colors.accent : colors.muted} /></Pressable>)}
      </View>
      <View style={styles.guidePreviewCard}>
        <Text style={styles.expectationLabel}>ZO BLIJFT DE GIDS BESCHIKBAAR</Text>
        <Text style={styles.guidePreviewTitle}>{guideDepth === 'quiet' ? 'Alleen wanneer jij hem opent' : guideDepth === 'guide' ? 'Eén inzicht op het juiste moment' : `${guideInsights.length} gidsmomenten om verder te kijken`}</Text>
        <Text style={styles.guidePreviewBody}>{guideDepth === 'quiet' ? 'Je ziet de huidige stap. Uitleg en bronnen blijven op de achtergrond.' : guideDepth === 'guide' ? (guideInsights[0]?.title ?? 'De huidige aanwijzing blijft leidend.') : guideInsights.slice(0, 3).map((item) => item.title).join(' · ')}</Text>
        <Text style={styles.guidePreviewSource}>{guide.coverageLabel}{guide.compositionLabel ? ` · ${guide.compositionLabel}` : ''}. Je kunt tijdens de ervaring altijd terugschakelen naar je omgeving.</Text>
      </View>
      </>}
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: moreOpen }} onPress={() => setMoreOpen((value) => !value)} style={styles.learningDisclosure}><View style={styles.flex}><Text style={styles.learningDisclosureTitle}>Meer over deze ervaring</Text><Text style={styles.learningDisclosureBody}>{moreOpen ? 'Sluit de verdieping' : 'Actuele aanwijzingen, route en verhaal van de plek'}</Text></View><Ionicons name={moreOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.gold} /></Pressable>
      {moreOpen && <>
      {freshEvidence.length ? <View style={styles.prepareLiveCard}><Text style={styles.liveEvidenceTitle}>WAT DE WERELD NU LAAT ZIEN</Text>{freshEvidence.slice(0, 3).map((evidence) => <View key={`${evidence.sourceName}-${evidence.label}`} style={styles.prepareLiveRow}><View style={styles.liveEvidenceDot} /><View style={styles.flex}><Text style={styles.liveEvidenceLabel}>{evidence.label}</Text><Text style={styles.liveEvidenceMeta}>{evidence.sourceName} · {evidence.certainty === 'observation' ? 'recente waarneming' : 'actuele verwachting'} · {evidence.freshnessLabel.toLowerCase()}</Text></View></View>)}</View> : <View style={styles.editorialDepthCard}><Text style={styles.expectationLabel}>TIJDENS JE ERVARING</Text><Text style={styles.editorialDepthText}>{experience.steps.find((step) => step.insight)?.insight?.title ?? experience.wonder}</Text><Text style={styles.editorialDepthSource}>Een verdiepend gidsmoment is beschikbaar wanneer het helpt.</Text>{guide.evidence.some((item) => item.freshness === 'expired') ? <Text style={styles.expiredEvidenceText}>Eerdere broncontext is verlopen en wordt niet meer als actuele aanwijzing gebruikt.</Text> : null}</View>}
      {experience.routePlan && <View style={styles.routePlanCard}>
        <Text style={styles.liveEvidenceTitle}>ROUTE NAAR HET BEGIN</Text><Text style={styles.routePlanTitle}>{experience.routePlan.destinationName}</Text>
        <View style={styles.routeBudget}><MiniFact value={`${experience.routePlan.outboundMinutes} min`} label="heen" /><MiniFact value={`${experience.routePlan.experienceMinutes} min`} label="beleven" /><MiniFact value={`${experience.routePlan.returnMinutes} min`} label="terug" /><MiniFact value={`${experience.routePlan.bufferMinutes} min`} label="buffer" /></View>
        <Text style={styles.routeEstimate}>{experience.routePlan.mode === 'cycling' ? 'Fiets' : 'Te voet'} · conservatieve voorinschatting{experience.routePlan.sourceLabel ? ` · ${experience.routePlan.sourceLabel}` : ''}</Text>
        <Text style={styles.routeWindow}>{experience.routePlan.routeCapability?.detail ?? routingCapability().detail}</Text>
        {experience.routePlan.expiresAt && <Text style={styles.routeWindow}>Bronvenster geldig tot {new Date(experience.routePlan.expiresAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}. Vlak voor vertrek volgt een nieuwe geldigheidscontrole.</Text>}
        <Text style={styles.routeGuard}>{experience.routePlan.natureGuard}</Text>
        {experience.routePlan.arrivalPlan && <View style={styles.arrivalPlanCard}><Text style={styles.arrivalPlanLabel}>TER PLAATSE</Text><Text style={styles.arrivalPlanTitle}>{experience.routePlan.arrivalPlan.label}</Text><Text style={styles.arrivalPlanBody}>{experience.routePlan.arrivalPlan.instruction}</Text><Text style={styles.arrivalPlanMeta}>{experience.routePlan.arrivalPlan.durationMinutes} min{experience.routePlan.arrivalPlan.radiusMeters ? ` · tot circa ${experience.routePlan.arrivalPlan.radiusMeters} m rond het anker` : ''}</Text><Text style={styles.arrivalPlanReturn}>{experience.routePlan.arrivalPlan.returnTrigger}</Text></View>}
        {experience.routePlan.recheckLabel && <Text style={styles.routeRecheck}>{experience.routePlan.recheckLabel}</Text>}
      </View>}
      {experience.placeKnowledge && <View style={styles.placeKnowledgeCard}>
        <Text style={styles.placeKnowledgeLabel}>VERHAAL VAN DE PLEK</Text>
        <Text style={styles.placeKnowledgeTitle}>{experience.placeKnowledge.title}</Text>
        <Text style={styles.placeKnowledgeBody}>{experience.placeKnowledge.summary}</Text>
        <Pressable accessibilityRole="link" accessibilityLabel={`Open bron over ${experience.placeKnowledge.title}`} onPress={() => Linking.openURL(experience.placeKnowledge!.sourceUrl).catch(() => undefined)}><Text style={[styles.placeKnowledgeSource, { color: experience.accent }]}>{experience.placeKnowledge.sourceLabel} · Bekijk bron <Ionicons name="open-outline" size={11} color={experience.accent} /></Text></Pressable>
      </View>}
      </>}
    </ScrollView>
    <View style={styles.stickyActionBar}>
      <PrimaryButton label={company === 'solo' ? 'Ik ga nu' : 'Wij gaan beginnen'} onPress={() => onStart(company, guideDepth, shared ? { ...shared, coordination } : undefined)} />
    </View>
    </View>
  );
}

function PresenceScreen({ experience, personal, company, guideDepth, shared, initialStep, onStepChange, onBack, onFinish, backHandlerRef }: { experience: Experience; personal: PersonalProfile; company: Company; guideDepth: GuideDepth; shared?: SharedCapsuleState; initialStep: number; onStepChange: (stepIndex: number) => void; onBack: () => void; onFinish: () => void; backHandlerRef?: React.MutableRefObject<() => boolean> }) {
  const [stepIndex, setStepIndex] = useState(Math.min(initialStep, Math.max(0, experience.steps.length - 1)));
  const [remaining, setRemaining] = useState(experience.steps[Math.min(initialStep, Math.max(0, experience.steps.length - 1))]?.seconds ?? 0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [phoneAway, setPhoneAway] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [handoffStatus, setHandoffStatus] = useState('');
  // Beeldcontinuïteit (Horizon B, punt 6): dezelfde beeld-uri als Nu en Prepare;
  // de backdrop legt het beeld met dezelfde rustige neerleg-beweging neer.
  const imageContinuity = useImageContinuity();
  const current = experience.steps[stepIndex] ?? { title: experience.presenceTitle, instruction: experience.presenceCue };
  const insightVisible = guideDepth !== 'quiet' && current.insight && (guideDepth === 'deep' || personal.guidanceBalance > -0.2) && !personal.mutedInsightTopics.includes(current.insight.topic) && !personal.mutedInsightExperienceIds.includes(experience.id);
  const isLast = stepIndex >= experience.steps.length - 1;
  const timedStepInProgress = Boolean(current.seconds && remaining > 0);
  const unfilteredGuide = buildExperienceGuide(experience, stepIndex);
  const insightAllowed = (insight: NonNullable<typeof current.insight>) => !personal.mutedInsightTopics.includes(insight.topic) && !personal.mutedInsightExperienceIds.includes(experience.id);
  const guide = { ...unfilteredGuide, currentInsight: unfilteredGuide.currentInsight && insightAllowed(unfilteredGuide.currentInsight) ? unfilteredGuide.currentInsight : undefined, furtherInsights: unfilteredGuide.furtherInsights.filter(insightAllowed) };

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

  useEffect(() => {
    if (!backHandlerRef) return;
    backHandlerRef.current = () => {
      if (guideOpen) { setGuideOpen(false); return true; }
      if (phoneAway) { setPhoneAway(false); return true; }
      return false;
    };
  }, [backHandlerRef, guideOpen, phoneAway]);

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
  if (phoneAway) return <PhoneAwayView experience={experience} cue={current.title} seconds={current.seconds} remaining={remaining} formatTime={formatTime} shared={shared} onReopen={() => { setPhoneAway(false); setGuideOpen(true); }} />;
  return (
    <CoverImage uri={experience.image} style={styles.presenceScreen} imageStyle={styles.presenceBackdrop} imageContainerStyle={imageContinuity as StyleProp<ViewStyle>}>
      <DimShade opacity={0.74} />
      <View style={styles.presenceTopRow}><BackButton label="Voorbereiding" onPress={onBack} /><View style={styles.presenceActions}><Pressable accessibilityRole="button" accessibilityLabel="Open de ervaringsgids" onPress={() => setGuideOpen(true)} style={styles.guideButton}><Text style={styles.guideButtonText}>Gids</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Leg de telefoon weg" onPress={() => setPhoneAway(true)} style={styles.phoneAwayButton}><Text style={styles.phoneAwayButtonText}>Telefoon weg</Text></Pressable></View></View>
      <View style={styles.capsuleProgress}>
        {experience.steps.map((_, index) => <View key={index} style={[styles.capsuleProgressPart, index <= stepIndex && { backgroundColor: experience.accent }]} />)}
      </View>
      <ScrollView contentContainerStyle={styles.capsuleStep} showsVerticalScrollIndicator={false}>
        <View style={styles.presenceStage}>
        <Text style={styles.eyebrow}>{experience.presenceMode === 'handoff' ? 'ONDERWEG' : experience.presenceMode === 'quiet' ? 'RUSTIGE BEGELEIDING' : 'HUIDIGE STAP'}</Text>
        <Text style={styles.capsuleStepCount}>{stepIndex + 1} van {experience.steps.length} · {company === 'solo' ? 'alleen' : company === 'family' ? 'met gezin' : 'samen'}</Text>
        {shared && <View style={styles.presenceTogetherCard}><View style={styles.presenceTogetherAvatars}>{shared.participants.filter((participant) => participant.status === 'ready').map((participant) => <View key={participant.id} style={styles.presenceTogetherAvatar}><Text style={styles.participantAvatarText}>{participant.name.slice(0, 1).toUpperCase()}</Text></View>)}</View><View style={styles.flex}><Text style={styles.presenceTogetherTitle}>Eén gedeelde ervaring</Text><Text style={styles.presenceTogetherBody}>{shared.coordination === 'meet-there' ? 'Jullie ontmoetten elkaar bij het begin.' : 'Jullie begonnen samen.'} Deze gids loopt alleen op dit toestel.</Text></View></View>}
        <Text style={styles.presenceTitle}>{current.title}</Text>
        {current.meta && <View style={[styles.stepMetaPill, { borderColor: experience.accent }]}><Text style={styles.stepMetaText}>{current.meta}</Text></View>}
        <Text style={styles.presenceCue}>{current.instruction}</Text>
        {insightVisible && <View style={styles.insightCard}>
          <Text style={styles.insightEyebrow}>KLEIN INZICHT · ALLEEN ALS HET HELPT</Text>
          <Text style={styles.insightTitle}>{current.insight?.title}</Text>
          <Text style={styles.insightBody}>{current.insight?.body}</Text>
          {current.insight?.sourceUrl ? <Pressable accessibilityRole="link" onPress={() => Linking.openURL(current.insight!.sourceUrl!).catch(() => undefined)}><Text style={[styles.insightSource, { color: experience.accent }]}>{current.insight.sourceLabel} · Bekijk bron <Ionicons name="open-outline" size={11} color={experience.accent} /></Text></Pressable> : <Text style={styles.insightSource}>{current.insight?.sourceKind === 'live' ? 'Actuele bron' : current.insight?.sourceKind === 'curator' ? 'Plaatskennis' : 'Redactioneel'} · {current.insight?.sourceLabel}</Text>}
        </View>}
        {current.seconds ? (
          <View style={[styles.stepTimer, { borderColor: experience.accent }]}>
            <Text style={styles.stepTimerValue}>{formatTime(remaining)}</Text>
            <Text style={styles.presenceUnit}>{remaining === 0 ? 'KLAAR' : timerRunning ? 'LOOPT' : 'KLAAR OM TE STARTEN'}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={remaining === 0 ? 'Timer afgerond' : timerRunning ? 'Pauzeer timer' : 'Start timer'} accessibilityState={{ disabled: remaining === 0 }} onPress={() => remaining > 0 && setTimerRunning((value) => !value)} style={styles.timerControl}>
              {remaining === 0 ? <Ionicons name="checkmark" size={14} color={colors.bone} /> : <Text style={styles.timerControlText}>{timerRunning ? 'Pauze' : 'Start timer'}</Text>}
            </Pressable>
          </View>
        ) : (
          <View style={[styles.quietStepOrb, { borderColor: experience.accent }]}><Ionicons name={experience.presenceMode === 'quiet' ? 'leaf-outline' : experience.presenceMode === 'handoff' ? 'navigate-outline' : 'ellipse-outline'} size={38} color={experience.accent} /></View>
        )}
        {experience.presenceMode === 'handoff' && stepIndex === 0 && <SecondaryButton label="Open route in Kaarten" onPress={openHandoff} />}
        {handoffStatus ? <Text style={styles.handoffStatus}>{handoffStatus}</Text> : null}
        </View>
      </ScrollView>
      <View style={styles.presenceFooterPanel}>
        <PrimaryButton disabled={timedStepInProgress} label={isLast ? 'Ervaring afronden' : timedStepInProgress ? 'Rond eerst deze timer af' : 'Volgende stap'} onPress={next} />
        {timedStepInProgress && <SecondaryButton label="Sla deze timer over" onPress={next} />}
        {stepIndex > 0 && <SecondaryButton label="Vorige stap" onPress={() => setStepIndex((value) => Math.max(0, value - 1))} />}
        <Text style={styles.presenceFooter}>{experience.presenceMode === 'quiet' ? 'Gebruik alleen de aanwijzing die helpt. Leg daarna je telefoon weg.' : 'Alleen de huidige stap vraagt aandacht.'}</Text>
      </View>
      {guideOpen && <ExperienceGuidePanel guide={guide} depth={guideDepth} accent={experience.accent} onClose={() => setGuideOpen(false)} />}
    </CoverImage>
  );
}

// Phone Away (Horizon B): echt OLED-zwart met één zacht gloeiend, ademend
// element (Reanimated; geen Skia). Bij reduced-motion staat de gloed stil.
function PhoneAwayView({ experience, cue, seconds, remaining, formatTime, shared, onReopen }: { experience: Experience; cue: string; seconds?: number; remaining: number; formatTime: (seconds: number) => string; shared?: SharedCapsuleState; onReopen: () => void }) {
  const breath = useBreathing({ period: 6400, scaleTo: 1.055, opacityTo: 0.72 });
  return <View style={styles.phoneAwayScreen}>
    <Text style={styles.phoneAwayEyebrow}>PRESENCE</Text><Text style={styles.phoneAwayTitle}>{experience.title}</Text><Text style={styles.phoneAwayCue}>{cue}</Text>
    <Reanimated.View style={[styles.phoneAwayGlow, { borderColor: experience.accent, shadowColor: experience.accent }, breath]}>
      {seconds ? <Text style={styles.phoneAwayTimer}>{formatTime(remaining)}</Text> : <Ionicons name="ellipse" size={10} color={experience.accent} />}
    </Reanimated.View>
    {shared && <Text style={styles.phoneAwayTogether}>{shared.participants.filter((participant) => participant.status === 'ready').map((participant) => participant.name).join(' + ')} · samen aanwezig</Text>}
    <Text style={styles.phoneAwayBody}>Je hoeft nu niets te bedienen. De gids blijft met één tik beschikbaar.</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Raadpleeg de gids" onPress={onReopen} style={styles.reopenGuide}><Text style={styles.reopenGuideText}>Raadpleeg de gids</Text></Pressable>
  </View>;
}

function RememberScreen({ experience, personal, shared, onSkip, onSave }: { experience: Experience; personal: PersonalProfile; shared?: SharedCapsuleState; onSkip: () => void; onSave: (input: ReflectionInput, generationEvaluation?: GenerationEvaluationSignal[]) => void }) {
  const [note, setNote] = useState('');
  const [aspects, setAspects] = useState<ReflectionAspect[]>([]);
  const [outcome, setOutcome] = useState<LearningOutcome>('worth-it');
  const [learningOpen, setLearningOpen] = useState(false);
  const [generationEvaluation, setGenerationEvaluation] = useState<GenerationEvaluationSignal[]>([]);
  const visibleInsights = experience.steps.flatMap((step) => step.insight ? [step.insight] : []).filter((insight) => !personal.mutedInsightExperienceIds.includes(experience.id) && !personal.mutedInsightTopics.includes(insight.topic));
  const hasInsight = visibleInsights.length > 0;
  const meaningThread = visibleInsights.map((insight) => insight.title).slice(0, 2);
  const options = (Object.keys(reflectionAspectLabels) as ReflectionAspect[]).filter((aspect) => !['content-not-useful', 'topic-not-useful'].includes(aspect) || hasInsight);
  const toggle = (aspect: ReflectionAspect) => setAspects((current) => current.includes(aspect) ? current.filter((item) => item !== aspect) : [...current, aspect]);
  const toggleGenerationSignal = (signal: GenerationEvaluationSignal) => setGenerationEvaluation((current) => current.includes(signal) ? current.filter((item) => item !== signal) : [...current, signal]);
  const save = (selectedAspects = aspects) => onSave({ note, outcome, aspects: selectedAspects }, generationEvaluation);
  return (
    <ScrollView contentContainerStyle={styles.flowScroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>HERINNERING</Text><Text style={styles.flowTitle}>Wat blijft er over?</Text><Text style={styles.screenSubtitle}>{experience.memoryPrompt}</Text>
      <CoverImage uri={experience.image} style={styles.memoryPreview} imageStyle={styles.memoryImageStyle}><ImageShade /><Text style={styles.memoryPreviewTitle}>{experience.title}</Text></CoverImage>
      {shared && <View style={styles.sharedMemoryCard}><Text style={styles.expectationLabel}>SAMEN BELEEFD</Text><Text style={styles.sharedMemoryTitle}>{shared.participants.filter((participant) => participant.status === 'ready').map((participant) => participant.name).join(' + ')}</Text><Text style={styles.sharedMemoryBody}>Je bewaart alleen jouw eigen herinnering. De andere deelnemer krijgt geen kopie van jouw reflectie.</Text></View>}
      {experience.meaningThread && <MeaningThreadCard experience={experience} reflective />}
      {meaningThread.length ? <View style={styles.meaningTraceCard}><Text style={styles.expectationLabel}>WAT MISSCHIEN BLEEF HANGEN</Text><Text style={styles.meaningTraceTitle}>{meaningThread.join(' · ')}</Text><Text style={styles.meaningTraceBody}>Je hoeft hier niets over te schrijven. Bewaar alleen wat voor jou werkelijk betekenis had.</Text></View> : null}
      <Text style={styles.fieldLabel}>HOE WAS DIT VOOR JOU?</Text>
      <View style={styles.memoryOutcomeRow}>
        <ChoiceChip label="De moeite waard" selected={outcome === 'worth-it'} onPress={() => setOutcome('worth-it')} />
        <ChoiceChip label="Neutraal" selected={outcome === 'neutral'} onPress={() => setOutcome('neutral')} />
        <ChoiceChip label="Paste niet" selected={outcome === 'not-for-me'} onPress={() => setOutcome('not-for-me')} />
      </View>
      <TextInput value={note} onChangeText={setNote} placeholder="Optioneel: één zin die je wilt bewaren…" placeholderTextColor={colors.placeholder} multiline style={styles.memoryInput} />
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: learningOpen }} onPress={() => setLearningOpen((value) => !value)} style={styles.learningDisclosure}><View style={styles.flex}><Text style={styles.learningDisclosureTitle}>Help Momentum hiervan leren</Text><Text style={styles.learningDisclosureBody}>Alleen je bewuste keuzes worden aan je lokale profiel toegevoegd.</Text></View><Ionicons name={learningOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.gold} /></Pressable>
      {learningOpen && <><Text style={styles.fieldLabel}>WAT MAG VOLGENDE KEER ANDERS?</Text><View style={styles.chipRow}>{options.map((aspect) => <ChoiceChip key={aspect} label={reflectionAspectLabels[aspect]} selected={aspects.includes(aspect)} onPress={() => toggle(aspect)} />)}</View></>}
      {experience.generation && <View style={styles.learningCard}>
        <Text style={styles.learningTitle}>Beoordeel de Momentmaker</Text>
        <Text style={styles.learningBody}>Deze signalen meten de kwaliteit van de generator. Ze veranderen je persoonlijke profiel niet.</Text>
        <View style={styles.chipRow}>
          <ChoiceChip label="Voelde persoonlijk" selected={generationEvaluation.includes('personal')} onPress={() => toggleGenerationSignal('personal')} />
          <ChoiceChip label="Verraste me" selected={generationEvaluation.includes('surprising')} onPress={() => toggleGenerationSignal('surprising')} />
          <ChoiceChip label="Was direct uitvoerbaar" selected={generationEvaluation.includes('executable')} onPress={() => toggleGenerationSignal('executable')} />
          <ChoiceChip label="De inhoud hielp" selected={generationEvaluation.includes('content-useful')} onPress={() => toggleGenerationSignal('content-useful')} />
        </View>
      </View>}
      <PrimaryButton label="Bewaar dit moment" onPress={() => save(learningOpen ? aspects : [])} />
      <SecondaryButton label="Afronden zonder bewaren" onPress={onSkip} />
    </ScrollView>
  );
}

function ProfileScreen({ personal, evidence, composition, opportunitySummary, generatorStatus, generatingMoment, context, calendar, calendarLoading, liveWorld, locationConfirmed, contentCatalog, liveLoading, liveMessage, onChange, onEvaluateGenerator, onPersonalChange, onForgetReflection, onForgetLearningEvent, onResetEvidence, onResetLearning, onRedoOnboarding, onClearLiveCache, onConnectCalendar, onRefresh, onUseLocation, onClose }: { personal: PersonalProfile; evidence: PrototypeEvidence; composition: CompositionSummary; opportunitySummary: OpportunityEngineResult; generatorStatus: GeneratorRuntimeStatus; generatingMoment: boolean; context: PrototypeContext; calendar: CalendarContextSnapshot; calendarLoading: boolean; liveWorld: LiveWorldSnapshot | null; locationConfirmed: boolean; contentCatalog: ResolvedContentCatalog; liveLoading: boolean; liveMessage: string; onChange: (context: PrototypeContext) => void; onEvaluateGenerator: (kind: ExperienceKind, context: PrototypeContext) => Promise<void>; onPersonalChange: (profile: PersonalProfile) => void; onForgetReflection: (id: string) => void; onForgetLearningEvent: (id: string) => void; onResetEvidence: () => void; onResetLearning: () => void; onRedoOnboarding: () => void; onClearLiveCache: () => void; onConnectCalendar: () => void; onRefresh: () => void; onUseLocation: () => void; onClose: () => void }) {
  const [labOpen, setLabOpen] = useState(false);
  const [evaluationKind, setEvaluationKind] = useState<ExperienceKind>('outside');
  const [evaluationMinutes, setEvaluationMinutes] = useState(30);
  const [evaluationDayPart, setEvaluationDayPart] = useState<DayPart>(context.dayPart);
  const [evaluationCompany, setEvaluationCompany] = useState<Company>('solo');
  const [evaluationKettlebell, setEvaluationKettlebell] = useState(context.hasKettlebell);
  const dayParts: DayPart[] = ['morning', 'midday', 'afternoon', 'evening'];
  const profiles: PrototypeProfile[] = ['balanced', 'explorer', 'mover', 'family'];
  const companies: Array<{ id: Company; label: string }> = [{ id: 'solo', label: 'Alleen' }, { id: 'together', label: 'Samen' }, { id: 'family', label: 'Met gezin' }];
  const evaluationProgress = generatorEvaluationProgress(evidence.generationTrials);
  const nextEvaluation = nextGeneratorEvaluationScenario(evidence.generationTrials);
  const nextCompany = companies.find((item) => item.id === nextEvaluation.company)?.label ?? nextEvaluation.company;
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
    {(Object.keys(directionLabels) as Array<keyof typeof directionLabels>).map((horizon) => <DirectionEditor key={horizon} horizon={horizon} values={personal.directions[horizon]} paused={personal.pausedDirections} onTogglePause={(value) => onPersonalChange({ ...personal, pausedDirections: personal.pausedDirections.includes(value) ? personal.pausedDirections.filter((item) => item !== value) : [...personal.pausedDirections, value] })} onSave={(values) => onPersonalChange({ ...personal, directions: { ...personal.directions, [horizon]: values }, pausedDirections: personal.pausedDirections.filter((item) => values.includes(item) || Object.entries(personal.directions).some(([key, entries]) => key !== horizon && entries.includes(item))) })} />)}
    <Text style={styles.fieldLabel}>ZELF GEKOZEN VOORKEUREN</Text>
    <View style={styles.chipRow}>{(Object.keys(experienceKindLabels) as ExperienceKind[]).map((kind) => <ChoiceChip key={kind} label={experienceKindLabels[kind]} selected={personal.preferredKinds.includes(kind)} onPress={() => onPersonalChange({ ...personal, preferredKinds: personal.preferredKinds.includes(kind) ? personal.preferredKinds.filter((item) => item !== kind) : [...personal.preferredKinds, kind] })} />)}</View>
    <Text style={styles.fieldLabel}>WAT MOMENTUM HEEFT GELEERD</Text>
    <View style={styles.learningCard}>
      <Text style={styles.learningTitle}>{personal.reflectionMemories.length || personal.learningEvents.length ? `${personal.reflectionMemories.length + personal.learningEvents.length} expliciete signalen` : 'Nog geen duurzaam leersignaal'}</Text>
      <Text style={styles.learningBody}>{personal.reflectionMemories[0]?.explanation ?? personal.learningEvents[0]?.explanation ?? '“Niet nu” verandert niets. Alleen bevestigingen en correcties die jij bewust geeft worden onthouden.'}</Text>
      {personal.reflectionMemories.slice(0, 5).map((memory) => <View key={memory.id} style={styles.memorySignalRow}><View style={styles.flex}><Text style={styles.learningEvent}>• {memory.explanation}</Text>{memory.note && <Text style={styles.memorySignalNote}>“{memory.note}”</Text>}</View><Pressable accessibilityLabel={`Vergeet feedback over ${memory.experienceTitle}`} onPress={() => onForgetReflection(memory.id)} style={styles.forgetSignal}><Text style={styles.forgetSignalText}>Vergeet</Text></Pressable></View>)}
      {personal.learningEvents.filter((event) => !personal.reflectionMemories.some((memory) => memory.learningEventId === event.id)).slice(0, 5).map((event) => <View key={event.id} style={styles.memorySignalRow}><Text style={[styles.learningEvent, styles.flex]}>• {event.explanation}</Text><Pressable accessibilityLabel={`Vergeet leersignaal over ${event.experienceId}`} onPress={() => onForgetLearningEvent(event.id)} style={styles.forgetSignal}><Text style={styles.forgetSignalText}>Vergeet</Text></Pressable></View>)}
      {personal.mutedInsightTopics.length > 0 && <Text style={styles.learningEvent}>Minder uitleg over: {personal.mutedInsightTopics.join(', ')}.</Text>}
      {personal.mutedInsightExperienceIds.length > 0 && <Text style={styles.learningEvent}>Uitleg uitgezet bij {personal.mutedInsightExperienceIds.length} specifieke ervaring(en).</Text>}
    </View>
    <SecondaryButton label="Wis alleen wat Momentum heeft geleerd" onPress={onResetLearning} />
    <SecondaryButton label="Doorloop mijn startkeuzes opnieuw" onPress={onRedoOnboarding} />
    <Text style={styles.fieldLabel}>KOPPELINGEN & PRIVACY</Text>
    <View style={styles.personalCard}><ProfileRow label="Globale omgeving" value={locationConfirmed ? liveWorld?.regionLabel ?? 'Gekoppeld' : 'Niet gekoppeld'} /><ProfileRow label="Agenda" value={calendar.state === 'live' ? 'Lokaal gekoppeld' : calendar.state === 'denied' ? 'Niet toegestaan' : 'Niet gekoppeld'} /><ProfileRow label="Weer" value={locationConfirmed && liveWorld?.weather ? 'Live gekoppeld' : 'Wereldwijde fallback'} /><ProfileRow label="Frisse capsules" value={generatorStatus.label} /><ProfileRow label="Gezondheid" value="Niet gekoppeld" /></View>
    <Text style={styles.sourcePrivacy}>Voor een frisse capsule bij openen gebruikt de generator hooguit één richting die jij zelf koos, dagdeel, beschikbare tijd, gezelschap en expliciet materiaal. Geen doelen, reflecties, agenda-inhoud of locatie.</Text>
    {calendar.state !== 'live' && <SecondaryButton label={calendarLoading ? 'Agenda wordt gecontroleerd…' : Platform.OS === 'web' ? 'Agenda vereist een development build' : 'Koppel mijn agenda'} onPress={onConnectCalendar} />}
    <SecondaryButton label={locationConfirmed ? 'Werk mijn globale omgeving bij' : 'Gebruik mijn globale omgeving'} onPress={onUseLocation} />
    {MOMENTUM_DEBUG && <>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: labOpen }} onPress={() => setLabOpen((value) => !value)} style={styles.labDisclosure}><View style={styles.flex}><Text style={styles.labDisclosureTitle}>Momentum Lab</Text><Text style={styles.labDisclosureBody}>Testcontext, bronstatus en lokale compositiediagnostiek.</Text></View><Ionicons name={labOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.gold} /></Pressable>
    {labOpen && <>
    <Text style={styles.fieldLabel}>MOMENTMAKER-PROEFBANK</Text>
    <Text style={styles.screenSubtitle}>Open telkens één volledige capsule met gecontroleerde testcontext. Dit wijzigt je profiel, agenda en gewone Nu-selectie niet.</Text>
    <View style={styles.learningCard}>
      <Text style={styles.learningTitle}>Volgende ontbrekende proef</Text>
      <Text style={styles.learningBody}>{nextEvaluation.label} · {experienceKindLabels[nextEvaluation.kind]} · {nextEvaluation.availableMinutes} min · {dayPartLabels[nextEvaluation.dayPart].toLowerCase()} · {nextCompany.toLowerCase()}{nextEvaluation.kind === 'movement' ? nextEvaluation.hasKettlebell ? ' · met kettlebell' : ' · zonder materiaal' : ''}.</Text>
      <Text style={styles.learningEvent}>{evaluationProgress.evaluated} van {evaluationProgress.planned} kernscenario's volledig beleefd en beoordeeld · {evaluationProgress.attempted} geprobeerd{evaluationProgress.rejected ? ` · ${evaluationProgress.rejected} tegengehouden` : ''}.</Text>
    </View>
    <PrimaryButton label={generatingMoment ? 'Capsule wordt opgebouwd…' : 'Voer de volgende proef uit'} onPress={() => { if (!generatingMoment) onEvaluateGenerator(nextEvaluation.kind, scenarioContext(context, nextEvaluation)); }} />
    <Text style={styles.fieldLabel}>OF STEL EEN VRIJE PROEF SAMEN</Text>
    <Text style={styles.fieldLabel}>RICHTING</Text>
    <View style={styles.chipRow}>{(Object.keys(experienceKindLabels) as ExperienceKind[]).map((kind) => <ChoiceChip key={kind} label={experienceKindLabels[kind]} selected={evaluationKind === kind} onPress={() => setEvaluationKind(kind)} />)}</View>
    <Text style={styles.fieldLabel}>TIJD EN DAGDEEL</Text>
    <View style={styles.chipRow}>{timeOptions.map((minutes) => <ChoiceChip key={minutes} label={minutes < 60 ? `${minutes} min` : minutes === 60 ? '1 uur' : '2 uur'} selected={evaluationMinutes === minutes} onPress={() => setEvaluationMinutes(minutes)} />)}</View>
    <View style={styles.chipRow}>{dayParts.map((dayPart) => <ChoiceChip key={dayPart} label={dayPartLabels[dayPart]} selected={evaluationDayPart === dayPart} onPress={() => setEvaluationDayPart(dayPart)} />)}</View>
    <Text style={styles.fieldLabel}>GEZELSCHAP EN MATERIAAL</Text>
    <View style={styles.chipRow}>{companies.map((item) => <ChoiceChip key={item.id} label={item.label} selected={evaluationCompany === item.id} onPress={() => setEvaluationCompany(item.id)} />)}</View>
    {evaluationKind === 'movement' && <View style={styles.chipRow}><ChoiceChip label="Kettlebell beschikbaar" selected={evaluationKettlebell} onPress={() => setEvaluationKettlebell(true)} /><ChoiceChip label="Zonder materiaal" selected={!evaluationKettlebell} onPress={() => setEvaluationKettlebell(false)} /></View>}
    <PrimaryButton label={generatingMoment ? 'Capsule wordt opgebouwd…' : `Proef ${experienceKindLabels[evaluationKind].toLowerCase()}`} onPress={() => { if (!generatingMoment) onEvaluateGenerator(evaluationKind, { ...context, availableMinutes: evaluationMinutes, dayPart: evaluationDayPart, company: evaluationCompany, hasKettlebell: evaluationKettlebell }); }} />
    <Text style={styles.fieldLabel}>MOMENTMAKER EVALUATIE</Text>
    <View style={styles.personalCard}>
      <ProfileRow label="Geldige concepten getoond" value={`${evidence.generatedShown}`} />
      <ProfileRow label="Door contract tegengehouden" value={`${evidence.generatedRejected}`} />
      <ProfileRow label="Na beleven beoordeeld" value={`${evidence.generatedEvaluated}`} />
      <ProfileRow label="Voelde persoonlijk" value={`${evidence.generationSignals.personal}`} />
      <ProfileRow label="Was verrassend" value={`${evidence.generationSignals.surprising}`} />
      <ProfileRow label="Was uitvoerbaar" value={`${evidence.generationSignals.executable}`} />
      <ProfileRow label="Inhoud hielp" value={`${evidence.generationSignals['content-useful']}`} />
    </View>
    <Text style={styles.screenSubtitle}>{evidence.lastGenerationNote ?? 'Maak een nieuw moment om de generatorroute te evalueren.'} Deze lokale evaluatie staat los van je persoonlijke voorkeuren en herinneringen.</Text>
    <Text style={styles.fieldLabel}>DEKKING PER RICHTING</Text>
    <View style={styles.personalCard}>{(Object.keys(experienceKindLabels) as ExperienceKind[]).map((kind) => {
      const item = evidence.generationByKind[kind];
      const qualities = [item.personal ? `${item.personal} persoonlijk` : '', item.surprising ? `${item.surprising} verrassend` : '', item.executable ? `${item.executable} uitvoerbaar` : '', item.contentUseful ? `${item.contentUseful} inhoud` : ''].filter(Boolean).join(' · ');
      return <ProfileRow key={kind} label={experienceKindLabels[kind]} value={`${item.shown} getoond · ${item.evaluated} beoordeeld${qualities ? ` · ${qualities}` : ''}`} />;
    })}</View>
    <Text style={styles.fieldLabel}>KERNMATRIX</Text>
    <View style={styles.personalCard}>{generatorEvaluationPlan.map((scenario) => {
      const trials = evidence.generationTrials.filter((trial) => trial.id === scenario.id);
      const evaluatedTrial = [...trials].reverse().find((trial) => trial.status === 'evaluated');
      const state = evaluatedTrial ? `${evaluatedTrial.signals.length}/4 kwaliteitssignalen` : trials.some((trial) => trial.status === 'shown') ? 'Nog beleven en beoordelen' : trials.some((trial) => trial.status === 'rejected') ? 'Tegengehouden · opnieuw onderzoeken' : 'Nog niet geprobeerd';
      return <ProfileRow key={scenario.id} label={scenario.label} value={state} />;
    })}</View>
    <Text style={styles.fieldLabel}>AUTOMATISCHE COMPOSITIE</Text>
    <View style={styles.personalCard}><ProfileRow label="Kaarten gecontroleerd" value={`${composition.checked}`} /><ProfileRow label="Automatisch verrijkt" value={`${composition.automaticallyComposed}`} /><ProfileRow label="Gidsmomenten" value={`${composition.guideMoments}`} /><ProfileRow label="Actueel bron-onderbouwd" value={`${composition.liveGrounded}`} /><ProfileRow label="Tegenhouden" value={`${composition.rejected}`} /></View>
    <Text style={styles.screenSubtitle}>Elke kandidaat wordt lokaal gecontroleerd op een complete belofte, uitvoerbare stappen, tijd, gezelschap, route en bronversheid. Een afgekeurde kaart bereikt Nu, Vandaag en Ontdekken niet.</Text>
    <Text style={styles.fieldLabel}>LIVING WORLD OPPORTUNITY ENGINE</Text>
    <View style={styles.personalCard}><ProfileRow label="Bronstatus" value={opportunitySummary.sourceLabel} /><ProfileRow label="Bronmix" value={opportunitySummary.sourceMix.join(' + ') || 'Geen actuele mix'} /><ProfileRow label="Plaatsverhalen" value={`${opportunitySummary.knowledgeCount}`} /><ProfileRow label="Routecontrole" value={routingCapability().providerLabel} /><ProfileRow label="Perspectieven" value={`${opportunitySummary.perspectiveCount}`} /><ProfileRow label="Kansen beoordeeld" value={`${opportunitySummary.considered}`} /><ProfileRow label="Uitvoerbaar" value={`${opportunitySummary.ready.length}`} /><ProfileRow label="Terecht tegengehouden" value={`${opportunitySummary.withheld.length}`} /></View>
    {opportunitySummary.withheld.slice(0, 3).map((item) => <Text key={item.id} style={styles.screenSubtitle}>Niet getoond: {item.reason}</Text>)}
    <Text style={styles.fieldLabel}>LOKAAL PROEFBEWIJS</Text>
    <View style={styles.personalCard}><ProfileRow label="Gestart" value={`${evidence.started}`} /><ProfileRow label="Afgerond" value={`${evidence.completed}`} /><ProfileRow label="Gereflecteerd" value={`${evidence.reflected}`} /><ProfileRow label="Reflectie overgeslagen" value={`${evidence.skippedReflection}`} /></View>
    <Text style={styles.screenSubtitle}>Alleen lokale aantallen, zonder account, inhoud, tijdstip of externe analytics. Dit helpt straks beoordelen of mensen werkelijk beginnen en afronden.</Text>
    <SecondaryButton label="Wis lokale proeftellingen" onPress={onResetEvidence} />
    <Text style={styles.fieldLabel}>TESTCONTEXT</Text>
    <Text style={styles.screenSubtitle}>Deze waarden simuleren voorlopig context die later alleen met jouw toestemming uit apparaatbronnen kan komen.</Text>
    <Text style={styles.fieldLabel}>MOMENT VAN DE DAG</Text><View style={styles.chipRow}>{dayParts.map((item) => <ChoiceChip key={item} label={dayPartLabels[item]} selected={context.dayPart === item} onPress={() => onChange({ ...context, dayPart: item })} />)}</View>
    <Text style={styles.fieldLabel}>PROEFPROFIEL</Text>
    <View style={styles.profileChoiceList}>{profiles.map((item) => <Pressable key={item} onPress={() => { impactLight(); onChange({ ...context, profile: item }); }} style={[styles.profileChoice, context.profile === item && styles.profileChoiceSelected]}><View style={styles.flex}><Text style={styles.profileChoiceTitle}>{profileLabels[item].title}</Text><Text style={styles.profileChoiceBody}>{profileLabels[item].body}</Text></View><Ionicons name={context.profile === item ? 'radio-button-on' : 'radio-button-off'} size={17} color={context.profile === item ? colors.accent : colors.muted} style={styles.profileChoiceMark} /></Pressable>)}</View>
    <Text style={styles.fieldLabel}>MET WIE?</Text><View style={styles.chipRow}>{companies.map((item) => <ChoiceChip key={item.id} label={item.label} selected={context.company === item.id} onPress={() => onChange({ ...context, company: item.id })} />)}</View>
    <Text style={styles.fieldLabel}>BESCHIKBAAR MATERIAAL</Text><View style={styles.chipRow}><ChoiceChip label="Kettlebell" selected={context.hasKettlebell} onPress={() => onChange({ ...context, hasKettlebell: !context.hasKettlebell })} /><ChoiceChip label="Geen trainingsmateriaal" selected={!context.hasKettlebell} onPress={() => onChange({ ...context, hasKettlebell: false })} /></View>
    <View style={styles.profileCard}><ProfileRow label="Locatie" value={liveWorld?.regionLabel ?? 'Niet gekoppeld'} /><ProfileRow label="Ervaringen" value={contentCatalog.coverageLabel} /><ProfileRow label="Seizoen" value={contentCatalog.context.season === 'spring' ? 'Lente' : contentCatalog.context.season === 'summer' ? 'Zomer' : contentCatalog.context.season === 'autumn' ? 'Herfst' : 'Winter'} /><ProfileRow label="Agenda" value={calendar.state === 'live' ? 'Lokaal gekoppeld' : calendar.state === 'denied' ? 'Niet toegestaan' : 'Niet gekoppeld'} /><ProfileRow label="Weer" value={liveWorld?.weather ? 'Live gekoppeld' : 'Niet gekoppeld'} /><ProfileRow label="Gezondheid" value="Niet gekoppeld" /></View>
    <View style={styles.calendarControlCard}>
      <Text style={styles.liveEvidenceTitle}>AGENDA · VRIJE RUIMTE</Text>
      <Text style={styles.liveControlMessage}>{calendar.detail}</Text>
      {calendar.state === 'live' && calendar.freeWindows.slice(0, 3).map((window) => <View key={window.start} style={styles.calendarWindowRow}><Ionicons name="time-outline" size={13} color={colors.bone} /><Text style={styles.calendarWindowText}>{formatWindow(window)}</Text></View>)}
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
    <View style={styles.futureSources}><Text style={styles.fieldLabel}>ACTIEVE BRONCONTRACTEN</Text>{livingWorldSourceRegistry.map((source) => <View key={source.id} style={styles.futureSourceRow}><View style={styles.flex}><Text style={styles.futureSourceLabel}>{source.label}</Text><Text style={styles.sourceDetail}>{source.role} · {source.coverage} · {source.maySelectDestination ? 'mag een publieke bestemming aandragen' : 'alleen verrijking'}</Text></View><Text style={styles.futureSourceState}>{source.status === 'active' ? 'ACTIEF' : 'OPTIONEEL'}</Text></View>)}</View>
    <View style={styles.futureSources}><Text style={styles.fieldLabel}>VOLGENDE LIVE BRONNEN</Text>{futureSourceRegistry.map((source) => <View key={source.id} style={styles.futureSourceRow}><Text style={styles.futureSourceLabel}>{source.label}</Text><Text style={styles.futureSourceState}>GEPLAND</Text></View>)}</View>
    </>}
    </>}
    <View style={styles.learningCard}><Text style={styles.learningTitle}>Transparante lokale selectie</Text><Text style={styles.learningBody}>Momentum filtert eerst op tijd, gezelschap en materiaal. Daarna wegen moment, jouw eigen woorden, bevestigde voorkeuren, actuele bronnen en voldoende afwisseling mee.</Text></View>
    <PrimaryButton label={MOMENTUM_DEBUG ? 'Gebruik deze proefcontext' : 'Klaar'} onPress={onClose} />
  </ScrollView>;
}

function LiveWorldBar({ snapshot, loading, onRefresh }: { snapshot: LiveWorldSnapshot | null; loading: boolean; onRefresh?: () => Promise<boolean> }) {
  const weather = snapshot?.weather;
  const air = snapshot?.airQuality;
  const liveCount = snapshot?.sources.filter((source) => source.state === 'live').length ?? 0;
  const staleCount = snapshot?.sources.filter((source) => source.state === 'stale').length ?? 0;
  const region = (snapshot?.regionLabel ?? defaultRegion.label).split(' proefcontext')[0];
  return <View style={styles.liveWorldBar}>
    <View style={[styles.sourceState, liveCount ? styles.sourceLive : styles.sourceWaiting]} />
    <View style={styles.flex}><Text style={styles.liveWorldBarTitle}>{loading && !snapshot ? 'Je omgeving wordt bijgewerkt' : liveCount ? `Actuele omstandigheden rond ${region}` : staleCount ? `Laatste bekende omstandigheden rond ${region}` : `Ervaringen rond ${region}`}</Text><Text style={styles.liveWorldBarDetail}>{weather ? `${Math.round(weather.temperature)}°C · wind ${Math.round(weather.windSpeed)} km/u · zicht ${Math.round(weather.visibilityMeters / 1000)} km${air ? ` · luchtkwaliteit ${Math.round(air.europeanAqi)}` : ''}` : 'Ook zonder live bronnen blijft Momentum bruikbaar'}</Text></View>
    {onRefresh ? <Pressable accessibilityRole="button" accessibilityLabel="Vernieuw de live wereld" disabled={loading} onPress={() => { onRefresh().catch(() => undefined); }} style={styles.liveWorldRefresh}><Ionicons name="refresh" size={16} color={colors.accent} /></Pressable> : null}
  </View>;
}

function BottomNav({ surface, onChange }: { surface: Surface; onChange: (surface: Surface) => void }) {
  const items: Array<{ id: Surface; label: string }> = [
    { id: 'now', label: 'Nu' }, { id: 'today', label: 'Vandaag' },
    { id: 'discover', label: 'Ontdekken' }, { id: 'lifebook', label: 'Leefboek' },
  ];
  // Echt glas (Horizon B): expo-blur onder de bottomNav; de fallbackColor blijft
  // de vroegere rgba-tint zodat web zonder backdrop-filter er identiek uitziet.
  return <Glass intensity={48} fallbackColor="rgba(252,250,245,0.92)" style={styles.bottomNav}>{items.map((item) => {
    const active = surface === item.id;
    return <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: active }} onPress={() => { impactLight(); onChange(item.id); }} style={styles.navItem}><View style={[styles.navIconShell, active && styles.navIconShellActive]}><NavGlyph kind={item.id} active={active} /></View><Text style={[styles.navLabel, active && styles.navActive]}>{item.label}</Text></Pressable>;
  })}</Glass>;
}

function NavGlyph({ kind, active }: { kind: Surface; active: boolean }) {
  const color = active ? colors.accent : colors.muted;
  const name = kind === 'now' ? 'disc-outline' : kind === 'today' ? 'sunny-outline' : kind === 'discover' ? 'compass-outline' : 'book-outline';
  return <Ionicons name={name} size={21} color={color} />;
}

function ExperienceTile({ experience, large, onPress }: { experience: Experience; large?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.experienceTile}><CoverImage uri={experience.image} style={[styles.tileImage, large && styles.tileImageLarge]} imageStyle={styles.tileImageStyle}><ImageShade />{experience.generation && <View style={styles.generatedTileBadge}><Ionicons name="sparkles" size={11} color={colors.onImageAccent} /><Text style={[styles.generatedTileBadgeText, styles.onImageAccentText]}>VOOR DIT MOMENT GEMAAKT</Text></View>}<View style={styles.tileCopy}><Pill label={experience.kind.toUpperCase()} accent={experience.accent} /><Text style={[styles.tileTitle, styles.onImageText]}>{experience.title}</Text><Text style={[styles.tilePromise, styles.onImageMutedText]}>{experience.promise}</Text><View style={[styles.iconMetaRow, { marginTop: 14 }]}><Text style={[styles.tileMeta, styles.onImageText]}>{experience.duration} min · {experience.effort}</Text><Ionicons name="arrow-forward" size={12} color={colors.onImage} /></View></View></CoverImage></Pressable>;
}

function CapsuleShapePreview({ experience }: { experience: Experience }) {
  const shape = experience.kind === 'outside'
    ? { label: 'JE REIS', title: experience.routePlan ? `Naar ${experience.routePlan.destinationName}` : 'Van vertrek naar ontdekking', note: 'Route, aankomst en verhalen van de plek blijven op het juiste moment beschikbaar.' }
    : experience.kind === 'movement'
      ? { label: 'JE TRAINING', title: `${experience.steps.length} heldere delen`, note: 'Je ziet telkens één beweging of interval; de rest wacht rustig op de achtergrond.' }
      : experience.kind === 'food'
        ? { label: 'JE BEREIDING', title: `${experience.steps.length} stappen van ingrediënt naar tafel`, note: 'Eerst wat je nodig hebt, daarna steeds één handeling en de reden waarom die telt.' }
        : experience.kind === 'restore'
          ? { label: 'JE RITME', title: `${experience.duration} minuten zonder haast`, note: 'Eén rustig ritme, minimale bediening en altijd de mogelijkheid om de telefoon weg te leggen.' }
          : { label: 'JE BELEVING', title: `${experience.steps.length} momenten die logisch in elkaar overgaan`, note: 'Alleen de aanwijzing die nu helpt blijft zichtbaar.' };
  return <View style={styles.capsuleShapeCard}>
    <View style={styles.capsuleShapeHeader}><View style={styles.flex}><Text style={styles.capsuleShapeLabel}>{shape.label}</Text><Text style={styles.capsuleShapeTitle}>{shape.title}</Text></View><Ionicons name={experience.kind === 'outside' ? 'navigate-outline' : experience.kind === 'movement' ? 'barbell-outline' : experience.kind === 'food' ? 'restaurant-outline' : experience.kind === 'restore' ? 'leaf-outline' : 'sparkles-outline'} size={25} color={experience.accent} /></View>
    <View style={styles.capsuleShapeRail}>{experience.steps.slice(0, 3).map((step, index) => <View key={`${step.title}-${index}`} style={styles.capsuleShapeStep}><View style={[styles.capsuleShapeNumber, { borderColor: experience.accent }]}><Text style={styles.capsuleShapeNumberText}>{index + 1}</Text></View><Text numberOfLines={2} style={styles.capsuleShapeStepText}>{step.title}</Text></View>)}</View>
    <Text style={styles.capsuleShapeNote}>{shape.note}</Text>
  </View>;
}

function GeneratedCapsulePreview({ experience }: { experience: Experience }) {
  const guide = buildExperienceGuide(experience, 0);
  return <View style={styles.generatedJourneyCard}>
    <View style={styles.generatedJourneyHeader}><View><Text style={styles.generatedJourneyEyebrow}>COMPLETE ERVARINGSCAPSULE</Text><Text style={styles.generatedJourneyTitle}>Van beginnen tot herinneren</Text></View><Text style={styles.generatedJourneyCount}>{experience.steps.length} stappen</Text></View>
    <View style={styles.generatedJourneyStages}>
      {experience.steps.slice(0, 3).map((step, index) => <View key={`${step.title}-${index}`} style={styles.generatedJourneyStage}><View style={[styles.generatedJourneyNumber, { borderColor: experience.accent }]}><Text style={styles.generatedJourneyNumberText}>{index + 1}</Text></View><View style={styles.flex}><Text style={styles.generatedJourneyStageTitle}>{step.title}</Text><Text numberOfLines={2} style={styles.generatedJourneyStageBody}>{step.instruction}</Text></View></View>)}
    </View>
    <Text style={styles.generatedJourneyCoverage}>{guide.coverageLabel} · {guide.compositionLabel ?? 'Gecontroleerd ervaringscontract'} · daarna optionele herinnering</Text>
  </View>;
}

function Pill({ label, accent }: { label: string; accent: string }) { return <View style={[styles.pill, { borderColor: accent }]}><View style={[styles.pillDot, { backgroundColor: accent }]} /><Text style={[styles.pillText, { color: accent }]}>{label}</Text></View>; }
function MiniFact({ value, label, onImage = false }: { value: string; label: string; onImage?: boolean }) { return <View style={styles.miniFact}><Text numberOfLines={1} style={[styles.miniFactValue, onImage && styles.miniFactValueOnImage]}>{value}</Text><Text style={[styles.miniFactLabel, onImage && styles.miniFactLabelOnImage]}>{label}</Text></View>; }
function MeaningThreadCard({ experience, compact = false, reflective = false }: { experience: Experience; compact?: boolean; reflective?: boolean }) {
  const thread = experience.meaningThread;
  if (!thread || !meaningThreadFitsExperience(experience)) return null;
  const horizon = thread.horizon === 'near' ? 'VOOR DE KOMENDE TIJD' : thread.horizon === 'growth' ? 'EEN RICHTING WAARIN JE WILT GROEIEN' : 'WAT JIJ BELANGRIJK NOEMT';
  return <View style={[styles.meaningThreadCard, compact && styles.meaningThreadCompact]}><Text style={styles.meaningThreadEyebrow}>{reflective ? 'RAAKTE DIT AAN WAT JIJ BELANGRIJK VINDT?' : horizon}</Text><Text style={styles.meaningThreadLabel}>{thread.label}</Text><Text style={styles.meaningThreadReason}>{reflective ? 'Geen score en geen verplicht doel. Alleen een draad die je kunt herkennen, corrigeren of laten rusten.' : `${thread.reason}. Dit is gebaseerd op woorden die jij zelf hebt gekozen.`}</Text></View>;
}
function ChoiceChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <Pressable onPress={() => { impactLight(); onPress(); }} style={[styles.choiceChip, selected && styles.choiceChipSelected, selected && { backgroundColor: colors.accentSoft }]}><Text style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>{label}</Text></Pressable>; }
function DirectionEditor({ horizon, values, paused, onTogglePause, onSave }: { horizon: keyof typeof directionLabels; values: string[]; paused: string[]; onTogglePause: (value: string) => void; onSave: (values: string[]) => void }) {
  const [draft, setDraft] = useState(values.join('\n'));
  useEffect(() => setDraft(values.join('\n')), [values]);
  const save = () => onSave(draft.split('\n').map((item) => item.trim()).filter(Boolean));
  const placeholder = horizon === 'near' ? 'Bijvoorbeeld: vaker samen naar buiten' : horizon === 'growth' ? 'Bijvoorbeeld: sterker en nieuwsgieriger worden' : 'Bijvoorbeeld: aandacht voor gezin en natuur';
  return <View style={styles.directionCard}>
    <Text style={styles.directionTitle}>{directionLabels[horizon].title}</Text><Text style={styles.directionBody}>{directionLabels[horizon].body}</Text>
    {values.map((value) => <View key={value} style={styles.directionStatusRow}><Text style={[styles.directionStatusText, paused.includes(value) && styles.directionStatusPaused]}>{value}</Text><Pressable onPress={() => onTogglePause(value)} style={styles.directionPause}><Text style={styles.directionPauseText}>{paused.includes(value) ? 'Hervat' : 'Pauzeer'}</Text></Pressable></View>)}
    <TextInput value={draft} onChangeText={setDraft} onBlur={save} placeholder={placeholder} placeholderTextColor={colors.placeholder} multiline style={styles.directionInput} />
    <Pressable onPress={save} style={styles.directionSave}><Text style={styles.directionSaveText}>Richting bewaren</Text></Pressable>
  </View>;
}
function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  const press = usePressSpring();
  return <Animated.View style={press.animatedStyle}><Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} onPress={() => { impactMedium(); onPress(); }} onPressIn={press.onPressIn} onPressOut={press.onPressOut} style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]}><Text style={[styles.primaryButtonText, disabled && styles.primaryButtonTextDisabled]}>{label}</Text>{!disabled && <Ionicons name="arrow-forward" size={20} color={colors.onImage} />}</Pressable></Animated.View>;
}
function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const press = usePressSpring({ pressedScale: 0.975 });
  return <Animated.View style={press.animatedStyle}><Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{label}</Text></Pressable></Animated.View>;
}
function BackButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.backButton}><Ionicons name="chevron-back" size={15} color={colors.bone} /><Text style={styles.backButtonText}>{label}</Text></Pressable>; }
function ProfileRow({ label, value }: { label: string; value: string }) { return <View style={styles.profileRow}><Text style={styles.profileLabel}>{label}</Text><Text style={styles.profileValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E9E3D8' }, safe: { flex: 1, alignItems: 'center' }, appFrame: { flex: 1, width: '100%', maxWidth: 560 }, webAppFrame: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.softLine, backgroundColor: colors.ink, shadowColor: colors.shadow, shadowOpacity: 0.16, shadowRadius: 38, shadowOffset: { width: 0, height: 8 } }, flex: { flex: 1 },
  onImageText: { color: colors.onImage },
  onImageMutedText: { color: colors.onImageMuted },
  onImageAccentText: { color: colors.onImageAccent },
  onboardingScroll: { flexGrow: 1, padding: 22, paddingTop: 20, paddingBottom: 42 },
  onboardingProgress: { flexDirection: 'row', gap: 6, marginBottom: 42 },
  onboardingProgressPart: { height: 3, flex: 1, borderRadius: 2, backgroundColor: colors.line },
  onboardingProgressActive: { backgroundColor: colors.accent },
  onboardingTitle: { color: colors.bone, fontSize: 39, lineHeight: 44, letterSpacing: -1.1, fontWeight: '700', fontFamily: editorialFont, maxWidth: 430 },
  onboardingBody: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 16, marginBottom: 30, maxWidth: 430 },
  singleInput: { minHeight: 56, borderRadius: radii.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, color: colors.bone, fontSize: 16, paddingHorizontal: 16, marginBottom: 18 },
  onboardingChoices: { gap: 9, marginBottom: 24 },
  onboardingChoice: { minHeight: 60, borderRadius: radii.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  onboardingChoiceSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  onboardingChoiceTitle: { color: colors.bone, fontSize: 15, fontWeight: '600' },
  onboardingFooter: { marginTop: 'auto', paddingTop: 24 },
  trustCard: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, borderLeftWidth: 3, borderLeftColor: colors.accent, backgroundColor: colors.panel, padding: 17, marginTop: 8 },
  validationText: { color: colors.accentText, fontSize: 11, textAlign: 'center', marginTop: 10 },
  quietCorrection: { color: colors.accentText, fontSize: 11 },
  personalCard: { borderRadius: 24, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', marginTop: 24, marginBottom: 26 },
  learningEvent: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 9 },
  directionCard: { borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 16, marginBottom: 10 },
  directionTitle: { color: colors.bone, fontSize: 15, fontWeight: '700' },
  directionBody: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4, marginBottom: 11 },
  directionInput: { minHeight: 66, borderRadius: 14, borderWidth: 1, borderColor: colors.accentLine, backgroundColor: colors.ink, color: colors.bone, padding: 12, textAlignVertical: 'top', fontSize: 13, lineHeight: 20 },
  directionSave: { alignSelf: 'flex-end', paddingVertical: 9, paddingHorizontal: 4 },
  directionSaveText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  directionStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderTopWidth: 1, borderTopColor: colors.line },
  directionStatusText: { color: colors.bone, fontSize: 11, flex: 1 },
  directionStatusPaused: { color: colors.mutedSoft, textDecorationLine: 'line-through' },
  directionPause: { borderRadius: 10, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 9, paddingVertical: 6 },
  directionPauseText: { color: colors.accentText, fontSize: 11, fontWeight: '700' },
  reflectionHint: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: -4, marginBottom: 12 },
  memorySignalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 7, borderTopWidth: 1, borderTopColor: colors.line, marginTop: 9 },
  memorySignalNote: { color: colors.mutedSoft, fontSize: 11, lineHeight: 14, marginTop: 3 },
  forgetSignal: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(217,179,107,0.28)', paddingHorizontal: 10, paddingVertical: 7 },
  forgetSignalText: { color: colors.accentText, fontSize: 11, fontWeight: '700' },
  directionMatch: { color: colors.accent, fontSize: 11, lineHeight: 14, marginTop: 7, fontWeight: '700' },
  selectionReasons: { borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panelRaised, padding: 13, marginTop: 10, marginBottom: 8 },
  selectionReason: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  resumeCard: { borderRadius: 18, borderWidth: 1, borderColor: colors.softLine, backgroundColor: 'rgba(252,250,245,0.76)', padding: 12, marginBottom: 14 },
  resumeMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resumeMark: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
 
  resumeLabel: { color: colors.accent, fontSize: 11, letterSpacing: 1, fontWeight: '700' },
  resumeTitle: { color: colors.bone, fontSize: 14, fontWeight: '700', marginTop: 3 },
  resumeBody: { color: colors.muted, fontSize: 11, marginTop: 2 },
  resumeDiscard: { alignSelf: 'flex-end', paddingTop: 10, paddingHorizontal: 4 },
  resumeDiscardText: { color: colors.muted, fontSize: 11 },
  insightCard: { width: '100%', maxWidth: 430, borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 16, marginTop: 22 },
  insightEyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 1.2, fontWeight: '700' },
  insightTitle: { color: colors.bone, fontSize: 17, fontWeight: '700', marginTop: 8 },
  insightBody: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 7 },
  insightSource: { color: colors.mutedSoft, fontSize: 11, marginTop: 11 },
  ambientGold: { position: 'absolute', width: 520, height: 520, borderRadius: 260, backgroundColor: 'rgba(182,135,85,0.10)', top: -350, right: -260 },
  ambientUmber: { position: 'absolute', width: 500, height: 500, borderRadius: 250, backgroundColor: 'rgba(154,104,72,0.06)', bottom: -330, left: -270 },
  screenScroll: { padding: 20, paddingTop: 16, paddingBottom: 168 }, flowScroll: { padding: 20, paddingTop: 14, paddingBottom: 72 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 }, headerCopy: { flex: 1, paddingRight: 12 },
  eyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 1.45, fontWeight: '700', marginBottom: 11 },
  screenTitle: { color: colors.bone, fontSize: 38, lineHeight: 43, letterSpacing: -1, fontWeight: '700', fontFamily: editorialFont }, screenSubtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.bone, fontSize: 15, fontWeight: '700' },
  heroCard: { borderRadius: radii.hero, overflow: 'hidden', backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.softLine, shadowColor: colors.shadow, shadowOpacity: 0.16, shadowRadius: 28, shadowOffset: { width: 0, height: 14 } }, heroImage: { minHeight: 520, padding: 20, justifyContent: 'space-between' }, heroImageStyle: { borderRadius: radii.hero - 1 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, heroTime: { color: colors.onImage, fontSize: 12, letterSpacing: 1.2, fontWeight: '600' }, heroBottom: { gap: 11 }, heroTitle: { color: colors.onImage, fontSize: 41, lineHeight: 46, fontWeight: '700', fontFamily: editorialFont, letterSpacing: -1 }, heroPromise: { color: colors.onImageMuted, fontSize: 16, lineHeight: 23, maxWidth: 390 }, heroGrounding: { alignSelf: 'flex-start', marginTop: 11, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: radii.pill, borderWidth: 1, borderColor: 'rgba(255,253,248,0.28)', backgroundColor: colors.darkGlass, paddingHorizontal: 11, paddingVertical: 7 }, heroGroundingText: { color: colors.onImage, fontSize: 11, fontWeight: '700' }, heroFacts: { flexDirection: 'row', gap: 18 },
  heroWonder: { color: colors.onImage, fontSize: 15, lineHeight: 22, fontWeight: '600', marginTop: 11, maxWidth: 410 }, heroPrimaryAction: { minHeight: 58, borderRadius: 29, backgroundColor: 'rgba(252,250,245,0.96)', paddingHorizontal: 21, marginTop: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }, heroPrimaryActionText: { color: colors.bone, fontSize: 16, fontWeight: '800' },
  heroActionArea: { paddingHorizontal: 18, paddingBottom: 12 }, wonderText: { color: colors.bone, fontSize: 15, lineHeight: 22, marginBottom: 16 },
  suggestionSwitcher: { minHeight: 66, marginTop: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  suggestionArrow: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  suggestionArrowDisabled: { opacity: 0.22 }, suggestionPosition: { alignItems: 'center', flex: 1 }, suggestionDots: { flexDirection: 'row', gap: 6 }, suggestionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.line }, suggestionDotActive: { width: 18, backgroundColor: colors.accent }, suggestionPositionBody: { color: colors.muted, fontSize: 11, marginTop: 6 },
  liveWorldBar: { minHeight: 54, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }, liveWorldBarTitle: { color: colors.bone, fontSize: 12, fontWeight: '600' }, liveWorldBarDetail: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 2 }, liveWorldMark: { color: colors.accent, fontSize: 20 },
  liveWorldRefresh: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  pullIndicator: { position: 'absolute', top: 8, alignSelf: 'center', zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.accentLine, backgroundColor: colors.panel, paddingHorizontal: 13, paddingVertical: 8, shadowColor: colors.shadow, shadowOpacity: 0.10, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  pullIndicatorText: { color: colors.bone, fontSize: 11, fontWeight: '700' },
  contextNotice: { minHeight: 58, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(217,179,107,0.28)', backgroundColor: 'rgba(217,179,107,0.05)', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 14 }, contextNoticeTitle: { color: colors.bone, fontSize: 12, fontWeight: '700' }, contextNoticeBody: { color: colors.muted, fontSize: 11, marginTop: 3 },
  pill: { alignSelf: 'flex-start', borderRadius: 99, borderWidth: 1, backgroundColor: 'rgba(5,10,10,0.56)', paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 7 }, pillDot: { width: 6, height: 6, borderRadius: 3 }, pillText: { fontSize: 11, letterSpacing: 1.05, fontWeight: '700' },
  miniFact: { minWidth: 70 }, miniFactValue: { color: colors.bone, fontSize: 13, fontWeight: '600' }, miniFactLabel: { color: colors.muted, fontSize: 11, marginTop: 3 }, miniFactValueOnImage: { color: colors.onImage }, miniFactLabelOnImage: { color: colors.onImageMuted },
  primaryButton: { minHeight: 56, borderRadius: radii.control, backgroundColor: colors.accent, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: colors.shadow, shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } }, primaryButtonDisabled: { backgroundColor: colors.panelRaised, shadowOpacity: 0 }, primaryButtonText: { color: colors.onImage, fontSize: 15, fontWeight: '700' }, primaryButtonTextDisabled: { color: colors.muted },
  secondaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }, secondaryButtonText: { color: colors.bone, fontSize: 14, fontWeight: '600' }, pressed: { opacity: 0.74, transform: [{ scale: 0.992 }] },
  inviteScreen: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 64, paddingBottom: 50 }, invalidInviteScreen: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: 22, paddingBottom: 50, gap: 20 }, inviteHeadline: { color: colors.bone, fontFamily: editorialFont, fontSize: 39, lineHeight: 44, fontWeight: '700', letterSpacing: -1.1, marginTop: 12 }, invitePromiseCard: { borderRadius: radii.hero, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 20, marginTop: 26 }, inviteTitle: { color: colors.bone, fontFamily: editorialFont, fontSize: 29, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5, marginTop: 12 }, invitePromise: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 9 }, inviteTrustCard: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, borderLeftWidth: 3, borderLeftColor: colors.accent, backgroundColor: colors.panel, padding: 17, marginVertical: 20 }, inviteTrustTitle: { color: colors.accent, fontSize: 14, fontWeight: '700' }, inviteTrustBody: { color: colors.muted, fontSize: 11, lineHeight: 18, marginTop: 6 }, inviteNameInput: { minHeight: 54, borderRadius: radii.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, color: colors.bone, paddingHorizontal: 16, fontSize: 16, marginBottom: 15 }, invitePrototypeNote: { color: colors.muted, fontSize: 11, lineHeight: 15, textAlign: 'center', marginTop: 14 }, unavailableInvite: { borderRadius: radii.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 17 }, unavailableInviteTitle: { color: colors.bone, fontSize: 14, fontWeight: '700' }, unavailableInviteBody: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 6 },
  whyButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }, whyButtonText: { color: colors.muted, fontSize: 13 }, whyPanel: { borderRadius: 18, backgroundColor: colors.accentSoft, padding: 15, gap: 8 }, whyReason: { color: colors.bone, fontSize: 12, lineHeight: 18 }, proofNote: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 }, feedbackActions: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, feedbackDivider: { width: 1, height: 18, backgroundColor: colors.line, marginHorizontal: 8 }, quietAction: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }, quietActionText: { color: colors.muted, fontSize: 12 },
  momentMakerCard: { marginTop: 18, paddingHorizontal: 3, paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.softLine }, momentMakerHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 11 }, momentMakerEyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 1.1, fontWeight: '700' }, momentMakerTitle: { color: colors.bone, fontSize: 18, lineHeight: 24, fontWeight: '600', marginTop: 7 }, momentMakerBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 4 },
  spaceCard: { marginTop: 16, minHeight: 90, borderRadius: 25, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: colors.shadow, shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } }, spaceIcon: { width: 45, height: 45, borderRadius: 23, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginRight: 13 }, spaceTitle: { color: colors.bone, fontSize: 17, fontWeight: '600' }, spaceBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  daySummary: { marginBottom: 28, paddingLeft: 2, maxWidth: 430 }, daySummaryEyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 1.15, fontWeight: '700' }, daySummaryBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5 }, timeline: { gap: 0 }, timelineRow: { width: '100%' }, timelineContent: { paddingBottom: 25 }, dayMomentHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10, paddingHorizontal: 2 }, dayMomentMark: { width: 20, height: 3, borderRadius: 2 }, timelineTime: { color: colors.muted, fontSize: 11, letterSpacing: 1.05, fontWeight: '700' }, dayCardImage: { justifyContent: 'flex-end', borderRadius: radii.card, overflow: 'hidden', shadowColor: colors.shadow, shadowOpacity: 0.10, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } }, dayCardImagePrimary: { minHeight: 260 }, dayCardImageSecondary: { minHeight: 172 }, dayCardImageStyle: { borderRadius: radii.card }, dayCardCopy: { padding: 19, paddingTop: 50 }, dayCardTitle: { color: colors.onImage, fontSize: 25, lineHeight: 30, fontWeight: '700', fontFamily: editorialFont, letterSpacing: -0.4 }, dayCardPromise: { color: colors.onImageMuted, fontSize: 13, lineHeight: 19, marginTop: 7, maxWidth: 360 }, dayCardMeta: { color: colors.onImage, fontSize: 11, lineHeight: 16, fontWeight: '600' }, quietDay: { paddingVertical: 18, borderTopWidth: 1, borderTopColor: colors.softLine, marginTop: 2 }, quietDayTitle: { color: colors.bone, fontSize: 15, fontWeight: '700' }, quietDayBody: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  calendarWindows: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, borderLeftWidth: 3, borderLeftColor: colors.gold, backgroundColor: colors.panel, padding: 16, marginBottom: 16, gap: 9 }, calendarWindowText: { color: colors.bone, fontSize: 11, lineHeight: 17, fontWeight: '600' },
  intentPanel: { borderRadius: radii.hero, backgroundColor: colors.panel, padding: 20, shadowColor: colors.shadow, shadowOpacity: 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: 7 } }, fieldLabel: { color: colors.accent, fontSize: 11, letterSpacing: 1.15, fontWeight: '700', marginTop: 8, marginBottom: 12 }, chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 }, choiceChip: { minHeight: 44, borderRadius: 99, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panelRaised, paddingHorizontal: 15, paddingVertical: 11, justifyContent: 'center' }, choiceChipSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft }, choiceChipText: { color: colors.muted, fontSize: 13, fontWeight: '600' }, choiceChipTextSelected: { color: colors.bone }, intentInput: { minHeight: 88, borderRadius: radii.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.ink, color: colors.bone, fontSize: 16, lineHeight: 23, padding: 16, textAlignVertical: 'top', marginBottom: 10 }, intentExamples: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 16 }, intentExample: { minHeight: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.softLine, paddingHorizontal: 12, justifyContent: 'center' }, intentExampleText: { color: colors.muted, fontSize: 11, fontWeight: '600' }, orRow: { flexDirection: 'row', alignItems: 'center', marginTop: 13 }, orLine: { flex: 1, height: 1, backgroundColor: colors.line }, orText: { color: colors.muted, fontSize: 11, fontWeight: '600', marginHorizontal: 12 }, intentPrivacy: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 10 }, interpretation: { borderRadius: radii.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 15, marginBottom: 24 }, interpretationLabel: { color: colors.accent, fontSize: 11, letterSpacing: 1.15, fontWeight: '700' }, interpretationText: { color: colors.bone, fontSize: 13, lineHeight: 19, marginTop: 7 }, sectionLabel: { color: colors.accent, fontSize: 11, letterSpacing: 1.15, fontWeight: '700', marginTop: 8, marginBottom: 10 }, experienceTile: { marginBottom: 20 }, tileImage: { minHeight: 210, justifyContent: 'flex-end' }, tileImageLarge: { minHeight: 300 }, tileImageStyle: { borderRadius: radii.card }, generatedTileBadge: { position: 'absolute', right: 14, top: 14, borderRadius: 99, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(11,14,13,0.82)', paddingHorizontal: 11, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }, generatedTileBadgeText: { color: colors.onImageAccent, fontSize: 11, letterSpacing: 1, fontWeight: '700' }, tileCopy: { padding: 18 }, tileTitle: { color: colors.onImage, fontSize: 27, lineHeight: 32, fontWeight: '700', fontFamily: editorialFont, letterSpacing: -0.5, marginTop: 12 }, tilePromise: { color: colors.onImageMuted, fontSize: 13, lineHeight: 19, marginTop: 7 }, tileMeta: { color: colors.onImage, fontSize: 11, lineHeight: 16, fontWeight: '600' }, generatedJourneyCard: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, borderLeftWidth: 3, borderLeftColor: colors.accent, backgroundColor: colors.panel, padding: 16, marginTop: -7, marginBottom: 20 }, generatedJourneyHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }, generatedJourneyEyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 1.15, fontWeight: '700' }, generatedJourneyTitle: { color: colors.bone, fontSize: 17, fontWeight: '700', marginTop: 5 }, generatedJourneyCount: { color: colors.muted, fontSize: 11, marginTop: 2 }, generatedJourneyStages: { marginTop: 14 }, generatedJourneyStage: { minHeight: 62, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }, generatedJourneyNumber: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, generatedJourneyNumberText: { color: colors.bone, fontSize: 11 }, generatedJourneyStageTitle: { color: colors.bone, fontSize: 12, fontWeight: '700' }, generatedJourneyStageBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 }, generatedJourneyCoverage: { color: colors.muted, fontSize: 11, lineHeight: 16, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 11 }, finiteNote: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 2 },
  clarificationPanel: { borderRadius: radii.hero, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 20 }, clarificationTitle: { color: colors.bone, fontFamily: editorialFont, fontSize: 30, lineHeight: 36, fontWeight: '700', marginTop: 13 }, clarificationBody: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10 }, intentQuote: { color: colors.accentText, fontFamily: editorialItalicFont, fontSize: 16, lineHeight: 23, fontWeight: '600', marginTop: 12 }, clarificationOptions: { gap: 9, marginTop: 24, marginBottom: 18 }, clarificationOption: { minHeight: 58, borderRadius: radii.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panelRaised, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }, clarificationOptionText: { color: colors.bone, fontSize: 15, fontWeight: '600', flex: 1 },
  generationCard: { minHeight: 74, borderRadius: 22, borderWidth: 1, borderColor: colors.accentLine, backgroundColor: colors.accentSoft, padding: 15, marginBottom: 22, flexDirection: 'row', alignItems: 'center', gap: 12 }, generationMark: { width: 34, color: colors.accent, fontSize: 18, fontWeight: '700', textAlign: 'center' }, generationTitle: { color: colors.bone, fontSize: 14, fontWeight: '700' }, generationBody: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 4 }, generationDisclosure: { borderRadius: 18, borderWidth: 1, borderColor: colors.accentLine, backgroundColor: colors.accentSoft, padding: 14, marginTop: -8, marginBottom: 20 }, generationDisclosureLabel: { color: colors.accent, fontSize: 11, letterSpacing: 1.15, fontWeight: '700' }, generationDisclosureBody: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 6 },
  lifeSummary: { flexDirection: 'row', alignItems: 'baseline', paddingBottom: 18, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.softLine }, lifeSummaryBig: { color: colors.accent, fontSize: 32, fontWeight: '400', marginRight: 10 }, lifeSummaryTitle: { color: colors.muted, fontSize: 12, lineHeight: 18, flex: 1 }, memoryGrid: { gap: 12 }, memoryCard: { minHeight: 246 }, memoryCardCompact: { minHeight: 176 }, memoryImage: { minHeight: 246, justifyContent: 'flex-end' }, memoryImageCompact: { minHeight: 176 }, memoryImageStyle: { borderRadius: radii.card }, memoryCopy: { padding: 18 }, memoryDate: { color: colors.onImageAccent, fontSize: 11, letterSpacing: 1.05, fontWeight: '700' }, memoryTitle: { color: colors.onImage, fontFamily: editorialFont, fontSize: 27, lineHeight: 32, fontWeight: '700', letterSpacing: -0.4, marginTop: 7 }, memoryTitleCompact: { fontSize: 22, lineHeight: 27 }, memoryNote: { color: colors.onImageMuted, fontSize: 12, lineHeight: 18, marginTop: 6 }, memoryMeaning: { color: colors.onImageAccent, fontSize: 11, lineHeight: 16, fontWeight: '600', marginTop: 9 }, memoryShared: { color: colors.onImageAccent, fontSize: 11, lineHeight: 16, marginTop: 8 }, learningCard: { padding: 18, marginTop: 22, borderTopWidth: 1, borderTopColor: colors.softLine }, learningTitle: { color: colors.accent, fontSize: 13, fontWeight: '700' }, learningBody: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 7 }, learningAction: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', marginTop: 8 }, learningActionText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  bottomNav: { position: 'absolute', left: 18, right: 18, bottom: 12, minHeight: 70, borderRadius: radii.card, borderWidth: 1, borderColor: colors.softLine, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, shadowColor: colors.shadow, shadowOpacity: 0.10, shadowRadius: 20, shadowOffset: { width: 0, height: 9 } }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 56, borderRadius: radii.control, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}) }, navIconShell: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, navIconShellActive: { backgroundColor: colors.accentSoft }, navLabel: { color: colors.muted, fontSize: 11, fontWeight: '600' }, navActive: { color: colors.accent },
  backButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginBottom: 10, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(252,250,245,0.90)' }, backButtonText: { color: colors.bone, fontSize: 13, fontWeight: '600' }, detailHero: { height: 390, justifyContent: 'flex-end', marginHorizontal: -20, marginTop: -62, marginBottom: 26 }, detailHeroImage: { borderBottomLeftRadius: radii.hero, borderBottomRightRadius: radii.hero }, detailHeroCopy: { padding: 22, paddingTop: 112 }, detailTitle: { color: colors.onImage, fontSize: 38, lineHeight: 43, fontWeight: '700', fontFamily: editorialFont, letterSpacing: -1, marginTop: 13 }, detailPromise: { color: colors.onImageMuted, fontSize: 15, lineHeight: 22, marginTop: 10 }, wonderHeadline: { color: colors.accent, fontSize: 11, letterSpacing: 1.35, fontWeight: '700' }, wonderLarge: { color: colors.bone, fontSize: 20, lineHeight: 28, fontWeight: '600', fontFamily: editorialFont, marginTop: 9 }, factStrip: { flexDirection: 'row', gap: 14, borderWidth: 1, borderColor: colors.line, borderRadius: radii.control, backgroundColor: colors.panel, paddingHorizontal: 14, paddingVertical: 15, marginVertical: 20 },
  liveEvidenceCard: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, borderLeftWidth: 3, borderLeftColor: colors.accent, backgroundColor: colors.panel, padding: 16, gap: 12, marginBottom: 20 }, liveEvidenceTitle: { color: colors.accent, fontSize: 11, letterSpacing: 1.35, fontWeight: '700' }, liveEvidenceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, liveEvidenceDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, marginTop: 5 }, liveEvidenceLabel: { color: colors.bone, fontSize: 12, lineHeight: 17, fontWeight: '600' }, liveEvidenceMeta: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 3 }, liveEvidenceCaution: { color: colors.muted, fontSize: 11, lineHeight: 15, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }, expiredEvidenceCard: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 15, marginBottom: 20 }, expiredEvidenceText: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 7 },
  blueprintBadge: { minHeight: 64, borderRadius: radii.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 13, marginTop: -6, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 11 }, blueprintBadgeMark: { color: colors.accent, fontSize: 18 }, blueprintBadgeTitle: { color: colors.bone, fontSize: 13, fontWeight: '700' }, blueprintBadgeBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  meaningThreadCard: { borderRadius: radii.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 16, marginBottom: 20 }, meaningThreadCompact: { marginTop: 14, marginBottom: 2 }, meaningThreadEyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 1.25, fontWeight: '700' }, meaningThreadLabel: { color: colors.bone, fontFamily: editorialFont, fontSize: 18, lineHeight: 24, fontWeight: '600', marginTop: 8 }, meaningThreadReason: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 7 },
  flowTitle: { color: colors.bone, fontSize: 38, lineHeight: 43, fontWeight: '700', fontFamily: editorialFont, letterSpacing: -1 },
  expectationCard: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 18, marginTop: 22 }, expectationLabel: { color: colors.accent, fontSize: 11, letterSpacing: 1.45, fontWeight: '700' }, expectationTitle: { color: colors.bone, fontSize: 22, lineHeight: 29, fontWeight: '600', marginTop: 9 }, expectationBody: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8 },
  prepareExpectationCard: { minHeight: 300, borderRadius: radii.hero, overflow: 'hidden', justifyContent: 'flex-end', marginTop: 24, marginBottom: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel },
  prepareExpectationImage: { borderRadius: radii.hero },
  prepareExpectationCopy: { padding: 20, paddingTop: 92 },
  prepareExpectationLabel: { color: colors.onImageAccent, fontSize: 11, letterSpacing: 1.45, fontWeight: '700' },
  prepareExpectationTitle: { color: colors.onImage, fontSize: 22, lineHeight: 29, fontWeight: '600', marginTop: 9 },
  prepareExpectationBody: { color: colors.onImageMuted, fontSize: 15, lineHeight: 22, marginTop: 9, maxWidth: 410 },
  prepareLiveCard: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, borderLeftWidth: 3, borderLeftColor: colors.accent, backgroundColor: colors.panel, padding: 16, gap: 12, marginTop: 14, marginBottom: 22 }, prepareLiveRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  editorialDepthCard: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 16, marginTop: 14, marginBottom: 22 }, editorialDepthText: { color: colors.bone, fontSize: 16, lineHeight: 23, fontWeight: '600', marginTop: 8 }, editorialDepthSource: { color: colors.muted, fontSize: 11, lineHeight: 14, marginTop: 8 },
  readySummary: { minHeight: 74, borderRadius: radii.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panelRaised, padding: 15, marginBottom: 22, flexDirection: 'row', alignItems: 'center', gap: 12 },
  readySummaryLabel: { color: colors.accent, fontSize: 11, letterSpacing: 1.1, fontWeight: '700' }, readySummaryTitle: { color: colors.bone, fontSize: 14, lineHeight: 20, marginTop: 5 }, adjustButton: { minHeight: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' }, adjustButtonText: { color: colors.bone, fontSize: 12, fontWeight: '700' },
  sharedPlanCard: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 16, marginTop: -10, marginBottom: 22 }, sharedPlanTitle: { color: colors.bone, fontSize: 19, lineHeight: 25, fontWeight: '600', marginTop: 8, marginBottom: 14 }, participantList: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, marginBottom: 14 }, participantRow: { flexDirection: 'row', alignItems: 'center', minHeight: 52 }, participantAvatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, participantAvatarReady: { borderColor: colors.accent, backgroundColor: colors.accentSoft }, participantAvatarText: { color: colors.bone, fontSize: 12, fontWeight: '700' }, participantName: { color: colors.bone, fontSize: 13, fontWeight: '700' }, participantStatus: { color: colors.muted, fontSize: 11, lineHeight: 14, marginTop: 2 }, localSharedNote: { color: colors.muted, fontSize: 11, lineHeight: 14, marginTop: 8 }, sharedReadinessTitle: { color: colors.accent, fontSize: 11, letterSpacing: 1.2, fontWeight: '700', marginTop: 18, marginBottom: 7 }, sharedReadinessRow: { minHeight: 42, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', alignItems: 'center' }, sharedReadinessMark: { width: 28, color: colors.muted, fontSize: 17 }, sharedReadinessLabel: { color: colors.bone, fontSize: 12 },
  shareCard: { minHeight: 82, borderRadius: radii.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panelRaised, padding: 14, flexDirection: 'row', alignItems: 'center' }, shareMark: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, shareTitle: { color: colors.bone, fontSize: 15, fontWeight: '700' }, shareBody: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 3 }, shareStatus: { color: colors.accent, fontSize: 11, lineHeight: 14, marginTop: 10 }, stopSharingButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center', marginTop: 6 }, stopSharingText: { color: colors.muted, fontSize: 11, textDecorationLine: 'underline' },
  guideDepthList: { gap: 9, marginBottom: 22 }, guideDepthChoice: { minHeight: 66, borderRadius: radii.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }, guideDepthChoiceSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft }, guideDepthTitle: { color: colors.bone, fontSize: 14, fontWeight: '700' }, guideDepthBody: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 4 }, guidePreviewCard: { borderRadius: radii.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 16, marginTop: -8, marginBottom: 24 }, guidePreviewTitle: { color: colors.bone, fontSize: 17, lineHeight: 23, fontWeight: '600', marginTop: 8 }, guidePreviewBody: { color: colors.bone, fontSize: 12, lineHeight: 18, marginTop: 8 }, guidePreviewSource: { color: colors.muted, fontSize: 11, lineHeight: 14, marginTop: 10 },
  prepareCard: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 17, gap: 13, marginBottom: 24 }, prepareRow: { flexDirection: 'row', alignItems: 'center', minHeight: 26 }, prepareBullet: { width: 6, height: 6, borderRadius: 3, marginRight: 12 }, stepNumber: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 13 }, stepNumberText: { color: colors.bone, fontSize: 12 }, prepareText: { color: colors.bone, fontSize: 14, lineHeight: 20, flex: 1 }, commitmentCard: { borderRadius: radii.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panelRaised, padding: 16, marginBottom: 22 }, commitmentLabel: { color: colors.accent, fontSize: 11, letterSpacing: 1.3, fontWeight: '700' }, commitmentValue: { color: colors.bone, fontSize: 17, fontWeight: '600', marginTop: 7 }, commitmentBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  routePlanCard: { borderRadius: 22, borderWidth: 1, borderColor: 'rgba(217,179,107,0.35)', backgroundColor: 'rgba(217,179,107,0.05)', padding: 16, marginBottom: 20 }, routePlanTitle: { color: colors.bone, fontSize: 20, lineHeight: 25, marginTop: 8 }, routeBudget: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 }, routeEstimate: { color: colors.accentText, fontSize: 11, lineHeight: 16, marginTop: 13 }, routeWindow: { color: colors.bone, fontSize: 11, lineHeight: 17, marginTop: 7 }, routeGuard: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 14, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 }, arrivalPlanCard: { borderRadius: 17, borderWidth: 1, borderColor: colors.accentLine, backgroundColor: colors.accentSoft, padding: 14, marginTop: 14 }, arrivalPlanLabel: { color: colors.accent, fontSize: 11, letterSpacing: 1.4, fontWeight: '700' }, arrivalPlanTitle: { color: colors.bone, fontSize: 16, fontWeight: '700', marginTop: 6 }, arrivalPlanBody: { color: colors.bone, fontSize: 11, lineHeight: 17, marginTop: 7 }, arrivalPlanMeta: { color: colors.accent, fontSize: 11, marginTop: 9 }, arrivalPlanReturn: { color: colors.muted, fontSize: 11, lineHeight: 14, marginTop: 6 }, routeRecheck: { color: colors.muted, fontSize: 11, lineHeight: 14, marginTop: 8 }, handoffStatus: { color: colors.accentText, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 10, maxWidth: 360 },
  placeKnowledgeCard: { borderRadius: 22, borderWidth: 1, borderColor: colors.accentLine, backgroundColor: colors.accentSoft, padding: 17, marginBottom: 20 }, placeKnowledgeLabel: { color: colors.accent, fontSize: 11, letterSpacing: 1.35, fontWeight: '700' }, placeKnowledgeTitle: { color: colors.bone, fontSize: 20, lineHeight: 25, fontWeight: '700', marginTop: 8 }, placeKnowledgeBody: { color: colors.bone, fontSize: 12, lineHeight: 19, marginTop: 9 }, placeKnowledgeSource: { fontSize: 11, fontWeight: '700', marginTop: 12 },
  presenceScreen: { flex: 1, padding: 20, paddingTop: 14, paddingBottom: 18, backgroundColor: colors.ink },
  presenceBackdrop: { opacity: 0.34 },
  presenceTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', zIndex: 2 }, presenceActions: { flexDirection: 'row', alignItems: 'center', gap: 8 }, guideButton: { minHeight: 44, paddingHorizontal: 15, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,253,248,0.18)', backgroundColor: colors.darkGlass, alignItems: 'center', justifyContent: 'center' }, guideButtonText: { color: colors.onImage, fontSize: 12, fontWeight: '700' }, phoneAwayButton: { minHeight: 44, paddingHorizontal: 15, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(231,201,158,0.52)', backgroundColor: colors.darkGlass, alignItems: 'center', justifyContent: 'center' }, phoneAwayButtonText: { color: colors.onImageAccent, fontSize: 12, fontWeight: '700' },
  presenceStage: { width: '100%', maxWidth: 470, alignItems: 'center', borderRadius: 30, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(252,250,245,0.94)', paddingHorizontal: 22, paddingVertical: 28, shadowColor: colors.shadow, shadowOpacity: 0.22, shadowRadius: 28, shadowOffset: { width: 0, height: 14 } },
  presenceTitle: { color: colors.bone, fontSize: 38, lineHeight: 43, fontWeight: '700', fontFamily: editorialFont, textAlign: 'center', letterSpacing: -0.7 }, presenceCue: { color: colors.muted, fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 390, marginTop: 16 }, presenceUnit: { color: colors.muted, fontSize: 11, letterSpacing: 1.15, fontWeight: '600' }, presenceFooter: { color: colors.onImageMuted, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 9 },
  presenceFooterPanel: { paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(246,242,234,0.08)' },
  phoneAwayScreen: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000' }, phoneAwayEyebrow: { color: colors.gold, fontSize: 11, letterSpacing: 2.2, fontWeight: '700' }, phoneAwayTitle: { color: colors.onImage, fontSize: 28, lineHeight: 34, fontWeight: '700', fontFamily: editorialFont, textAlign: 'center', marginTop: 14 }, phoneAwayCue: { color: colors.onImageMuted, fontSize: 15, textAlign: 'center', marginTop: 14 }, phoneAwayTimer: { color: colors.onImage, fontSize: 56, fontWeight: '200', fontVariant: ['tabular-nums'] }, phoneAwayGlow: { width: 198, height: 198, borderRadius: 99, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 34, shadowOpacity: 0.5, shadowRadius: 46, shadowOffset: { width: 0, height: 0 } }, phoneAwayTogether: { color: colors.onImageAccent, fontSize: 11, marginTop: 20 }, phoneAwayBody: { color: colors.onImageMuted, fontSize: 11, lineHeight: 17, textAlign: 'center', maxWidth: 300, marginTop: 26 }, reopenGuide: { minHeight: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', marginTop: 26 }, reopenGuideText: { color: colors.bone, fontSize: 13, fontWeight: '700' },
  capsuleProgress: { flexDirection: 'row', gap: 5, marginTop: 12, marginBottom: 2, zIndex: 2 }, capsuleProgressPart: { height: 3, flex: 1, borderRadius: 2, backgroundColor: 'rgba(246,242,234,0.14)' },
  capsuleStep: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }, capsuleStepCount: { color: colors.muted, fontSize: 11, lineHeight: 16, marginBottom: 18 }, presenceTogetherCard: { width: '100%', maxWidth: 430, minHeight: 68, borderRadius: radii.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panelRaised, padding: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }, presenceTogetherAvatars: { flexDirection: 'row', marginRight: 11 }, presenceTogetherAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center', marginRight: -6 }, presenceTogetherTitle: { color: colors.bone, fontSize: 13, fontWeight: '700' }, presenceTogetherBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  stepMetaPill: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 13, paddingVertical: 8, marginTop: 18 }, stepMetaText: { color: colors.bone, fontSize: 11, fontWeight: '600' },
  stepTimer: { width: 205, height: 205, borderRadius: 103, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginTop: 32 }, stepTimerValue: { color: colors.bone, fontSize: 48, fontWeight: '200', fontVariant: ['tabular-nums'] }, timerControl: { marginTop: 13, minHeight: 35, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }, timerControlText: { color: colors.bone, fontSize: 11, fontWeight: '700' },
  quietStepOrb: { width: 130, height: 130, borderRadius: 65, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 34 },
  memoryPreview: { minHeight: 268, justifyContent: 'flex-end', marginVertical: 26 }, memoryPreviewTitle: { color: colors.onImage, fontFamily: editorialFont, fontSize: 29, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5, padding: 18 }, sharedMemoryCard: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, borderLeftWidth: 3, borderLeftColor: colors.accent, backgroundColor: colors.panel, padding: 16, marginBottom: 16 }, sharedMemoryTitle: { color: colors.bone, fontSize: 17, fontWeight: '700', marginTop: 8 }, sharedMemoryBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5 }, meaningTraceCard: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 16, marginBottom: 16 }, meaningTraceTitle: { color: colors.bone, fontSize: 15, lineHeight: 21, fontWeight: '600', marginTop: 8 }, meaningTraceBody: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 7 }, memoryInput: { minHeight: 116, borderRadius: radii.control, borderWidth: 1, borderColor: colors.line, color: colors.bone, fontSize: 16, lineHeight: 23, padding: 16, textAlignVertical: 'top', marginBottom: 16, backgroundColor: colors.panel },
  memoryOutcomeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }, learningDisclosure: { minHeight: 70, borderRadius: radii.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 15, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }, learningDisclosureTitle: { color: colors.bone, fontSize: 14, fontWeight: '700' }, learningDisclosureBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  profileCard: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, marginTop: 28, overflow: 'hidden' }, profileRow: { minHeight: 58, borderBottomWidth: 1, borderBottomColor: colors.line, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, profileLabel: { color: colors.muted, fontSize: 12 }, profileValue: { color: colors.bone, fontSize: 12, fontWeight: '600' },
  labDisclosure: { minHeight: 74, borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 15, marginTop: 26, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }, labDisclosureTitle: { color: colors.bone, fontSize: 15, fontWeight: '700' }, labDisclosureBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 }, blueprintTrust: { color: colors.accent, fontSize: 11, lineHeight: 17, marginTop: 8 },
  profileChoiceList: { gap: 8, marginBottom: 24 }, profileChoice: { minHeight: 64, borderRadius: 18, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11 }, profileChoiceSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft }, profileChoiceTitle: { color: colors.bone, fontSize: 15, fontWeight: '600' }, profileChoiceBody: { color: colors.muted, fontSize: 11, marginTop: 4 }, profileChoiceMark: { color: colors.accent, fontSize: 14, marginLeft: 12 },
  liveControlCard: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, borderLeftWidth: 3, borderLeftColor: colors.accent, backgroundColor: colors.panel, padding: 17, marginTop: 22 }, liveControlMessage: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 6, marginBottom: 14 }, sourceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 11 }, sourceState: { width: 8, height: 8, borderRadius: 4, marginTop: 4 }, sourceLive: { backgroundColor: colors.accent }, sourceError: { backgroundColor: colors.danger }, sourceWaiting: { backgroundColor: colors.gold }, sourceName: { color: colors.bone, fontSize: 12, fontWeight: '600' }, sourceDetail: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 2 }, liveControlActions: { marginTop: 12 }, sourcePrivacy: { color: colors.muted, fontSize: 11, lineHeight: 14, textAlign: 'center' }, futureSources: { marginTop: 24 }, futureSourceRow: { minHeight: 42, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, futureSourceLabel: { color: colors.muted, fontSize: 12 }, futureSourceState: { color: colors.accentText, fontSize: 11, letterSpacing: 1.2, fontWeight: '700' },
  timelineRowPast: { opacity: 0.58 },
  discoveryCanvas: { minHeight: 260, justifyContent: 'flex-end', marginBottom: -34 }, discoveryCanvasImage: { borderRadius: radii.hero }, discoveryCanvasCopy: { padding: 20, paddingBottom: 66 }, discoveryCanvasLabel: { color: colors.onImageAccent, fontSize: 11, letterSpacing: 1.3, fontWeight: '800' }, discoveryCanvasTitle: { color: colors.onImage, fontSize: 28, lineHeight: 33, letterSpacing: -0.6, fontWeight: '700', fontFamily: editorialFont, marginTop: 10 }, discoveryCanvasBody: { color: colors.onImageMuted, fontSize: 13, lineHeight: 19, marginTop: 8, maxWidth: 420 },
  lifeLandscape: { padding: 18, marginBottom: 12, borderRadius: radii.card, borderWidth: 1, borderColor: colors.softLine, backgroundColor: colors.panel }, lifeSummaryEyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 1.2, fontWeight: '800' }, lifeSummaryHeadline: { color: colors.bone, fontFamily: editorialFont, fontSize: 24, lineHeight: 30, fontWeight: '700', marginTop: 8 }, lifeThemeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 }, lifeTheme: { borderRadius: 99, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panelRaised, paddingHorizontal: 11, paddingVertical: 7 }, lifeThemeText: { color: colors.bone, fontSize: 11, fontWeight: '600' },
  capsuleShapeCard: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.softLine, backgroundColor: colors.panel, padding: 17, marginBottom: 20 }, capsuleShapeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, capsuleShapeLabel: { color: colors.accent, fontSize: 11, letterSpacing: 1.25, fontWeight: '800' }, capsuleShapeTitle: { color: colors.bone, fontFamily: editorialFont, fontSize: 21, lineHeight: 27, fontWeight: '700', marginTop: 7 }, capsuleShapeRail: { flexDirection: 'row', gap: 8, marginTop: 17 }, capsuleShapeStep: { flex: 1, minHeight: 92, borderRadius: radii.control, backgroundColor: colors.panelRaised, padding: 11 }, capsuleShapeNumber: { width: 25, height: 25, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, capsuleShapeNumberText: { color: colors.bone, fontSize: 11, fontWeight: '700' }, capsuleShapeStepText: { color: colors.bone, fontSize: 11, lineHeight: 15, fontWeight: '600', marginTop: 8 }, capsuleShapeNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 14 },
  calendarControlCard: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, borderLeftWidth: 3, borderLeftColor: colors.gold, backgroundColor: colors.panel, padding: 17, marginTop: 22, gap: 9 },
  flowScreen: { flex: 1 },
  flowScrollStickyAction: { paddingBottom: 136 },
  stickyActionBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18, backgroundColor: colors.ink, borderTopWidth: 1, borderTopColor: colors.softLine },
  pendingHeroPill: { minHeight: 48, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.accentLine, backgroundColor: colors.accentSoft, paddingHorizontal: 15, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  pendingHeroPillText: { color: colors.bone, fontSize: 12, fontWeight: '700' },
  pendingHeroPillBody: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 2 },
  pendingHeroPillAction: { color: colors.accentText, fontSize: 12, fontWeight: '700' },
  iconMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  calendarWindowRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  generationMarkIcon: { width: 34, textAlign: 'center' },
});
