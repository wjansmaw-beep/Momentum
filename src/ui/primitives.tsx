import React, { useEffect, useState } from 'react';
import { Animated, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated from 'react-native-reanimated';
import { Experience } from '../product/experienceModel';
import { LiveWorldSnapshot } from '../liveworld/liveWorld';
import { directionLabels } from '../profile/personalModel';
import { meaningThreadFitsExperience } from '../product/meaningThread';
import { buildExperienceGuide } from '../guidance/experienceGuide';
import { colors } from '../design/theme';
import { impactLight, impactMedium } from '../design/haptics';
import { useBreathing, usePressSpring } from '../design/motion';
import { CoverImage, ImageShade } from './CoverImage';
import { styles } from './styles/appStyles';
import { defaultRegion } from '../app/store';

// Gedeelde UI-primitives (ADR-058): kleine bouwstenen die meerdere schermen
// delen, ongewijzigd verhuisd uit App.tsx. De vroegere BottomNav is in fase R1
// (ADR-067) vervangen door het vijf-tab skelet in ui/NowTabBar.tsx.

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
  const liveCount = snapshot?.sources.filter((source) => source.state === 'live').length ?? 0;
  const staleCount = snapshot?.sources.filter((source) => source.state === 'stale').length ?? 0;
  const region = (snapshot?.regionLabel ?? defaultRegion.label).split(' proefcontext')[0];
  // Eén levende zin in plaats van een meetlijst (ADR-065, fase 1): dagdeel,
  // lucht en wind samengevoegd. De exacte bronwaarden blijven beschikbaar in
  // de waarom/bron-lagen van de schermen.
  const hour = new Date().getHours();
  const dayWord = hour < 6 ? 'nacht' : hour < 12 ? 'ochtend' : hour < 18 ? 'middag' : 'avond';
  const skyWord = weather
    ? [0, 1].includes(weather.weatherCode) ? 'heldere'
      : [2, 3].includes(weather.weatherCode) ? 'bewolkte'
        : [45, 48].includes(weather.weatherCode) ? 'mistige'
          : [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weather.weatherCode) ? 'natte'
            : [71, 73, 75, 77, 85, 86].includes(weather.weatherCode) ? 'witte'
              : [95, 96, 99].includes(weather.weatherCode) ? 'onstuimige' : 'zachte'
    : '';
  const windWord = weather ? (weather.windSpeed < 12 ? 'een zachte wind' : weather.windSpeed < 25 ? 'een stevige wind' : 'veel wind') : '';
  const detail = weather
    ? `Een ${skyWord} ${dayWord} rond ${region} — ${Math.round(weather.temperature)}° met ${windWord}${weather.visibilityMeters >= 8000 && [0, 1].includes(weather.weatherCode) ? ' en ver zicht' : ''}.`
    : 'Momentum kiest rustig mee, ook zonder live bronnen';
  return <View style={styles.liveWorldBar}>
    <View style={[styles.sourceState, liveCount ? styles.sourceLive : styles.sourceWaiting]} />
    <View style={styles.flex}><Text style={styles.liveWorldBarTitle}>{loading && !snapshot ? 'Je omgeving wordt bijgewerkt' : liveCount ? `Nu rond ${region}` : staleCount ? `Eerder rond ${region}` : `Ervaringen rond ${region}`}</Text><Text style={styles.liveWorldBarDetail}>{detail}</Text></View>
    {onRefresh ? <Pressable accessibilityRole="button" accessibilityLabel="Vernieuw de live wereld" disabled={loading} onPress={() => { onRefresh().catch(() => undefined); }} style={styles.liveWorldRefresh}><Ionicons name="refresh" size={16} color={colors.accent} /></Pressable> : null}
  </View>;
}

export function ExperienceTile({ experience, large, onPress }: { experience: Experience; large?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.experienceTile}><CoverImage uri={experience.image} style={[styles.tileImage, large && styles.tileImageLarge]} imageStyle={styles.tileImageStyle}><ImageShade />{experience.generation && <View style={styles.generatedTileBadge}><Ionicons name="sparkles" size={11} color={colors.onImageAccent} /><Text style={[styles.generatedTileBadgeText, styles.onImageAccentText]}>VOOR DIT MOMENT GEMAAKT</Text></View>}<View style={styles.tileCopy}><Pill label={experience.kind.toUpperCase()} accent={experience.accent} /><Text style={[styles.tileTitle, styles.onImageText]}>{experience.title}</Text><Text style={[styles.tilePromise, styles.onImageMutedText]}>{experience.promise}</Text><View style={[styles.iconMetaRow, { marginTop: 14 }]}><Text style={[styles.tileMeta, styles.onImageText]}>{experience.duration} min · {experience.effort}</Text><Ionicons name="arrow-forward" size={12} color={colors.onImage} /></View></View></CoverImage></Pressable>;
}

export function GeneratedCapsulePreview({ experience }: { experience: Experience }) {
  const guide = buildExperienceGuide(experience, 0);
  return <View style={styles.generatedJourneyCard}>
    <View style={styles.generatedJourneyHeader}><View><Text style={styles.generatedJourneyEyebrow}>DE HELE BOOG</Text><Text style={styles.generatedJourneyTitle}>Van beginnen tot herinneren</Text></View><Text style={styles.generatedJourneyCount}>{experience.steps.length} stappen</Text></View>
    <View style={styles.generatedJourneyStages}>
      {experience.steps.slice(0, 3).map((step, index) => <View key={`${step.title}-${index}`} style={styles.generatedJourneyStage}><View style={[styles.generatedJourneyNumber, { borderColor: experience.accent }]}><Text style={styles.generatedJourneyNumberText}>{index + 1}</Text></View><View style={styles.flex}><Text style={styles.generatedJourneyStageTitle}>{step.title}</Text><Text numberOfLines={2} style={styles.generatedJourneyStageBody}>{step.instruction}</Text></View></View>)}
    </View>
    <Text style={styles.generatedJourneyCoverage}>{guide.coverageLabel} · daarna een rustige herinnering</Text>
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

