import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  FadeIn,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Experience, ExperienceKind, experienceFactLabels } from '../../product/experienceModel';
import { dayPartLabels, EnergyLevel, energyLabels } from '../../product/localIntelligence';
import { composeDailyAffirmation } from '../../product/affirmation';
import { experienceKindLabels, LearningOutcome } from '../../profile/personalModel';
import { evidenceSummary } from '../../guidance/experienceGuide';
import { colors, schemeStyles } from '../../design/theme';
import { impactLight } from '../../design/haptics';
import { useKenBurns, useReducedMotion, useStaggeredEntrance } from '../../design/motion';
import { CoverImage, ImageShade } from '../CoverImage';
import { QuietCanvas } from '../QuietCanvas';
import { LiveWorldBar, MiniFact, Pill, SecondaryButton } from '../primitives';
import { SurfaceFrame } from '../frames';
import { styles, editorialItalicFont } from '../styles/appStyles';
import { useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';

// Nu-scherm, scene-first (ADR-066, fase 2A): het scherm ís de scène. De
// hero-afbeelding ligt full-bleed achter het hele scherm (met de bestaande
// ImageShade-gradient en een scheme-aware scrim-kap bovenin voor
// leesbaarheid); de affirmatieregel staat prominent bovenin en de
// leadsuggestie is typografie direct op de scène — geen kaart meer eromheen.
// De maximaal vijf matches zijn veegposters: elke poster is een eigen scène
// (beeld + titel + één belevende zin + 2-3 waarom-nu-chips) en de bekende
// rondloop (na de laatste weer de eerste) leeft door als loopende paginatie.
// Ranking, store-machine en de rustige afwijs-state zijn ongewijzigd; dit
// bestand verandert alleen presentatie.
//
// Beweging (ADR-057/066-eis): bij reduced-motion schuift niets — posters
// wisselen via een rustige cross-fade (expo-image transition + FadeIn),
// de sleepvolging van het gebaar staat dan volledig stil.

const swipeHintKey = 'momentum.now-swipe-hint.v1';
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function NowScreen() {
  const {
    personalProfile,
    nowSuggestions: suggestions,
    resumableExperience,
    effectiveContext: context,
    calendarContext: calendar,
    liveWorld,
    liveLoading,
    generatorStatus,
    pendingContextual: pendingExperience,
    showPendingContextual: onShowPendingExperience,
    resumeSession,
    discardSession: onDiscardSession,
    openExperience,
    refreshLiveWorld,
    applyFeedback,
    energyLevel,
    setEnergyCheckin,
  } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const firstName = personalProfile.firstName;
  const profileInitial = (firstName ?? '').trim().slice(0, 1).toUpperCase() || 'M';
  const onOpen = (item: Experience) => {
    openExperience(item, 'now');
    navigation.navigate('Prepare');
  };
  const onProfile = () => navigation.navigate('Profile');
  const onRefresh = () => refreshLiveWorld();
  const onFeedback = (item: Experience, outcome: LearningOutcome) => applyFeedback(item, outcome);
  const onResume = () => {
    const stage = resumeSession();
    if (stage === 'presence') navigation.navigate('Presence');
    else if (stage === 'prepare') navigation.navigate('Prepare');
  };
  const [declined, setDeclined] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  // Entree volgens ADR-057: scène-lagen verschijnen verspringend (respecteert reduced-motion).
  const heroEntrance = useStaggeredEntrance(5);
  // De dagelijkse affirmatieregel krijgt een eigen, rustige entree vóór de poster.
  const affirmationEntrance = useStaggeredEntrance(1, { duration: 560, distance: 10 });
  // Living Canvas: sub-perceptuele Ken Burns op het scènebeeld (≤4%, ≥8s, stil bij reduced-motion).
  const kenBurns = useKenBurns();
  const reducedMotion = useReducedMotion();
  const { width: windowWidth } = useWindowDimensions();
  // De scène leeft binnen het bestaande gecentreerde appFrame (max 560 breed);
  // de veegafstand volgt die framebreedte, niet het volledige venster.
  const frameWidth = Math.min(windowWidth, 560);
  // Eenmalige veeg-hint bij het eerste gebruik (ADR-066: niets essentieels mag
  // achter een onontdekbaar gebaar zitten). De vlag blijft op dit apparaat.
  const [swipeHintSeen, setSwipeHintSeen] = useState<boolean | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(swipeHintKey)
      .then((value) => setSwipeHintSeen(value === '1'))
      .catch(() => setSwipeHintSeen(false));
  }, []);
  const markSwipeHintSeen = () => {
    setSwipeHintSeen(true);
    AsyncStorage.setItem(swipeHintKey, '1').catch(() => undefined);
  };
  // Dagelijkse affirmatieregel (ADR-059, punt 1; ADR-060, punt 3; ADR-061,
  // punt 2): deterministisch samengesteld uit dagdeel, live wereldcontext
  // (weer én plaats, alleen wanneer gekoppeld), zelf gekozen richtingen,
  // recente positieve feedback uit het leermodel en de optionele
  // energie-check-in. Elke persoonlijke regel draagt een concreet anker
  // (tijd, plek of actie); zonder al die ingangen blijft de neutrale regel.
  const affirmationFeedback = useMemo(() => {
    // Alleen positieve bevestigingen (worth-it / repeat) van de laatste twee
    // weken bereiken de regel; 'not-for-me' komt hier nooit aan bod.
    const recent = personalProfile.learningEvents.filter((event) =>
      event.outcome !== 'not-for-me' && Date.now() - Date.parse(event.createdAt) < 14 * 24 * 3600000);
    if (!recent.length) return null;
    const counts = new Map<ExperienceKind, number>();
    recent.forEach((event) => counts.set(event.kind, (counts.get(event.kind) ?? 0) + 1));
    const valuedKind = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return { recentValued: recent.length, valuedKind };
  }, [personalProfile.learningEvents]);
  const affirmation = useMemo(() => composeDailyAffirmation({
    dayPart: context.dayPart,
    firstName: personalProfile.firstName,
    weather: liveWorld?.weather ? { weatherCode: liveWorld.weather.weatherCode, temperature: liveWorld.weather.temperature, windSpeed: liveWorld.weather.windSpeed } : null,
    place: liveWorld?.regionLabel ? liveWorld.regionLabel.split(' proefcontext')[0] : null,
    directions: [...personalProfile.directions.near, ...personalProfile.directions.growth, ...personalProfile.directions.meaning]
      .filter((value) => !personalProfile.pausedDirections.includes(value)),
    energy: energyLevel,
    feedback: affirmationFeedback,
  }), [affirmationFeedback, context.dayPart, energyLevel, liveWorld?.weather, liveWorld?.regionLabel, personalProfile]);
  const currentSuggestion = suggestions[Math.min(suggestionIndex, suggestions.length - 1)] ?? suggestions[0];
  const experience = currentSuggestion.experience;
  const decision = currentSuggestion.decision;
  const grounding = evidenceSummary(experience);
  // Waarom-nu-chips (ADR-066, fase 2A): de bestaande ranking-redenen uit de
  // decision zijn sinds PR #24 consumententaal ("sluit aan bij jouw
  // voorkeuren", "de wereld van nu maakt dit moment onderscheidend"); live
  // wereldsignalen zitten daar al in via de liveEvidence-reden. Maximaal 3,
  // kort, zonder bronnen-jargon — de bronlaag blijft één tik dieper.
  const whyNowReasons = useMemo(
    () => (decision.selected?.reasons ?? []).slice(0, 3).map((reason) => reason.text),
    [decision],
  );
  useEffect(() => { setSuggestionIndex(0); setWhyOpen(false); setDeclined(false); }, [suggestions.map((item) => item.experience.id).join('|')]);
  const showSuggestion = (index: number) => { setSuggestionIndex(index); setWhyOpen(false); setDeclined(false); };
  // suggestionIndexRef spiegelt de state zodat gebaar-callbacks nooit met een
  // verouderde closure werken.
  const suggestionIndexRef = useRef(suggestionIndex);
  useEffect(() => { suggestionIndexRef.current = suggestionIndex; }, [suggestionIndex]);
  // pagedOnce zet na de eerste paginatie de rustige FadeIn aan voor
  // reduced-motion-wissels; de eerste verschijning hoort bij de hero-entree.
  const pagedOnceRef = useRef(false);

  // Scène-paginatie (ADR-066, regel 2): de rondloop uit PR #17 leeft door als
  // loopende paginatie. Zonder reduced-motion schuift de huidige poster uit
  // beeld en glijdt de nieuwe vanaf de andere kant binnen; met reduced-motion
  // wisselt alleen de inhoud via een rustige cross-fade.
  const sceneX = useSharedValue(0);
  const applyPagination = (direction: number) => {
    const count = suggestions.length;
    if (count < 2) return;
    // Carrousel: na de laatste match volgt weer de eerste (en andersom),
    // zodat de suggesties rondgaan in plaats van dood te lopen.
    const nextIndex = ((suggestionIndexRef.current + direction) % count + count) % count;
    if (nextIndex === suggestionIndexRef.current) return;
    impactLight();
    pagedOnceRef.current = true;
    markSwipeHintSeen();
    showSuggestion(nextIndex);
    if (!reducedMotion) {
      sceneX.value = direction * frameWidth * 0.55;
      sceneX.value = withSpring(0, { damping: 24, stiffness: 210 });
    }
  };
  const paginate = (direction: number) => {
    if (suggestions.length < 2) return;
    if (reducedMotion) { applyPagination(direction); return; }
    sceneX.value = withTiming(-direction * frameWidth, { duration: 190 }, (finished) => {
      'worklet';
      if (finished) runOnJS(applyPagination)(direction);
    });
  };

  // Veegposters: horizontale pan op de hele scène; de poster volgt de vinger
  // (of muis op web) en springt rustig terug onder de drempel. De pijltjes en
  // dots blijven als rustige fallback (web/toegankelijkheid). Bij
  // reduced-motion volgt de poster de vinger niet — alleen de richting telt.
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-16, 16])
    .failOffsetY([-12, 12])
    .enabled(suggestions.length > 1 && !declined)
    .onUpdate((event) => {
      'worklet';
      if (reducedMotion) return;
      sceneX.value = event.translationX * 0.92;
    })
    .onEnd((event) => {
      'worklet';
      if (event.translationX < -56 || event.velocityX < -460) runOnJS(paginate)(1);
      else if (event.translationX > 56 || event.velocityX > 460) runOnJS(paginate)(-1);
      else if (!reducedMotion) sceneX.value = withSpring(0, { damping: 22, stiffness: 200 });
    });
  const sceneSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sceneX.value }],
    opacity: interpolate(Math.abs(sceneX.value), [0, frameWidth * 0.9], [1, 0.3], 'clamp'),
  }));

  // Pull-to-refresh (ongewijzigd): omlaag trekken bovenaan de scroll ververst
  // de live wereld via het bestaande refreshLiveWorld-pad, met
  // rubber-band-demping. Op web blijft de verversknop in de LiveWorldBar de
  // expliciete fallback.
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

  const showSwipeHint = suggestions.length > 1 && swipeHintSeen === false && !declined;
  // Reduced-motion: posterwissels verlopen als rustige cross-fade, nooit als
  // schuivende posters (ADR-057/066). De eerste verschijning gebruikt de
  // bestaande verspringende hero-entree.
  const posterEntry = reducedMotion && pagedOnceRef.current ? FadeIn.duration(380) : undefined;

  return (
    <SurfaceFrame>
    <GestureDetector gesture={pullGesture}>
      <View style={styles.flex}>
        <Reanimated.View pointerEvents="none" style={[styles.pullIndicator, pullIndicatorStyle]}>
          <Ionicons name="arrow-down" size={13} color={colors.accent} />
          <Text style={styles.pullIndicatorText}>{pullRefreshing ? 'Live wereld wordt ververst…' : 'Loslaten om de live wereld te verversen'}</Text>
        </Reanimated.View>
        <Reanimated.View style={[styles.flex, pullContentStyle]}>
          <GestureDetector gesture={swipeGesture}>
            <Reanimated.View collapsable={false} style={[styles.flex, sceneSlideStyle]}>
              {/* Volledige scène (ADR-066, regel 1): het beeld van de huidige
                  poster is full-bleed de achtergrond. ImageShade blijft de
                  leesbaarheidslaag; een scheme-aware scrim-kap bovenin
                  (colors.scrim) houdt eyebrow, wereldzin en affirmatie AA op
                  elke foto. CoverImage deelt dezelfde uri met Prepare/
                  Presence, dus de beeldcontinuïteit van de flow blijft via de
                  memory-disk-cache intact. */}
              <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <CoverImage uri={experience.image} style={StyleSheet.absoluteFill} imageContainerStyle={kenBurns as StyleProp<ViewStyle>}>
                  <ImageShade />
                  <LinearGradient pointerEvents="none" colors={[colors.scrim, 'rgba(8,10,14,0)']} style={scene.topScrim} />
                </CoverImage>
              </View>
              <ScrollView
                contentContainerStyle={scene.sceneScroll}
                showsVerticalScrollIndicator={false}
                onScroll={(event) => { scrollTop.value = event.nativeEvent.contentOffset.y; }}
                scrollEventThrottle={16}
              >
                {/* Scène-meubilair bovenin: dagdeel + naam, de levende
                    wereldzin, de affirmatieregel prominent (kleiner dan de
                    poster-titel) en de energie-check-in als stil element. */}
                <View>
                  <View style={scene.topBar}>
                    <Text style={scene.eyebrow}>{`${dayPartLabels[context.dayPart].toUpperCase()}${firstName ? ` · ${firstName.toUpperCase()}` : ''}`}</Text>
                    <Pressable accessibilityLabel="Open profiel" onPress={onProfile} style={styles.avatar}><Text style={styles.avatarText}>{profileInitial}</Text></Pressable>
                  </View>
                  <LiveWorldBar snapshot={liveWorld} loading={liveLoading} onImage onRefresh={Platform.OS === 'web' ? onRefresh : undefined} />
                  {pendingExperience?.length ? <Pressable accessibilityRole="button" accessibilityLabel={`Toon de nieuwe blik: ${pendingExperience[0].title}`} onPress={onShowPendingExperience} style={[styles.pendingHeroPill, scene.floatingVeil]}><Ionicons name="sparkles" size={14} color={colors.accent} /><View style={styles.flex}><Text style={styles.pendingHeroPillText}>{pendingExperience.length > 1 ? `${pendingExperience.length} nieuwe blikken liggen klaar` : 'Een nieuwe blik ligt klaar'}</Text><Text style={styles.pendingHeroPillBody}>{pendingExperience[0].title}{pendingExperience.length > 1 ? ` en ${pendingExperience.length - 1} ${pendingExperience.length === 2 ? 'andere blik' : 'andere blikken'}` : ''} {pendingExperience.length > 1 ? 'wachten' : 'wacht'} tot jij wilt kijken.</Text></View><Text style={styles.pendingHeroPillAction}>Toon</Text></Pressable> : null}
                  {resumableExperience && <View style={styles.resumeCard}><Pressable accessibilityLabel={`Hervat ${resumableExperience.title}`} onPress={onResume} style={styles.resumeMain}><View style={styles.resumeMark}><Ionicons name="play" size={14} color={colors.accent} /></View><View style={styles.flex}><Text style={styles.resumeLabel}>GA VERDER</Text><Text style={styles.resumeTitle}>{resumableExperience.title}</Text></View><Ionicons name="arrow-forward" size={21} color={colors.gold} /></Pressable><Pressable accessibilityLabel="Sluit open ervaring" onPress={onDiscardSession} style={styles.resumeDiscard}><Text style={styles.resumeDiscardText}>Sluit</Text></Pressable></View>}
                  {calendar.state === 'live' && calendar.currentFreeMinutes ? <View style={[styles.contextNotice, scene.floatingVeil]}><Ionicons name="time-outline" size={20} color={colors.gold} /><View style={styles.flex}><Text style={styles.contextNoticeTitle}>{calendar.currentFreeMinutes} minuten ruimte herkend</Text><Text style={styles.contextNoticeBody}>Alleen begin- en eindtijden verwerkt · afspraakinhoud genegeerd</Text></View></View> : null}
                  <Animated.View style={affirmationEntrance[0]}>
                    <Text style={scene.affirmation}>{affirmation.line}</Text>
                  </Animated.View>
                  {/* Energie-check-in (ADR-060, punt 3b): een stil scène-element
                      onder de affirmatie — geen kaart-blok meer. Licht en
                      vrijwillig; overslaan betekent neutraal, opnieuw tikken
                      wist. */}
                  <View style={scene.energyRow}>
                    <Text style={scene.energyLabel}>Hoe voel je je</Text>
                    <View style={scene.energyChips}>
                      {(['low', 'steady', 'full'] as EnergyLevel[]).map((level) => {
                        const selected = energyLevel === level;
                        return (
                          <Pressable
                            key={level}
                            accessibilityRole="button"
                            accessibilityLabel={`Energie vandaag: ${energyLabels[level]}`}
                            accessibilityState={{ selected }}
                            onPress={() => { impactLight(); setEnergyCheckin(selected ? null : level); }}
                            style={[scene.energyChip, selected && scene.energyChipSelected]}
                          >
                            <Text style={[scene.energyChipText, selected && scene.energyChipTextSelected]}>{energyLabels[level]}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                  {energyLevel && <Text style={scene.energyNote}>Alleen voor vandaag · tik opnieuw om te wissen · blijft op dit apparaat</Text>}
                </View>
                {/* De poster: typografie direct op de scène, gewisseld per
                    suggestie. Titel, één belevende zin (wonder-register) en de
                    waarom-nu-chips horen bij díe poster; de rondloop maakt
                    elke optie een volledige scène. */}
                <Reanimated.View key={experience.id} entering={posterEntry} style={scene.poster}>
                  {!declined ? (
                    <>
                      <Animated.View style={[scene.posterStatus, heroEntrance[0]]}>
                        <Pill label={`${experienceKindLabels[experience.kind].toUpperCase()} MOMENT`} accent={experience.accent} />
                        <Text style={styles.heroTime}>{grounding.currentCount ? 'DE WERELD KIJKT MEE' : experience.generation ? 'VOOR DIT MOMENT GEMAAKT' : suggestionIndex === 0 ? 'BESTE MATCH' : 'ANDERE BLIK'}</Text>
                      </Animated.View>
                      <Animated.View style={heroEntrance[1]}><Text style={styles.heroTitle}>{experience.title}</Text></Animated.View>
                      <Animated.View style={heroEntrance[2]}>
                        <Text style={styles.heroWonder}>{experience.wonder || experience.promise}</Text>
                        {(experience.generation || experience.liveEvidence?.length) ? <View style={styles.heroGrounding}><Ionicons name={grounding.currentCount ? 'ellipse' : 'ellipse-outline'} size={9} color={colors.onImageAccent} /><Text style={styles.heroGroundingText}>{experience.generation ? 'Nieuw samengesteld' : 'Geselecteerd'} · {grounding.label}</Text></View> : null}
                      </Animated.View>
                      <Animated.View style={heroEntrance[3]}>
                        <View style={styles.heroFacts}>
                          <MiniFact value={`${experience.duration} min`} label={experienceFactLabels[experience.kind].duration} onImage />
                          <MiniFact value={experience.distance ?? (experience.kind === 'food' ? 'zelf kiezen' : 'dichtbij')} label={experienceFactLabels[experience.kind].distance} onImage />
                          <MiniFact value={experience.effort} label={experienceFactLabels[experience.kind].effort} onImage />
                        </View>
                        {whyNowReasons.length > 0 && (
                          <View style={scene.whyNowRow}>
                            {whyNowReasons.map((reason) => <View key={reason} style={scene.whyNowChip}><Text style={scene.whyNowChipText}>{capitalize(reason)}</Text></View>)}
                          </View>
                        )}
                      </Animated.View>
                      <Animated.View style={heroEntrance[4]}>
                        {/* Kiezen is een klein ritueel (ADR-066, regel 3):
                            "Dit wordt het" opent Prepare met dezelfde scène. */}
                        <Pressable accessibilityRole="button" accessibilityLabel={`Dit wordt het: ${experience.title}`} onPress={() => { impactLight(); onOpen(experience); }} style={({ pressed }) => [styles.heroPrimaryAction, pressed && styles.pressed]}><Text style={styles.heroPrimaryActionText}>Dit wordt het</Text><Ionicons name="arrow-forward" size={21} color={colors.accent} /></Pressable>
                      </Animated.View>
                      {suggestions.length > 1 && (
                        <View style={scene.pagerRow}>
                          <Pressable accessibilityLabel="Vorige suggestie" onPress={() => paginate(-1)} style={scene.pagerArrow}><Ionicons name="chevron-back" size={19} color={colors.onImage} /></Pressable>
                          <View style={scene.pagerCenter}>
                            <View style={styles.suggestionDots}>{suggestions.map((_, index) => <View key={index} style={[scene.pagerDot, index === suggestionIndex && scene.pagerDotActive]} />)}</View>
                            <Text style={scene.pagerLabel}>{suggestionIndex === 0 ? 'Beste match voor nu' : 'Een andere blik'}</Text>
                          </View>
                          <Pressable accessibilityLabel="Volgende suggestie" onPress={() => paginate(1)} style={scene.pagerArrow}><Ionicons name="chevron-forward" size={19} color={colors.onImage} /></Pressable>
                        </View>
                      )}
                      {showSwipeHint && (
                        <Pressable accessibilityRole="button" accessibilityLabel="Hint: veeg voor een andere blik" onPress={markSwipeHintSeen} style={scene.swipeHint}>
                          <Ionicons name="swap-horizontal" size={13} color={colors.onImageAccent} />
                          <Text style={scene.swipeHintText}>Veeg voor een andere blik</Text>
                        </Pressable>
                      )}
                      {/* Waarom/bron-laag (Copy Style Guide): de eerlijke
                          onderbouwing blijft één tik diep, zonder de scène te
                          vervuilen. */}
                      <Pressable accessibilityRole="button" accessibilityLabel="Waarom dit nu past" accessibilityState={{ expanded: whyOpen }} onPress={() => setWhyOpen((value) => !value)} style={scene.whyButton}>
                        <Text style={scene.whyButtonText}>Waarom dit nu past</Text>
                        <Ionicons name={whyOpen ? 'chevron-up' : 'chevron-down'} size={17} color={colors.onImageAccent} />
                      </Pressable>
                      {whyOpen && <View style={scene.whyPanel}>{decision.selected?.reasons.slice(0, 3).map((reason) => <Text key={reason.text} style={scene.whyReason}>• {reason.text}</Text>)}<Text style={scene.proofNote}>{calendar.state === 'live' ? 'Vrije tijd is lokaal meegewogen.' : 'Er is geen agenda gebruikt.'} Geen gezondheidsdata gebruikt.</Text></View>}
                      <View style={scene.feedbackRow}>
                        <Pressable onPress={() => { onFeedback(experience, 'not-now'); setDeclined(true); }} style={scene.quietAction}><Text style={scene.quietActionText}>Niet nu</Text></Pressable>
                        <View style={scene.feedbackDivider} />
                        <Pressable onPress={() => { onFeedback(experience, 'not-for-me'); setDeclined(true); }} style={scene.quietAction}><Text style={scene.quietCorrection}>Past niet bij mij</Text></Pressable>
                      </View>
                    </>
                  ) : (
                    <QuietCanvas eyebrow="MOMENTUM BLIJFT STIL" title="Prima. Dit moment hoeft niets te worden.">
                      <Text style={styles.screenSubtitle}>Je keuze verandert je blijvende voorkeuren niet.</Text>
                      <SecondaryButton label="Toon het voorstel opnieuw" onPress={() => setDeclined(false)} />
                    </QuietCanvas>
                  )}
                </Reanimated.View>
              </ScrollView>
            </Reanimated.View>
          </GestureDetector>
        </Reanimated.View>
      </View>
    </GestureDetector>
    </SurfaceFrame>
  );
}

// Scène-eigen stijlen (ADR-066, fase 2A), per appearance scheme gebouwd uit de
// bestaande tokens: on-image tekst op de ImageShade/scrim-lagen, glas-chips
// voor de stille bediening. Alles blijft AA via dezelfde onImage-/scrim-tokens
// die de hero al gebruikte.
const scene = schemeStyles(({ colors }) => StyleSheet.create({
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  sceneScroll: { flexGrow: 1, padding: 20, paddingTop: 14, paddingBottom: 168, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  eyebrow: {
    color: colors.onImage, fontSize: 11, letterSpacing: 1.45, fontWeight: '700',
    textShadowColor: 'rgba(8,10,14,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  affirmation: {
    color: colors.onImage, fontSize: 17, lineHeight: 25, fontFamily: editorialItalicFont,
    marginTop: 8, maxWidth: 440,
    textShadowColor: 'rgba(8,10,14,0.55)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8,
  },
  floatingVeil: { backgroundColor: colors.veilStrong },
  energyRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  energyLabel: { color: colors.onImageMuted, fontSize: 12, fontWeight: '600' },
  energyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  energyChip: { minHeight: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.onImageLine, backgroundColor: colors.onImageGlass, paddingHorizontal: 13, justifyContent: 'center' },
  energyChipSelected: { borderColor: colors.onImageAccent, backgroundColor: colors.darkGlass },
  energyChipText: { color: colors.onImageMuted, fontSize: 12, fontWeight: '600' },
  energyChipTextSelected: { color: colors.onImage },
  energyNote: { color: colors.onImageMuted, fontSize: 11, lineHeight: 15, marginTop: 8 },
  poster: { gap: 12, marginTop: 26 },
  posterStatus: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  whyNowRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  whyNowChip: { borderRadius: 999, borderWidth: 1, borderColor: colors.onImageAccentLine, backgroundColor: colors.onImageGlass, paddingHorizontal: 11, paddingVertical: 7 },
  whyNowChipText: { color: colors.onImage, fontSize: 11, fontWeight: '600' },
  pagerRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  pagerArrow: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.onImageLine, backgroundColor: colors.onImageGlass, alignItems: 'center', justifyContent: 'center' },
  pagerCenter: { alignItems: 'center', flex: 1 },
  pagerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.onImageLineFaint },
  pagerDotActive: { width: 18, backgroundColor: colors.onImage },
  pagerLabel: { color: colors.onImageMuted, fontSize: 11, marginTop: 6 },
  swipeHint: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.onImageAccentLine, backgroundColor: colors.darkGlass, paddingHorizontal: 13, paddingVertical: 8 },
  swipeHintText: { color: colors.onImageAccent, fontSize: 11, fontWeight: '700' },
  whyButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  whyButtonText: { color: colors.onImageMuted, fontSize: 12 },
  whyPanel: { borderRadius: 18, borderWidth: 1, borderColor: colors.onImageLineFaint, backgroundColor: colors.darkGlass, padding: 15, gap: 8 },
  whyReason: { color: colors.onImage, fontSize: 12, lineHeight: 18 },
  proofNote: { color: colors.onImageMuted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  feedbackRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  feedbackDivider: { width: 1, height: 18, backgroundColor: colors.onImageLineFaint, marginHorizontal: 8 },
  quietAction: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  quietActionText: { color: colors.onImageMuted, fontSize: 12 },
  quietCorrection: { color: colors.onImageAccent, fontSize: 11 },
}));
