import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography } from '../design/theme';
import { useReducedMotion } from '../design/motion';
import { Glass } from '../ui/Glass';
import { CoverImage, ImageShade } from '../ui/CoverImage';
import { ExperienceGuide, GuideDepth, guideMomentStageLabels } from './experienceGuide';

// Gids-sheet met fysica (ADR-057, Horizon B): opent met een slide-up spring,
// is drag-to-dismiss via een verticale pan op de greepzone (velocity-aware) en
// de scrim fade is gekoppeld aan de drag-positie. De pan zit bewust alleen op
// de greepzone zodat de ScrollView-inhoud nooit met het gebaar concurreert.
// Fallbacks blijven: de sluitknop en de backdrop-tap sluiten altijd — ook op
// web, waar muis- en touchgebaren beperkter zijn. Onder de sheet ligt echt
// glas (expo-blur) met de vroegere panel-tint als rgba-fallback.
// Bij reduced-motion opent en sluit de sheet direct, zonder veerbeweging.

const SHEET_MAX_RATIO = 0.72;

export function ExperienceGuidePanel({ guide, depth, accent, image, onClose }: { guide: ExperienceGuide; depth: GuideDepth; accent: string; image?: string; onClose: () => void }) {
  const [sourceStatus, setSourceStatus] = useState('');
  const { height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const sheetTravel = Math.max(320, Math.round(height * SHEET_MAX_RATIO) + 60);
  const translateY = useSharedValue(reduced ? 0 : sheetTravel);
  const closing = useSharedValue(false);

  useEffect(() => {
    if (reduced) { translateY.value = 0; return undefined; }
    translateY.value = withSpring(0, { damping: 30, stiffness: 240, mass: 0.9 });
    return () => cancelAnimation(translateY);
  }, [reduced, sheetTravel, translateY]);

  const close = () => {
    if (closing.value) return;
    closing.value = true;
    onClose();
  };

  const pan = Gesture.Pan()
    .activeOffsetY(12)
    .failOffsetX([-18, 18])
    .onUpdate((event) => {
      'worklet';
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      'worklet';
      const shouldDismiss = event.translationY > sheetTravel * 0.28 || event.velocityY > 850;
      if (shouldDismiss) {
        if (reduced) {
          runOnJS(close)();
          return;
        }
        translateY.value = withTiming(sheetTravel, { duration: 240 }, (finished) => {
          if (finished) runOnJS(close)();
        });
      } else {
        translateY.value = reduced ? 0 : withSpring(0, { damping: 26, stiffness: 260, mass: 0.8, velocity: event.velocityY });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, sheetTravel], [1, 0.12], 'clamp'),
  }));

  const activeEvidence = guide.evidence.filter((item) => item.freshness === 'current');
  const observedLabel = (value: string) => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString('nl-NL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'tijd onbekend';
  };
  return <View style={styles.overlay} accessibilityViewIsModal>
    <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]} />
    <Pressable accessibilityLabel="Sluit de gids" onPress={close} style={styles.dismissArea} />
    <Reanimated.View style={[styles.sheetFrame, sheetStyle]}>
      <Glass intensity={38} fallbackColor="rgba(252,250,245,0.94)" style={styles.sheet}>
        <GestureDetector gesture={pan}>
          <View accessibilityLabel="Sleep de gids omlaag om te sluiten" style={styles.dragZone}>
            <View style={styles.handle} />
          </View>
        </GestureDetector>
        <View style={styles.header}>
          {image ? <CoverImage uri={image} style={styles.headerImage} imageStyle={styles.headerImageStyle}><ImageShade /></CoverImage> : null}
          <View style={styles.flex}><Text style={styles.eyebrow}>GIDS VOOR DIT MOMENT</Text><Text style={styles.title}>{guide.title}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Sluit de gids" onPress={close} style={styles.close}><Ionicons name="close" size={22} color={colors.bone} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.section}>NU NODIG</Text>
          <Text style={styles.stepTitle}>{guide.currentStep.title}</Text>
          <Text style={styles.body}>{guide.currentStep.instruction}</Text>
          {depth !== 'quiet' && guide.currentInsight ? <View style={styles.card}>
            <Text style={styles.cardTitle}>{guide.currentInsight.title}</Text>
            <Text style={styles.body}>{guide.currentInsight.body}</Text>
            {guide.currentInsight.sourceUrl ? <Pressable accessibilityRole="link" onPress={() => Linking.openURL(guide.currentInsight!.sourceUrl!).catch(() => setSourceStatus('De bron kon niet worden geopend.'))}><Text style={[styles.source, { color: accent }]}>{guide.currentInsight.sourceLabel} · Bekijk bron <Ionicons name="open-outline" size={11} color={accent} /></Text></Pressable> : <Text style={styles.source}>{guide.currentInsight.sourceKind === 'live' ? 'Actuele bron' : guide.currentInsight.sourceKind === 'curator' ? 'Plaatskennis' : 'Redactioneel'} · {guide.currentInsight.sourceLabel}</Text>}
          </View> : null}
          {depth !== 'quiet' && activeEvidence.length ? <View style={styles.card}>
            <Text style={styles.section}>WAT DE WERELD NU LAAT ZIEN</Text>
            {activeEvidence.map((item) => <Pressable accessibilityRole="link" accessibilityLabel={`Open bron ${item.sourceName}`} onPress={async () => { setSourceStatus(''); try { await Linking.openURL(item.sourceUrl); } catch { setSourceStatus('De bron kon niet worden geopend. De ervaring blijft zonder deze bron bruikbaar.'); } }} key={`${item.sourceName}-${item.label}`} style={styles.item}><View style={[styles.dot, { backgroundColor: accent }]} /><View style={styles.flex}><Text style={styles.itemTitle}>{item.label}</Text><Text style={styles.source}>{item.sourceName} · {item.freshnessLabel} · {observedLabel(item.observedAt)}</Text><Text style={[styles.source, { color: accent }]}>Bekijk bron <Ionicons name="open-outline" size={11} color={accent} /></Text></View></Pressable>)}
            {sourceStatus ? <Text accessibilityLiveRegion="polite" style={styles.caution}>{sourceStatus}</Text> : null}
            <Text style={styles.caution}>Een waarneming of verwachting is context, geen garantie. Volg ter plaatse altijd actuele aanwijzingen.</Text>
          </View> : null}
          {depth === 'deep' && guide.moments.length ? <View style={styles.card}>
            <Text style={styles.section}>GIDS MOMENTEN OM VERDER TE KIJKEN</Text>
            {guide.moments.map((moment, index) => <View key={`${moment.insight.topic}-${moment.insight.title}`} style={styles.insight}>
              <Text style={styles.momentEyebrow}>MOMENT {index + 1} · {guideMomentStageLabels[moment.stage]}</Text>
              <Text style={styles.momentTitle}>{moment.insight.title}</Text>
              <Text style={styles.momentStep}>Hoort bij de stap “{moment.stepTitle}”.</Text>
              <Text style={styles.body}>{moment.insight.body}</Text>
              {moment.insight.sourceUrl ? <Pressable accessibilityRole="link" onPress={() => Linking.openURL(moment.insight.sourceUrl!).catch(() => setSourceStatus('De bron kon niet worden geopend.'))}><Text style={[styles.source, { color: accent }]}>{moment.insight.sourceLabel} · Bekijk bron <Ionicons name="open-outline" size={11} color={accent} /></Text></Pressable> : <Text style={styles.source}>{moment.insight.sourceKind === 'live' ? 'Actuele bron' : moment.insight.sourceKind === 'curator' ? 'Plaatskennis' : 'Redactioneel'} · {moment.insight.sourceLabel}</Text>}
            </View>)}
          </View> : null}
          {depth === 'deep' ? <View style={styles.card}>
            <Text style={styles.section}>PRAKTISCH</Text>
            {guide.practical.map((item) => <View key={item} style={styles.item}><View style={[styles.dot, { backgroundColor: accent }]} /><Text style={styles.body}>{item}</Text></View>)}
          </View> : null}
          {guide.evidence.some((item) => item.freshness !== 'current') && depth === 'deep' ? <Text style={styles.expired}>Verlopen broninformatie is bewust niet als actuele aanwijzing getoond.</Text> : null}
        </ScrollView>
      </Glass>
    </Reanimated.View>
  </View>;
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 30, justifyContent: 'flex-end' },
  scrim: { backgroundColor: 'rgba(5,8,7,0.52)' },
  dismissArea: { flex: 1 },
  sheetFrame: { maxHeight: '72%', minHeight: 300, borderTopLeftRadius: 30, borderTopRightRadius: 30, shadowColor: colors.shadow, shadowOpacity: 0.24, shadowRadius: 28, shadowOffset: { width: 0, height: -10 } },
  sheet: { flexShrink: 1, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingBottom: 18 },
  dragZone: { minHeight: 44, justifyContent: 'center' },
  handle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', backgroundColor: colors.line },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 }, flex: { flex: 1 },
  headerImage: { width: 64, height: 64, borderRadius: radii.control, overflow: 'hidden' },
  headerImageStyle: { borderRadius: radii.control },
  eyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 1.25, fontWeight: '700', fontFamily: typography.family }, title: { color: colors.bone, fontSize: 25, lineHeight: 31, fontWeight: '700', fontFamily: typography.displayFamily, marginTop: 5 },
  close: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 28, gap: 14 },
  section: { color: colors.accent, fontSize: 11, letterSpacing: 1.2, fontWeight: '700', fontFamily: typography.family, marginBottom: 4 }, stepTitle: { color: colors.bone, fontSize: 23, lineHeight: 29, fontWeight: '700', fontFamily: typography.displayFamily }, body: { color: colors.bone, fontSize: 14, lineHeight: 21, fontFamily: typography.family },
  card: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 16, gap: 9 }, cardTitle: { color: colors.bone, fontSize: 17, lineHeight: 22, fontWeight: '700', fontFamily: typography.displayFamilyMedium }, source: { color: colors.muted, fontSize: 11, lineHeight: 15, fontFamily: typography.family },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, dot: { width: 7, height: 7, borderRadius: 4, marginTop: 6 }, itemTitle: { color: colors.bone, fontSize: 13, lineHeight: 18, fontFamily: typography.family }, caution: { color: colors.accentText, fontSize: 11, lineHeight: 16, marginTop: 3, fontFamily: typography.family }, insight: { gap: 6, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line }, expired: { color: colors.muted, fontSize: 11, lineHeight: 16, fontFamily: typography.family },
  // Gidsmomenten (ADR-031/059): redactionele hiërarchie met serif-titel en
  // zichtbare fase + stapkoppeling, in plaats van een platte inzichtenlijst.
  momentEyebrow: { color: colors.accent, fontSize: 10, letterSpacing: 1.15, fontWeight: '700', fontFamily: typography.family },
  momentTitle: { color: colors.bone, fontSize: 19, lineHeight: 24, fontWeight: '700', fontFamily: typography.displayFamilyMedium },
  momentStep: { color: colors.muted, fontSize: 12, lineHeight: 17, fontFamily: typography.family, fontStyle: 'italic' },
});
