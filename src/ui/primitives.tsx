import React, { useEffect, useState } from 'react';
import { Animated, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated from 'react-native-reanimated';
import { StackActions, useNavigation, useNavigationState } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Experience, Surface } from '../product/experienceModel';
import { LiveWorldSnapshot } from '../liveworld/liveWorld';
import { directionLabels } from '../profile/personalModel';
import { meaningThreadFitsExperience } from '../product/meaningThread';
import { buildExperienceGuide } from '../guidance/experienceGuide';
import { colors } from '../design/theme';
import { impactLight, impactMedium } from '../design/haptics';
import { useBreathing, usePressSpring } from '../design/motion';
import { Glass } from './Glass';
import { CoverImage, ImageShade } from './CoverImage';
import { styles } from './styles/appStyles';
import { defaultRegion } from '../app/store';
import { RootStackParamList, routeSurfaces, surfaceRoutes } from './navigation/types';

// Gedeelde UI-primitives (ADR-058): kleine bouwstenen die meerdere schermen
// delen, ongewijzigd verhuisd uit App.tsx. Alleen BottomNav kreeg een
// navigatie-aansluiting (replace op de native-stack in plaats van setSurface);
// uiterlijk en bediening zijn identiek.

// Living Canvas (ADR-057, Horizon B): de twee ambient-lagen ademen heel traag
// (sub-perceptueel, ≥12s per cyclus). Bij reduced-motion staan ze volledig stil;
// de loops worden opgeschoond bij unmount (centraal in useBreathing).
export function AmbientBlobs({ goldOnly = false }: { goldOnly?: boolean }) {
  const goldBreath = useBreathing({ period: 13000, scaleTo: 1.06, opacityTo: 0.78 });
  const umberBreath = useBreathing({ period: 17000, scaleTo: 1.05, opacityTo: 0.82, delay: 2600 });
  return <>
    <Reanimated.View pointerEvents="none" style={[styles.ambientGold, goldBreath]} />
    {!goldOnly && <Reanimated.View pointerEvents="none" style={[styles.ambientUmber, umberBreath]} />}
  </>;
}

export function ScreenHeader({ eyebrow, title, subtitle, onProfile, profileName, accent }: { eyebrow?: string; title: string; subtitle?: string; onProfile?: () => void; profileName?: string; accent?: string }) {
  const profileInitial = (profileName ?? '').trim().slice(0, 1).toUpperCase() || 'M';
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        {eyebrow && <Text style={[styles.eyebrow, accent ? { color: accent } : null]}>{eyebrow}</Text>}
        <Text style={styles.screenTitle}>{title}</Text>
        {subtitle && <Text style={styles.screenSubtitle}>{subtitle}</Text>}
      </View>
      {onProfile && <Pressable accessibilityLabel="Open profiel" onPress={onProfile} style={styles.avatar}><Text style={styles.avatarText}>{profileInitial}</Text></Pressable>}
    </View>
  );
}

