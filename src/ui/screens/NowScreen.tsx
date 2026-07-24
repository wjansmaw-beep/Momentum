import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Experience, ExperienceKind, experienceFactLabels } from '../../product/experienceModel';
import { dayPartLabels, EnergyLevel, energyLabels } from '../../product/localIntelligence';
import { composeDailyAffirmation } from '../../product/affirmation';
import { experienceKindLabels, LearningOutcome } from '../../profile/personalModel';
import { evidenceSummary } from '../../guidance/experienceGuide';
import { colors } from '../../design/theme';
import { impactLight } from '../../design/haptics';
import { useKenBurns, useStaggeredEntrance } from '../../design/motion';
import { CoverImage, ImageShade } from '../CoverImage';
import { QuietCanvas } from '../QuietCanvas';
import { ChoiceChip, LiveWorldBar, MiniFact, Pill, ScreenHeader, SecondaryButton } from '../primitives';
import { SurfaceFrame } from '../frames';
import { styles } from '../styles/appStyles';
import { useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';

// Nu-scherm (ADR-058): verhuisd uit App.tsx. Suggestie-pager, pull-to-refresh,
// hero-entree en de rustige afwijs-states zijn ongewijzigd. Alleen de sprongen
// naar Prepare/Profile/Ontdekken lopen nu via de navigator.

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
  // Entree volgens ADR-057: hero-lagen verschijnen verspringend (respecteert reduced-motion).
  const heroEntrance = useStaggeredEntrance(5);
  // De dagelijkse affirmatieregel krijgt een eigen, rustige entree vóór de hero.
  const affirmationEntrance = useStaggeredEntrance(1, { duration: 560, distance: 10 });
  // Living Canvas (Horizon B): sub-perceptuele Ken Burns op de hero (≤4%, ≥8s, stil bij reduced-motion).
  const kenBurns = useKenBurns();
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
  useEffect(() => { setSuggestionIndex(0); setWhyOpen(false); setDeclined(false); }, [suggestions.map((item) => item.experience.id).join('|')]);
  const showSuggestion = (index: number) => { setSuggestionIndex(index); setWhyOpen(false); setDeclined(false); };
  // suggestionIndexRef spiegelt de state zodat gebaar-callbacks nooit met een
  // verouderde closure werken.
  const suggestionIndexRef = useRef(suggestionIndex);
  useEffect(() => { suggestionIndexRef.current = suggestionIndex; }, [suggestionIndex]);
  const shiftSuggestion = (direction: number) => {
    // Carrousel: na de laatste match volgt weer de eerste (en andersom),
    // zodat de suggesties rondgaan in plaats van dood te lopen.
    const count = suggestions.length;
    const nextIndex = ((suggestionIndexRef.current + direction) % count + count) % count;
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
    <SurfaceFrame>
    <GestureDetector gesture={pullGesture}>
      <View style={styles.flex}>
        <Reanimated.View pointerEvents="none" style={[styles.pullIndicator, pullIndicatorStyle]}>
          <Ionicons name="arrow-down" size={13} color={colors.accent} />
          <Text style={styles.pullIndicatorText}>{pullRefreshing ? 'Live wereld wordt ververst…' : 'Loslaten om de live wereld te verversen'}</Text>
        </Reanimated.View>
        <Reanimated.View style={[styles.flex, pullContentStyle]}>
          <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false} onScroll={(event) => { scrollTop.value = event.nativeEvent.contentOffset.y; }} scrollEventThrottle={16}>
      <ScreenHeader eyebrow={`${dayPartLabels[context.dayPart].toUpperCase()}${firstName ? ` · ${firstName.toUpperCase()}` : ''}`} title="Wat past er nu?" subtitle="Dit past waarschijnlijk bij je moment. Jij beslist." onProfile={onProfile} profileName={firstName} />
      <LiveWorldBar snapshot={liveWorld} loading={liveLoading} onRefresh={Platform.OS === 'web' ? onRefresh : undefined} />
      {/* Energie-check-in (ADR-060, punt 3b): licht en vrijwillig. Geen meting,
          geen verplichting; overslaan betekent neutraal. Opnieuw tikken wist. */}
      <View style={styles.energyCard}>
        <Text style={styles.energyTitle}>Hoe voelt je energie nu?</Text>
        <Text style={styles.energyBody}>Geen meting — alleen een zachte richting voor de voorstellen van nu. Overslaan kan altijd.</Text>
        <View style={styles.chipRow}>
          {(['low', 'steady', 'full'] as EnergyLevel[]).map((level) => (
            <ChoiceChip
              key={level}
              label={energyLabels[level]}
              selected={energyLevel === level}
              onPress={() => setEnergyCheckin(energyLevel === level ? null : level)}
            />
          ))}
        </View>
        {energyLevel && <Text style={styles.energyNote}>Alleen voor vandaag · tik opnieuw om te wissen · blijft op dit apparaat</Text>}
      </View>
      {pendingExperience?.length ? <Pressable accessibilityRole="button" accessibilityLabel={`Toon de nieuwe blik: ${pendingExperience[0].title}`} onPress={onShowPendingExperience} style={styles.pendingHeroPill}><Ionicons name="sparkles" size={14} color={colors.accent} /><View style={styles.flex}><Text style={styles.pendingHeroPillText}>{pendingExperience.length > 1 ? `${pendingExperience.length} nieuwe blikken beschikbaar` : 'Nieuwe blik beschikbaar'}</Text><Text style={styles.pendingHeroPillBody}>{pendingExperience[0].title}{pendingExperience.length > 1 ? ` en ${pendingExperience.length - 1} ${pendingExperience.length === 2 ? 'andere blik' : 'andere blikken'}` : ''} {pendingExperience.length > 1 ? 'wachten' : 'wacht'} rustig tot jij wilt wisselen.</Text></View><Text style={styles.pendingHeroPillAction}>Toon</Text></Pressable> : null}
      {resumableExperience && <View style={styles.resumeCard}><Pressable accessibilityLabel={`Hervat ${resumableExperience.title}`} onPress={onResume} style={styles.resumeMain}><View style={styles.resumeMark}><Ionicons name="play" size={14} color={colors.accent} /></View><View style={styles.flex}><Text style={styles.resumeLabel}>GA VERDER</Text><Text style={styles.resumeTitle}>{resumableExperience.title}</Text></View><Ionicons name="arrow-forward" size={21} color={colors.gold} /></Pressable><Pressable accessibilityLabel="Sluit open ervaring" onPress={onDiscardSession} style={styles.resumeDiscard}><Text style={styles.resumeDiscardText}>Sluit</Text></Pressable></View>}
      {calendar.state === 'live' && calendar.currentFreeMinutes ? <View style={styles.contextNotice}><Ionicons name="time-outline" size={20} color={colors.gold} /><View style={styles.flex}><Text style={styles.contextNoticeTitle}>{calendar.currentFreeMinutes} minuten ruimte herkend</Text><Text style={styles.contextNoticeBody}>Alleen begin- en eindtijden verwerkt · afspraakinhoud genegeerd</Text></View></View> : null}
      {/* ADR-061, punt 2: de affirmatieregel als bescheiden kicker boven de
          hero — serif-italic op kleine schaal, richtinggevend zonder met de
          belofte te concurreren. */}
      <Animated.View style={affirmationEntrance[0]}>
        <Text style={styles.affirmationKicker}>{affirmation.line}</Text>
      </Animated.View>
      {!declined ? (
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
              <Pressable accessibilityLabel="Vorige suggestie" onPress={() => shiftSuggestion(-1)} style={styles.suggestionArrow}><Ionicons name="chevron-back" size={20} color={colors.bone} /></Pressable>
              <View style={styles.suggestionPosition}><View style={styles.suggestionDots}>{suggestions.map((_, index) => <View key={index} style={[styles.suggestionDot, index === suggestionIndex && styles.suggestionDotActive]} />)}</View><Text style={styles.suggestionPositionBody}>{suggestionIndex === 0 ? 'Beste match voor nu' : 'Een andere richting'}</Text></View>
              <Pressable accessibilityLabel="Volgende suggestie" onPress={() => shiftSuggestion(1)} style={styles.suggestionArrow}><Ionicons name="chevron-forward" size={20} color={colors.bone} /></Pressable>
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
      {/* Wijziging NU (Founder): de momentmaker-ingang, de kaart
          "Er is ruimte ontstaan" én de lage-confidence-kaart "Geef richting"
          achter de laatste match zijn hier verwijderd. De suggesties gaan
          rond: na de laatste match volgt weer de eerste. Eigen invulling
          hoort op één plek: de intent-sectie "Eigen richting" in Ontdekken;
          de gebruiker navigeert daar zelf heen. Geen andere wijziging aan Nu. */}
          </ScrollView>
        </Reanimated.View>
      </View>
    </GestureDetector>
    </SurfaceFrame>
  );
}
