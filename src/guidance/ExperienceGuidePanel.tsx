import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ExperienceGuide, GuideDepth } from './experienceGuide';

const palette = { ink: '#071013', panel: '#101A1D', bone: '#F4EEE3', muted: '#AEB4AE', green: '#A4C55D', gold: '#D9B36B', line: 'rgba(244,238,227,0.14)' };

export function ExperienceGuidePanel({ guide, depth, accent, onClose }: { guide: ExperienceGuide; depth: GuideDepth; accent: string; onClose: () => void }) {
  const [sourceStatus, setSourceStatus] = useState('');
  const activeEvidence = guide.evidence.filter((item) => item.freshness === 'current');
  const visibleInsights = depth === 'deep' ? guide.furtherInsights : [];
  const observedLabel = (value: string) => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString('nl-NL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'tijd onbekend';
  };
  return <View style={styles.overlay} accessibilityViewIsModal>
    <View style={styles.header}>
      <View style={styles.flex}><Text style={styles.eyebrow}>RAADPLEEGBARE GIDS</Text><Text style={styles.title}>{guide.title}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Sluit de gids" onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
    </View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.coverage, { borderColor: accent }]}><Text style={[styles.coverageText, { color: accent }]}>{guide.coverageLabel}</Text></View>
      {guide.compositionLabel ? <Text style={styles.composition}>{guide.compositionLabel}. Feiten blijven gekoppeld aan hun bron.</Text> : null}
      <Text style={styles.section}>NU BELANGRIJK</Text>
      <Text style={styles.stepTitle}>{guide.currentStep.title}</Text>
      <Text style={styles.body}>{guide.currentStep.instruction}</Text>
      {depth !== 'quiet' && guide.currentInsight ? <View style={styles.card}>
        <Text style={styles.cardTitle}>{guide.currentInsight.title}</Text>
        <Text style={styles.body}>{guide.currentInsight.body}</Text>
        <Text style={styles.source}>{guide.currentInsight.sourceKind === 'live' ? 'Actuele bron' : 'Redactioneel'} · {guide.currentInsight.sourceLabel}</Text>
      </View> : null}
      {depth !== 'quiet' && activeEvidence.length ? <View style={styles.card}>
        <Text style={styles.section}>WAT DE WERELD NU LAAT ZIEN</Text>
        {activeEvidence.map((item) => <Pressable accessibilityRole="link" accessibilityLabel={`Open bron ${item.sourceName}`} onPress={async () => { setSourceStatus(''); try { await Linking.openURL(item.sourceUrl); } catch { setSourceStatus('De bron kon niet worden geopend. De ervaring blijft zonder deze bron bruikbaar.'); } }} key={`${item.sourceName}-${item.label}`} style={styles.item}><View style={[styles.dot, { backgroundColor: accent }]} /><View style={styles.flex}><Text style={styles.itemTitle}>{item.label}</Text><Text style={styles.source}>{item.sourceName} · {item.freshnessLabel} · {observedLabel(item.observedAt)}</Text><Text style={[styles.source, { color: accent }]}>Bekijk bron ↗</Text></View></Pressable>)}
        {sourceStatus ? <Text accessibilityLiveRegion="polite" style={styles.caution}>{sourceStatus}</Text> : null}
        <Text style={styles.caution}>Een waarneming of verwachting is context, geen garantie. Volg ter plaatse altijd actuele aanwijzingen.</Text>
      </View> : null}
      {depth === 'deep' && visibleInsights.length ? <View style={styles.card}>
        <Text style={styles.section}>MEER OM OP TE LETTEN</Text>
        {visibleInsights.map((item) => <View key={`${item.topic}-${item.title}`} style={styles.insight}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.body}>{item.body}</Text><Text style={styles.source}>{item.sourceLabel}</Text></View>)}
      </View> : null}
      {depth === 'deep' ? <View style={styles.card}>
        <Text style={styles.section}>PRAKTISCH</Text>
        {guide.practical.map((item) => <View key={item} style={styles.item}><View style={[styles.dot, { backgroundColor: accent }]} /><Text style={styles.body}>{item}</Text></View>)}
      </View> : null}
      {guide.evidence.some((item) => item.freshness !== 'current') && depth === 'deep' ? <Text style={styles.expired}>Verlopen broninformatie is bewust niet als actuele aanwijzing getoond.</Text> : null}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 30, backgroundColor: palette.ink, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }, flex: { flex: 1 },
  eyebrow: { color: palette.green, fontSize: 10, letterSpacing: 1.5, fontWeight: '700' }, title: { color: palette.bone, fontSize: 27, fontWeight: '700', marginTop: 5 },
  close: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' }, closeText: { color: palette.bone, fontSize: 27, lineHeight: 30 },
  content: { paddingBottom: 40, gap: 14 }, coverage: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }, coverageText: { fontSize: 10, fontWeight: '700' },
  section: { color: palette.green, fontSize: 9, letterSpacing: 1.35, fontWeight: '700', marginBottom: 6 }, stepTitle: { color: palette.bone, fontSize: 23, fontWeight: '700' }, body: { color: palette.bone, fontSize: 14, lineHeight: 21 },
  card: { borderRadius: 20, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.panel, padding: 16, gap: 9 }, cardTitle: { color: palette.bone, fontSize: 16, fontWeight: '700' }, source: { color: palette.muted, fontSize: 10, lineHeight: 15 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, dot: { width: 7, height: 7, borderRadius: 4, marginTop: 6 }, itemTitle: { color: palette.bone, fontSize: 13, lineHeight: 18 }, caution: { color: palette.gold, fontSize: 10, lineHeight: 15, marginTop: 3 }, composition: { color: palette.muted, fontSize: 10, lineHeight: 15, marginTop: -6 }, insight: { gap: 6, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: palette.line }, expired: { color: palette.muted, fontSize: 10, lineHeight: 15 },
});
