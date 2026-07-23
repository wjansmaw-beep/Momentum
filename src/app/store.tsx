import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useFonts } from 'expo-font';
import { Fraunces_500Medium, Fraunces_500Medium_Italic, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import {
  byId,
  Experience,
  ExperienceKind,
  experiences,
  Surface,
} from '../product/experienceModel';
import { composeContextualBlueprints } from '../product/experienceBlueprintComposer';
import {
  buildToday,
  Company,
  defaultPrototypeContext,
  PersonalLearningContext,
  PrototypeContext,
  rankForMoment,
  TodayDecision,
  TransportMode,
} from '../product/localIntelligence';
import {
  applyLearning,
  applyReflection,
  completeOnboarding,
  defaultPersonalProfile,
  directionTerms,
  experienceKindLabels,
  forgetLearningEvent,
  forgetReflection,
  hydratePersonalProfile,
  LearningOutcome,
  PersonalProfile,
  ReflectionInput,
  resetLearning,
} from '../profile/personalModel';
import {
  Coordinates,
  LiveWorldSnapshot,
  loadLiveWorld,
  loadPlaceContext,
  overlayVerifiedWorldContext,
} from '../liveworld/liveWorld';
import { composeLivingWorldOpportunities, opportunityToExperience, OpportunityEngineResult } from '../liveworld/opportunityEngine';
import { applyPlaceKnowledgeLens, attachNearestPlaceKnowledge } from '../liveworld/placeKnowledgeLens';
import {
  CalendarContextSnapshot,
  emptyCalendarContext,
  loadCalendarContext,
} from '../context/calendarContext';
import { clearLiveWorldCache, loadLiveWorldCache, saveLiveWorldCache, snapshotAgeMinutes } from '../liveworld/liveCache';
import { createWorldContext, ResolvedContentCatalog, resolveContentCatalog } from '../content/contentCatalog';
import {
  clearInviteFromCurrentUrl,
  readInviteFromCurrentUrl,
  SharedCapsuleInvite,
  SharedCapsuleState,
  sharedStateFromInvite,
  SharedInviteReadResult,
} from '../sharing/sharedCapsule';
import { GuideDepth } from '../guidance/experienceGuide';
import { composeGuideMoments } from '../guidance/guideComposer';
import { auditCandidatePool, CompositionSummary } from '../guidance/compositionAudit';
import { colors } from '../design/theme';
import { appFont } from '../ui/styles/appStyles';
import { notificationSuccess } from '../design/haptics';
import { attachMeaningThread } from '../product/meaningThread';
import { generateContextualSuggestion, GeneratorRuntimeStatus, inspectGeneratorRuntime } from '../product/generativeExperience';
import { GeneratorEvaluationSignal as GenerationEvaluationSignal, GeneratorEvaluationTrial, generatorEvaluationPlan } from '../product/generatorEvaluation';

// Gedeelde app-state (ADR-058): alle state, hooks en businesslogica die voorheen
// in App.tsx leefden, verhuisd naar één kleine store achter React-context.
// Schermen lezen deze store en sturen navigatie zelf aan; de vroegere
// surface/flowStage-stringstatemachine is als navigatiemechanisme vervallen.

export type FlowStage = 'invite' | 'prepare' | 'presence' | 'remember' | 'profile' | null;
export type Memory = { id: string; title: string; date: string; image: string; note: string; sharedWith?: string[]; meaning?: string; experienceSnapshot?: Experience };
export type ActiveSession = { experienceId: string; experienceSnapshot?: Experience; stage: 'prepare' | 'presence'; stepIndex: number; origin: Surface; company?: Company; transport?: TransportMode; guideDepth?: GuideDepth; shared?: SharedCapsuleState; updatedAt: string };
export type GenerationKindEvidence = { shown: number; evaluated: number; personal: number; surprising: number; executable: number; contentUseful: number };
export type PrototypeEvidence = {
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
export type ContextualSuggestionCache = { signature: string; expiresAt: string; experiences: Experience[] };

export const memoryKey = 'momentum.memories.v2';
export const contextKey = 'momentum.prototype-context.v1';
export const personalProfileKey = 'momentum.personal-profile.v1';
export const activeSessionKey = 'momentum.active-session.v1';
export const evidenceKey = 'momentum.prototype-evidence.v1';
export const contextualSuggestionKey = 'momentum.contextual-suggestion.v1';
export const emptyGenerationSignals = (): Record<GenerationEvaluationSignal, number> => ({ personal: 0, surprising: 0, executable: 0, 'content-useful': 0 });
export const emptyKindEvidence = (): GenerationKindEvidence => ({ shown: 0, evaluated: 0, personal: 0, surprising: 0, executable: 0, contentUseful: 0 });
export const emptyGenerationByKind = (): Record<ExperienceKind, GenerationKindEvidence> => ({ outside: emptyKindEvidence(), food: emptyKindEvidence(), movement: emptyKindEvidence(), restore: emptyKindEvidence(), connect: emptyKindEvidence(), learn: emptyKindEvidence(), culture: emptyKindEvidence() });
export const emptyPrototypeEvidence = (): PrototypeEvidence => ({ started: 0, completed: 0, reflected: 0, skippedReflection: 0, generatedShown: 0, generatedRejected: 0, generatedEvaluated: 0, generationSignals: emptyGenerationSignals(), generationByKind: emptyGenerationByKind(), generationTrials: [] });
export const timeOptions = [15, 30, 60, 120];
export const dutchMonthNames = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
export const defaultRegion = { coordinates: { latitude: 53.325, longitude: 5.999 }, label: 'Dokkum' };
// Profiel-lab (evaluatie, dekkingsmatrix, proefbank) staat alleen aan achter een debug-vlag (ADR-057).
export const MOMENTUM_DEBUG = (globalThis as any).__DEV__ === true
  || (globalThis as any).process?.env?.EXPO_PUBLIC_MOMENTUM_DEBUG === '1';

export type AppStore = ReturnType<typeof useAppStore>;

const AppContext = createContext<AppStore | null>(null);

export function useApp(): AppStore {
  const store = useContext(AppContext);
  if (!store) throw new Error('useApp moet binnen AppProvider gebruikt worden');
  return store;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const store = useAppStore();
  return <AppContext.Provider value={store}>{children}</AppContext.Provider>;
}

function useAppStore() {
  const [displayFontsLoaded] = useFonts({ Fraunces_500Medium, Fraunces_500Medium_Italic, Fraunces_600SemiBold });
  // De uitnodiging in de start-URL is synchroon bekend (web) en bepaalt mede de
  // initiële route van de navigator; vandaar een luie initializer in plaats van
  // een mount-effect zoals voorheen. Gedrag blijft identiek.
  const [inviteRead] = useState<SharedInviteReadResult>(() => readInviteFromCurrentUrl());
  const [selected, setSelected] = useState<Experience>(byId('wadden-light'));
  const [origin, setOrigin] = useState<Surface>('now');
  const [prototypeContext, setPrototypeContext] = useState<PrototypeContext>(defaultPrototypeContext);
  const [contextHydrated, setContextHydrated] = useState(false);
  const [personalProfile, setPersonalProfile] = useState<PersonalProfile>(defaultPersonalProfile);
  const [personalHydrated, setPersonalHydrated] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [completedSession, setCompletedSession] = useState<ActiveSession | null>(null);
  const [incomingInvite, setIncomingInvite] = useState<SharedCapsuleInvite | null>(() =>
    inviteRead.state === 'valid' || inviteRead.state === 'expired' ? inviteRead.invite : null);
  const [inviteIssue, setInviteIssue] = useState<'invalid' | 'expired' | null>(() =>
    inviteRead.state === 'expired' ? 'expired' : inviteRead.state === 'invalid' ? 'invalid' : null);
  const [sharedDraft, setSharedDraft] = useState<SharedCapsuleState | null>(null);
  const [inviteGuestMode, setInviteGuestMode] = useState(false);
  const [evidence, setEvidence] = useState<PrototypeEvidence>(emptyPrototypeEvidence);
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const [evidenceHydrated, setEvidenceHydrated] = useState(false);
  const [liveWorld, setLiveWorld] = useState<LiveWorldSnapshot | null>(null);
  const [selectionLocationConfirmed, setSelectionLocationConfirmed] = useState(false);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveMessage, setLiveMessage] = useState('Live bronnen worden gecontroleerd…');
  const [calendarContext, setCalendarContext] = useState<CalendarContextSnapshot>(emptyCalendarContext);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  // ADR-059: bij openen kan een kleine kandidaat-set (2–3 concepten) arriveren
  // i.p.v. één concept. De hele set concurreert via de bestaande poort en
  // ranking; de hero-stabiliteit (pending-pill) werkt op setniveau.
  const [contextualSet, setContextualSet] = useState<Experience[]>([]);
  const [pendingContextualSet, setPendingContextualSet] = useState<Experience[] | null>(null);
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
  const contextualPrepared = useMemo(() => contextualSet.map((candidate) =>
    attachMeaningThread(composeGuideMoments(attachNearestPlaceKnowledge(overlayVerifiedWorldContext(candidate, selectionLocationConfirmed ? liveWorld ?? undefined : undefined), selectionLocationConfirmed ? liveWorld ?? undefined : undefined)), personalProfile)
  ), [contextualSet, liveWorld, personalProfile, selectionLocationConfirmed]);
  const compositionAudit = useMemo(() => auditCandidatePool([...contextualPrepared, ...baseCandidatePool]), [baseCandidatePool, contextualPrepared]);
  const candidatePool = compositionAudit.accepted.length ? compositionAudit.accepted : baseCandidatePool;
  const learningContext = useMemo<PersonalLearningContext>(() => ({
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
    // ADR-059, punt 2: de eindige alternatief-set groeit naar maximaal 5 opties
    // voor hetzelfde moment, via de ongewijzigde ranking. Nooit een feed: geen
    // oneindig laden, geen "meer zoals dit" — alleen deze rustige vijf.
    const items: Array<{ experience: Experience; decision: ReturnType<typeof rankForMoment> }> = [];
    const excluded: string[] = [];
    for (let index = 0; index < 5; index += 1) {
      const decision = rankForMoment(effectiveContext, '', excluded, candidatePool, learningContext);
      const experience = decision.selected?.experience;
      if (!experience) break;
      items.push({ experience, decision });
      excluded.push(experience.id);
    }
    return items.length ? items : [{ experience: primaryExperience, decision: primaryDecision }];
  }, [candidatePool, effectiveContext, learningContext, primaryDecision, primaryExperience]);
  const resumableExperience = activeSession ? activeSession.experienceSnapshot ?? candidatePool.find((experience) => experience.id === activeSession.experienceId) ?? experiences.find((experience) => experience.id === activeSession.experienceId) : undefined;
  const dayDecisions = useMemo<TodayDecision[]>(() => buildToday(effectiveContext, meaningfulLiveExperiences, learningContext, calendarContext.state === 'live' ? calendarContext.freeWindows : undefined, [...contextualPrepared, ...contextualBlueprints]), [calendarContext.freeWindows, calendarContext.state, contextualBlueprints, contextualPrepared, effectiveContext, learningContext, meaningfulLiveExperiences]);

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
  // `contextualSetRef` mirrors state so the async effect can compare without stale closures.
  const heroAnchorRef = useRef<string | null>(null);
  const contextualSetRef = useRef<Experience[]>([]);
  useEffect(() => { contextualSetRef.current = contextualSet; }, [contextualSet]);
  // A pending candidate belongs to the signature it was created for; drop it on any natural change.
  useEffect(() => { setPendingContextualSet(null); }, [contextualSignature]);

  // Adoption policy (the 6-hour cache and signature logic below are unchanged):
  // - The same capsule set arriving again (an effect re-run) is adopted silently and never shows the pill.
  // - First arrival after opening: a cache hit lands inside the opening frame and adopts directly;
  //   a fresh generation resolves seconds later, while the user is already reading the hero,
  //   so it is offered as a quiet "Nieuwe blik beschikbaar" pill instead of swapping the hero.
  // - A new day-part signature is a natural change and adopts directly again.
  // - An explicit refresh (createFreshMoment) already adopts by design, and pressing the pill
  //   is the user's conscious switch. Declining the hero leaves the pill available.
  const settleContextualCandidate = (set: Experience[], fromCache: boolean, signature: string) => {
    if (!set.length) return;
    const currentIds = contextualSetRef.current.map((item) => item.id).join('|');
    const incomingIds = set.map((item) => item.id).join('|');
    if (currentIds && currentIds === incomingIds) { setPendingContextualSet(null); return; }
    const anchor = heroAnchorRef.current;
    if (anchor === null) {
      heroAnchorRef.current = signature;
      if (fromCache) { setContextualSet(set); setPendingContextualSet(null); }
      else setPendingContextualSet(set);
      return;
    }
    if (anchor !== signature) {
      heroAnchorRef.current = signature;
      setContextualSet(set);
      setPendingContextualSet(null);
      return;
    }
    setPendingContextualSet(set);
  };
  const showPendingContextual = () => {
    if (!pendingContextualSet?.length) return;
    heroAnchorRef.current = contextualSignature;
    setContextualSet(pendingContextualSet);
    setPendingContextualSet(null);
  };

  useEffect(() => {
    if (!personalHydrated || !contextHydrated || !personalProfile.onboardingComplete || activeSession) return;
    let active = true;
    AsyncStorage.getItem(contextualSuggestionKey).then(async (stored) => {
      if (!active) return;
      if (stored) {
        try {
          const cached = JSON.parse(stored) as ContextualSuggestionCache & { experience?: Experience };
          const cachedSet = Array.isArray(cached.experiences) && cached.experiences.length ? cached.experiences : cached.experience ? [cached.experience] : [];
          if (cached.signature === contextualSignature && Date.parse(cached.expiresAt) > Date.now() && cachedSet.length) {
            settleContextualCandidate(cachedSet, true, contextualSignature); return;
          }
        } catch {
          AsyncStorage.removeItem(contextualSuggestionKey).catch(() => undefined);
        }
      }
      // ADR-059: vraag bij openen een kleine kandidaat-set (2–3 concepten) aan
      // binnen dezelfde begrensde payload, cache- en signature-discipline.
      const outcome = await generateContextualSuggestion(contextualDomain, effectiveContext, baseCandidatePool, contextualSignature, 3);
      const set = outcome.experiences.slice(0, 3);
      if (!active || !set.length) return;
      settleContextualCandidate(set, false, contextualSignature);
      const cache: ContextualSuggestionCache = { signature: contextualSignature, expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), experiences: set };
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

  // Opent een ervaring vanuit een surface: selecteert de kaart en legt de
  // herkomst vast. Het scherm dat deze actie aanroept pusht daarna zelf
  // 'Prepare' op de navigatie-stack (voorheen: setFlowStage('prepare')).
  const openExperience = (experience: Experience, from: Surface) => {
    setSelected(experience);
    setOrigin(from);
    setSharedDraft(null);
  };

  // Geeft true terug wanneer er een verse capsule ontstond en de aanroeper naar
  // 'Prepare' mag navigeren; bij een mislukte samenstelling blijft alles staan
  // (voorheen: geen flowStage-wijziging).
  const createFreshMoment = async (): Promise<boolean> => {
    if (momentGenerationLoading) return false;
    setMomentGenerationLoading(true);
    setMomentNotice('');
    try {
      const choices = personalProfile.preferredKinds.length ? personalProfile.preferredKinds : (['outside', 'restore', 'learn'] as ExperienceKind[]);
      const currentIndex = contextualSet[0] ? choices.indexOf(contextualSet[0].kind) : -1;
      const nextDomain = choices[(currentIndex + 1 + choices.length) % choices.length];
      // De expliciete momentmaker blijft één gerichte blik (geen set): de
      // aanroeper kiest bewust en de capsule adopteert direct als nieuwe hero.
      const outcome = await generateContextualSuggestion(nextDomain, effectiveContext, baseCandidatePool, `momentmaker-${Date.now()}`, 1);
      const draft = outcome.experiences[0];
      setEvidence((current) => ({
        ...current,
        generatedShown: current.generatedShown + outcome.experiences.length,
        generatedRejected: current.generatedRejected + outcome.rejected,
        generationByKind: draft ? { ...current.generationByKind, [draft.kind]: { ...current.generationByKind[draft.kind], shown: current.generationByKind[draft.kind].shown + 1 } } : current.generationByKind,
        lastGenerationNote: outcome.rejected > 0 ? `${outcome.rejected} concept(en) voldeden niet aan het capsulecontract.` : 'De gegenereerde capsule voldeed aan het contract en werd zichtbaar gemaakt.',
        lastUpdated: new Date().toISOString(),
      }));
      if (!draft) { setMomentNotice('Het lukte niet om iets nieuws samen te stellen — je huidige voorstel blijft staan.'); return false; }
      const prepared = attachMeaningThread(
        composeGuideMoments(attachNearestPlaceKnowledge(overlayVerifiedWorldContext(draft, selectionLocationConfirmed ? liveWorld ?? undefined : undefined), selectionLocationConfirmed ? liveWorld ?? undefined : undefined)),
        personalProfile,
      );
      setContextualSet([draft]);
      setPendingContextualSet(null);
      setSelected(prepared);
      setOrigin('now');
      const cache: ContextualSuggestionCache = { signature: contextualSignature, expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), experiences: [draft] };
      AsyncStorage.setItem(contextualSuggestionKey, JSON.stringify(cache)).catch(() => undefined);
      return true;
    } finally {
      setGeneratorStatus(await inspectGeneratorRuntime());
      setMomentGenerationLoading(false);
    }
  };

  const createEvaluationMoment = async (kind: ExperienceKind, evaluationContext: PrototypeContext): Promise<boolean> => {
    if (momentGenerationLoading) return false;
    setMomentGenerationLoading(true);
    try {
      const plannedScenario = generatorEvaluationPlanLookup(kind, evaluationContext);
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
      if (!draft) return false;
      const prepared = attachMeaningThread(
        composeGuideMoments(attachNearestPlaceKnowledge(overlayVerifiedWorldContext(draft, selectionLocationConfirmed ? liveWorld ?? undefined : undefined), selectionLocationConfirmed ? liveWorld ?? undefined : undefined)),
        personalProfile,
      );
      setSelected(prepared);
      setOrigin('now');
      return true;
    } finally {
      setGeneratorStatus(await inspectGeneratorRuntime());
      setMomentGenerationLoading(false);
    }
  };

  const startPresence = (company: Company, guideDepth: GuideDepth, shared?: SharedCapsuleState, transport?: TransportMode) => {
    const isNew = activeSession?.experienceId !== selected.id;
    setActiveSession({ experienceId: selected.id, experienceSnapshot: selected, stage: 'presence', stepIndex: isNew ? 0 : activeSession?.stepIndex ?? 0, origin, company, transport, guideDepth, shared, updatedAt: new Date().toISOString() });
    if (isNew) setEvidence((current) => ({ ...current, started: current.started + 1, lastUpdated: new Date().toISOString() }));
  };

  const savePreparation = (company: Company, guideDepth: GuideDepth, shared?: SharedCapsuleState, transport?: TransportMode) => {
    setSharedDraft(shared ?? null);
    setActiveSession((current) => {
      return { experienceId: selected.id, experienceSnapshot: selected, stage: 'prepare', stepIndex: current?.experienceId === selected.id ? current.stepIndex : 0, origin, company, transport, guideDepth, shared, updatedAt: new Date().toISOString() };
    });
  };

  const resumeSession = (): 'prepare' | 'presence' | null => {
    if (!activeSession) return null;
    const sessionExperience = activeSession.experienceSnapshot ?? candidatePool.find((experience) => experience.id === activeSession.experienceId) ?? experiences.find((experience) => experience.id === activeSession.experienceId);
    if (!sessionExperience) return null;
    setSelected(sessionExperience); setOrigin(activeSession.origin);
    return activeSession.stage;
  };

  const finishPresence = () => {
    notificationSuccess();
    setEvidence((current) => ({ ...current, completed: current.completed + 1, lastUpdated: new Date().toISOString() }));
    setCompletedSession(activeSession);
    setActiveSession(null);
  };

  const acceptIncomingInvite = (guestName: string): boolean => {
    if (!incomingInvite) return false;
    const invitedExperience = candidatePool.find((item) => item.id === incomingInvite.experienceId) ?? experiences.find((item) => item.id === incomingInvite.experienceId);
    if (!invitedExperience) return false;
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
    return true;
  };

  const declineIncomingInvite = () => {
    setIncomingInvite(null);
    setInviteIssue(null);
    clearInviteFromCurrentUrl();
  };

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
    setCompletedSession(null);
  };

  const skipReflection = () => {
    setEvidence((current) => ({ ...current, skippedReflection: current.skippedReflection + 1, lastUpdated: new Date().toISOString() }));
    setCompletedSession(null);
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

  const presenceBack = () => {
    setActiveSession((current) => (current ? { ...current, stage: 'prepare', updatedAt: new Date().toISOString() } : current));
  };

  const updatePresenceStep = (stepIndex: number) => {
    setActiveSession((current) => current && current.experienceId === selected.id ? { ...current, stage: 'presence', stepIndex, updatedAt: new Date().toISOString() } : current);
  };

  const applyFeedback = (item: Experience, outcome: LearningOutcome) => {
    setPersonalProfile((current) => applyLearning(current, item, outcome));
  };

  const discardSession = () => setActiveSession(null);
  const dismissMomentNotice = () => setMomentNotice('');
  const forgetReflectionById = (id: string) => setPersonalProfile((current) => forgetReflection(current, id));
  const forgetLearningEventById = (id: string) => setPersonalProfile((current) => forgetLearningEvent(current, id));
  const resetEvidence = () => setEvidence(emptyPrototypeEvidence());
  const resetLearningSignals = () => setPersonalProfile((current) => resetLearning(current));
  const redoOnboarding = () => setPersonalProfile((current) => ({ ...current, onboardingComplete: false }));
  const clearLiveCache = () => { clearLiveWorldCache().catch(() => undefined); setLiveMessage('Regionale live cache gewist'); };

  return {
    // hydration
    displayFontsLoaded,
    personalHydrated,
    // core state
    selected,
    origin,
    prototypeContext,
    setPrototypeContext,
    personalProfile,
    setPersonalProfile,
    activeSession,
    setActiveSession,
    completedSession,
    incomingInvite,
    inviteIssue,
    inviteGuestMode,
    sharedDraft,
    evidence,
    liveWorld,
    selectionLocationConfirmed,
    liveLoading,
    liveMessage,
    calendarContext,
    calendarLoading,
    memories,
    pendingContextual: pendingContextualSet,
    generatorStatus,
    momentGenerationLoading,
    momentNotice,
    // computed
    effectiveContext,
    opportunityResult,
    candidatePool,
    compositionSummary: compositionAudit.summary as CompositionSummary,
    contentCatalog: contentCatalog as ResolvedContentCatalog,
    learningContext,
    nowSuggestions,
    resumableExperience,
    dayDecisions,
    // actions
    openExperience,
    createFreshMoment,
    createEvaluationMoment,
    startPresence,
    savePreparation,
    resumeSession,
    finishPresence,
    acceptIncomingInvite,
    declineIncomingInvite,
    finishExperience,
    skipReflection,
    finishOnboarding,
    presenceBack,
    updatePresenceStep,
    applyFeedback,
    discardSession,
    showPendingContextual,
    dismissMomentNotice,
    forgetReflectionById,
    forgetLearningEventById,
    resetEvidence,
    resetLearningSignals,
    redoOnboarding,
    clearLiveCache,
    connectCalendar,
    refreshLiveWorld,
    useApproximateLocation,
  };
}

// Losse helper: het geplande evaluatie-scenario bij een vrije proef (ongewijzigd
// uit de vroegere createEvaluationMoment in App.tsx).
function generatorEvaluationPlanLookup(kind: ExperienceKind, evaluationContext: PrototypeContext) {
  return generatorEvaluationPlan.find((scenario) => scenario.kind === kind
    && scenario.availableMinutes === evaluationContext.availableMinutes
    && scenario.dayPart === evaluationContext.dayPart
    && scenario.company === evaluationContext.company
    && (kind !== 'movement' || scenario.hasKettlebell === evaluationContext.hasKettlebell));
}
