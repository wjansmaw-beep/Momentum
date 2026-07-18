import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, typography } from '../design/theme';
import { ExperienceGuide, GuideDepth } from './experienceGuide';

export function ExperienceGuidePanel({ guide, depth, accent, onClose }: { guide: ExperienceGuide; depth: GuideDepth; accent: string; onClose: () => void }) {
  const [sourceStatus, setSourceStatus] = useState('');
  const activeEvidence = guide.evidence.filter((item) => item.freshness === 'current');
  const visibleInsights = depth === 'deep' ? guide.furtherInsights : [];
  const observedLabel = (value: string) => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString('nl-NL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'tijd onbekend';
  };
  return <View style={styles.overlay} accessibilityViewIsModal>
    <Pressable accessibilityLabel="Sluit de gids" onPress={onClose} style={styles.dismissArea} />
    <View style={styles.sheet}>
    <View style={styles.handle} />
    <View style={styles.header}>
      <View style={styles.flex}><Text style={styles.eyebrow}>GIDS VOOR DIT MOMENT</Text><Text style={styles.title}>{guide.title}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Sluit de gids" onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
    </View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.section}>NU NODIG</Text>
      <Text style={styles.stepTitle}>{guide.currentStep.title}</Text>
      <Text style={styles.body}>{guide.currentStep.instruction}</Text>
      {depth !== 'quiet' && guide.currentInsight ? <View style={styles.card}>
        <Text style={styles.cardTitle}>{guide.currentInsight.title}</Text>
        <Text style={styles.body}>{guide.currentInsight.body}</Text>
        {guide.currentInsight.sourceUrl ? <Pressable accessibilityRole="link" onPress={() => Linking.openURL(guide.currentInsight!.sourceUrl!).catch(() => setSourceStatus('De bron kon niet worden geopend.'))}><Text style={[styles.source, { color: accent }]}>{guide.currentInsight.sourceLabel} · Bekijk bron ↗</Text></Pressable> : <Text style={styles.source}>{guide.currentInsight.sourceKind === 'live' ? 'Actuele bron' : guide.currentInsight.sourceKind === 'curator' ? 'Plaatskennis' : 'Redactioneel'} · {guide.currentInsight.sourceLabel}</Text>}
      </View> : null}
      {depth !== 'quiet' && activeEvidence.length ? <View style={styles.card}>
        <Text style={styles.section}>WAT DE WERELD NU LAAT ZIEN</Text>
        {activeEvidence.map((item) => <Pressable accessibilityRole="link" accessibilityLabel={`Open bron ${item.sourceName}`} onPress={async () => { setSourceStatus(''); try { await Linking.openURL(item.sourceUrl); } catch { setSourceStatus('De bron kon niet worden geopend. De ervaring blijft zonder deze bron bruikbaar.'); } }} key={`${item.sourceName}-${item.label}`} style={styles.item}><View style={[styles.dot, { backgroundColor: accent }]} /><View style={styles.flex}><Text style={styles.itemTitle}>{item.label}</Text><Text style={styles.source}>{item.sourceName} · {item.freshnessLabel} · {observedLabel(item.observedAt)}</Text><Text style={[styles.source, { color: accent }]}>Bekijk bron ↗</Text></View></Pressable>)}
        {sourceStatus ? <Text accessibilityLiveRegion="polite" style={styles.caution}>{sourceStatus}</Text> : null}
        <Text style={styles.caution}>Een waarneming of verwachting is context, geen garantie. Volg ter plaatse altijd actuele aanwijzingen.</Text>
      </View> : null}
      {depth === 'deep' && visibleInsights.length ? <View style={styles.card}>
        <Text style={styles.section}>MEER OM OP TE LETTEN</Text>
        {visibleInsights.map((item) => <View key={`${item.topic}-${item.title}`} style={styles.insight}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.body}>{item.body}</Text>{item.sourceUrl ? <Pressable accessibilityRole="link" onPress={() => Linking.openURL(item.sourceUrl!).catch(() => setSourceStatus('De bron kon niet worden geopend.'))}><Text style={[styles.source, { color: accent }]}>{item.sourceLabel} · Bekijk bron ↗</Text></Pressable> : <Text style={styles.source}>{item.sourceLabel}</Text>}</View>)}
      </View> : null}
      {depth === 'deep' ? <View style={styles.card}>
        <Text style={styles.section}>PRAKTISCH</Text>
        {guide.practical.map((item) => <View key={item} style={styles.item}><View style={[styles.dot, { backgroundColor: accent }]} /><Text style={styles.body}>{item}</Text></View>)}
      </View> : null}
      {guide.evidence.some((item) => item.freshness !== 'current') && depth === 'deep' ? <Text style={styles.expired}>Verlopen broninformatie is bewust niet als actuele aanwijzing getoond.</Text> : null}
    </ScrollView>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 30, justifyContent: 'flex-end', backgroundColor: 'rgba(5,8,7,0.52)' },
  dismissArea: { flex: 1 },
  sheet: { maxHeight: '72%', minHeight: 300, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: colors.panel, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18, shadowColor: colors.shadow, shadowOpacity: 0.24, shadowRadius: 28, shadowOffset: { width: 0, height: -10 } },
  handle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', backgroundColor: colors.line, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 }, flex: { flex: 1 },
  eyebrow: { color: colors.green, fontSize: 11, letterSpacing: 1.25, fontWeight: '700', fontFamily: typography.family }, title: { color: colors.bone, fontSize: 25, lineHeight: 31, fontWeight: '700', fontFamily: typography.family, marginTop: 5 },
  close: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }, closeText: { color: colors.bone, fontSize: 27, lineHeight: 30, fontFamily: typography.family },
  content: { paddingBottom: 28, gap: 14 },
  section: { color: colors.green, fontSize: 11, letterSpacing: 1.2, fontWeight: '700', fontFamily: typography.family, marginBottom: 4 }, stepTitle: { color: colors.bone, fontSize: 23, lineHeight: 29, fontWeight: '700', fontFamily: typography.family }, body: { color: colors.bone, fontSize: 14, lineHeight: 21, fontFamily: typography.family },
  card: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 16, gap: 9 }, cardTitle: { color: colors.bone, fontSize: 16, fontWeight: '700', fontFamily: typography.family }, source: { color: colors.muted, fontSize: 10, lineHeight: 15, fontFamily: typography.family },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, dot: { width: 7, height: 7, borderRadius: 4, marginTop: 6 }, itemTitle: { color: colors.bone, fontSize: 13, lineHeight: 18, fontFamily: typography.family }, caution: { color: colors.gold, fontSize: 11, lineHeight: 16, marginTop: 3, fontFamily: typography.family }, insight: { gap: 6, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.line }, expired: { color: colors.muted, fontSize: 11, lineHeight: 16, fontFamily: typography.family },
});