export function LiveWorldBar({ snapshot, loading, onRefresh }: { snapshot: LiveWorldSnapshot | null; loading: boolean; onRefresh?: () => Promise<boolean> }) {
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

export function NavGlyph({ kind, active }: { kind: Surface; active: boolean }) {
  const color = active ? colors.accent : colors.muted;
  const name = kind === 'now' ? 'disc-outline' : kind === 'today' ? 'sunny-outline' : kind === 'discover' ? 'compass-outline' : 'book-outline';
  return <Ionicons name={name} size={21} color={color} />;
}

export function ExperienceTile({ experience, large, onPress }: { experience: Experience; large?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.experienceTile}><CoverImage uri={experience.image} style={[styles.tileImage, large && styles.tileImageLarge]} imageStyle={styles.tileImageStyle}><ImageShade />{experience.generation && <View style={styles.generatedTileBadge}><Ionicons name="sparkles" size={11} color={colors.onImageAccent} /><Text style={[styles.generatedTileBadgeText, styles.onImageAccentText]}>VOOR DIT MOMENT GEMAAKT</Text></View>}<View style={styles.tileCopy}><Pill label={experience.kind.toUpperCase()} accent={experience.accent} /><Text style={[styles.tileTitle, styles.onImageText]}>{experience.title}</Text><Text style={[styles.tilePromise, styles.onImageMutedText]}>{experience.promise}</Text><View style={[styles.iconMetaRow, { marginTop: 14 }]}><Text style={[styles.tileMeta, styles.onImageText]}>{experience.duration} min · {experience.effort}</Text><Ionicons name="arrow-forward" size={12} color={colors.onImage} /></View></View></CoverImage></Pressable>;
}

export function CapsuleShapePreview({ experience }: { experience: Experience }) {
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

export function GeneratedCapsulePreview({ experience }: { experience: Experience }) {
  const guide = buildExperienceGuide(experience, 0);
  return <View style={styles.generatedJourneyCard}>
    <View style={styles.generatedJourneyHeader}><View><Text style={styles.generatedJourneyEyebrow}>COMPLETE ERVARINGSCAPSULE</Text><Text style={styles.generatedJourneyTitle}>Van beginnen tot herinneren</Text></View><Text style={styles.generatedJourneyCount}>{experience.steps.length} stappen</Text></View>
    <View style={styles.generatedJourneyStages}>
      {experience.steps.slice(0, 3).map((step, index) => <View key={`${step.title}-${index}`} style={styles.generatedJourneyStage}><View style={[styles.generatedJourneyNumber, { borderColor: experience.accent }]}><Text style={styles.generatedJourneyNumberText}>{index + 1}</Text></View><View style={styles.flex}><Text style={styles.generatedJourneyStageTitle}>{step.title}</Text><Text numberOfLines={2} style={styles.generatedJourneyStageBody}>{step.instruction}</Text></View></View>)}
    </View>
    <Text style={styles.generatedJourneyCoverage}>{guide.coverageLabel} · {guide.compositionLabel ?? 'Gecontroleerd ervaringscontract'} · daarna optionele herinnering</Text>
  </View>;
}

export function Pill({ label, accent }: { label: string; accent: string }) { return <View style={[styles.pill, { borderColor: accent }]}><View style={[styles.pillDot, { backgroundColor: accent }]} /><Text style={[styles.pillText, { color: accent }]}>{label}</Text></View>; }
export function MiniFact({ value, label, onImage = false }: { value: string; label: string; onImage?: boolean }) { return <View style={styles.miniFact}><Text numberOfLines={1} style={[styles.miniFactValue, onImage && styles.miniFactValueOnImage]}>{value}</Text><Text style={[styles.miniFactLabel, onImage && styles.miniFactLabelOnImage]}>{label}</Text></View>; }
export function MeaningThreadCard({ experience, compact = false, reflective = false }: { experience: Experience; compact?: boolean; reflective?: boolean }) {
  const thread = experience.meaningThread;
  if (!thread || !meaningThreadFitsExperience(experience)) return null;
  const horizon = thread.horizon === 'near' ? 'VOOR DE KOMENDE TIJD' : thread.horizon === 'growth' ? 'EEN RICHTING WAARIN JE WILT GROEIEN' : 'WAT JIJ BELANGRIJK NOEMT';
  return <View style={[styles.meaningThreadCard, compact && styles.meaningThreadCompact]}><Text style={styles.meaningThreadEyebrow}>{reflective ? 'RAAKTE DIT AAN WAT JIJ BELANGRIJK VINDT?' : horizon}</Text><Text style={styles.meaningThreadLabel}>{thread.label}</Text><Text style={styles.meaningThreadReason}>{reflective ? 'Geen score en geen verplicht doel. Alleen een draad die je kunt herkennen, corrigeren of laten rusten.' : `${thread.reason}. Dit is gebaseerd op woorden die jij zelf hebt gekozen.`}</Text></View>;
}
export function ChoiceChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <Pressable onPress={() => { impactLight(); onPress(); }} style={[styles.choiceChip, selected && styles.choiceChipSelected, selected && { backgroundColor: colors.accentSoft }]}><Text style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>{label}</Text></Pressable>; }
export function DirectionEditor({ horizon, values, paused, onTogglePause, onSave }: { horizon: keyof typeof directionLabels; values: string[]; paused: string[]; onTogglePause: (value: string) => void; onSave: (values: string[]) => void }) {
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
export function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  const press = usePressSpring();
  return <Animated.View style={press.animatedStyle}><Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} onPress={() => { impactMedium(); onPress(); }} onPressIn={press.onPressIn} onPressOut={press.onPressOut} style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]}><Text style={[styles.primaryButtonText, disabled && styles.primaryButtonTextDisabled]}>{label}</Text>{!disabled && <Ionicons name="arrow-forward" size={20} color={colors.onAccent} />}</Pressable></Animated.View>;
}
export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const press = usePressSpring({ pressedScale: 0.975 });
  return <Animated.View style={press.animatedStyle}><Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{label}</Text></Pressable></Animated.View>;
}
export function BackButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.backButton}><Ionicons name="chevron-back" size={15} color={colors.bone} /><Text style={styles.backButtonText}>{label}</Text></Pressable>; }
export function ProfileRow({ label, value }: { label: string; value: string }) { return <View style={styles.profileRow}><Text style={styles.profileLabel}>{label}</Text><Text style={styles.profileValue}>{value}</Text></View>; }

// Tab-achtige wissel (ADR-058): de bestaande bottomNav stuurt nu de navigator
// aan. De actieve tab volgt uit de huidige route; een tabdruk vervangt het
// surfacescherm via StackActions.replace — zelfde gedrag als de vroegere
// directe wissel (geen push-historie, Android-back verlaat de app), zelfde
// uiterlijk (echt glas via expo-blur met rustige web-fallback).
export function BottomNav() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const activeRoute = useNavigationState((state) => state.routes[state.index]?.name);
  const surface = routeSurfaces[activeRoute as keyof RootStackParamList] ?? 'now';
  const items: Array<{ id: Surface; label: string }> = [
    { id: 'now', label: 'Nu' }, { id: 'today', label: 'Vandaag' },
    { id: 'discover', label: 'Ontdekken' }, { id: 'lifebook', label: 'Leefboek' },
  ];
  return <Glass intensity={48} fallbackColor={colors.glassNav} style={styles.bottomNav}>{items.map((item) => {
    const active = surface === item.id;
    return <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: active }} onPress={() => { impactLight(); if (!active) navigation.dispatch(StackActions.replace(surfaceRoutes[item.id])); }} style={styles.navItem}><View style={[styles.navIconShell, active && styles.navIconShellActive]}><NavGlyph kind={item.id} active={active} /></View><Text style={[styles.navLabel, active && styles.navActive]}>{item.label}</Text></Pressable>;
  })}</Glass>;
}
