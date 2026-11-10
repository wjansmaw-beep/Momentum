import { ImageCredit } from '../ImageCredit';
import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { CapsuleStep, Experience } from '../../product/experienceModel';
import type { GuideMode } from '../../guidance/adaptiveGuide';
import { colors, schemeStyles, typography } from '../../design/theme';
import { CoverImage, ImageShade } from '../CoverImage';
import { guideDestination } from '../../guidance/guideDestination';
import { GuideOrientationMap } from './GuideOrientationMap';
import { renderableBlocks } from '../../guidance/experienceRenderer';
import { NarrationPlayer } from './NarrationPlayer';
import { referenceAudio } from './referenceAudio';



export function GuideModeBar({ mode, onChange }: { mode: GuideMode; onChange: (mode: GuideMode) => void }) {
  const modes = [{ id: 'navigate', title: 'Navigate', label: 'Kaart en bestemming', icon: 'navigation' },
    { id: 'discover', title: 'Discover', label: 'Verhaal en opdracht', icon: 'book-open' },
    { id: 'immerse', title: 'Immerse', label: 'Luisteren en observeren', icon: 'headphones' }] as const;
  return <View style={s.bar} accessibilityLabel="Gidsmodi">
    {modes.map((item) => <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={item.label}
      aria-selected={mode === item.id} accessibilityState={{ selected: mode === item.id }} onPress={() => onChange(item.id)}
      style={[s.tab, mode === item.id && s.activeTab]}>
      <Feather name={item.icon} size={22} color={mode === item.id ? colors.onAccent : colors.bone} />
      <Text style={[s.tabText, mode === item.id && s.activeText]}>{item.title}</Text>
    </Pressable>)}
  </View>;
}

export function DiscoverChapter({ step, index, total, completed, onToggle, showInsight }: {
  step: CapsuleStep; index: number; total: number; completed: boolean; onToggle: () => void; showInsight: boolean;
}) {
  const [taskOpen, setTaskOpen] = useState(true);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceError, setSourceError] = useState('');
  const [depthOpen, setDepthOpen] = useState(false);
  const insight = showInsight ? step.insight : undefined;
  const blocks = renderableBlocks(step, showInsight);
  const story = blocks.find(block => block.kind === 'story');
  const depth = blocks.find(block => block.kind === 'depth');
  const evidence = blocks.find(block => block.kind === 'evidence');
  return <View style={s.read}>
    <Text style={s.kicker}>DISCOVER · {index + 1} VAN {total}</Text>
    <Text accessibilityRole="header" style={s.title}>{story?.title ?? step.title}</Text>
    {story && <Text style={s.body}>{story.text}</Text>}
    {step.meta && <Text style={s.meta}>{step.meta}</Text>}
    <View style={s.task}>
      <Pressable accessibilityRole="button" aria-expanded={taskOpen} accessibilityState={{ expanded: taskOpen }} onPress={() => setTaskOpen(!taskOpen)} style={s.disclosure}>
        <Feather name="compass" size={22} color={colors.bone} /><Text style={s.disclosureText}>Jouw ontdekkingsopdracht</Text>
        <Feather name={taskOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.bone} />
      </Pressable>
      <Text style={s.body}>{taskOpen ? step.instruction : step.instruction.split(/(?<=[.!?])\s/)[0]}</Text>
      {taskOpen && <Pressable accessibilityRole="checkbox" aria-checked={completed} accessibilityState={{ checked: completed }}
        onPress={onToggle} style={s.disclosure}>
        <Feather name={completed ? 'check-square' : 'square'} size={23} color={colors.bone} />
        <Text style={s.body}>Dit heb ik gedaan</Text>
      </Pressable>}
    </View>
    {depth && <>
      <Pressable accessibilityRole="button" aria-expanded={depthOpen} accessibilityState={{ expanded: depthOpen }} onPress={() => setDepthOpen(!depthOpen)} style={s.disclosure}>
        <Text style={s.disclosureText}>Vertel me meer</Text><Feather name={depthOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.bone} />
      </Pressable>
      {depthOpen && <Text style={s.body}>{depth.text}</Text>}
    </>}
    {insight && evidence && <>
      <Pressable accessibilityRole="button" aria-expanded={sourceOpen} accessibilityState={{ expanded: sourceOpen }} onPress={() => setSourceOpen(!sourceOpen)} style={s.disclosure}>
        <Feather name="file-text" size={19} color={colors.bone} /><Text style={s.source}>Verhaal en bron · {insight.sourceLabel}</Text>
      </Pressable>
      {sourceOpen && <View>
        <Text style={s.source}>{evidence.provenance} · {evidence.label}{evidence.reviewedAt ? ` · nagekeken ${evidence.reviewedAt}` : ''}</Text>
        {evidence.url && <Pressable accessibilityRole="link" onPress={() => {
          setSourceError(''); Linking.openURL(evidence.url!).catch(() => setSourceError('De bron kon niet worden geopend. Probeer het later opnieuw.'));
        }} style={s.disclosure}><Text style={s.link}>Bekijk de oorspronkelijke bron ↗</Text></Pressable>}
        {!!sourceError && <Text accessibilityLiveRegion="polite" style={s.source}>{sourceError}</Text>}
      </View>}
    </>}
  </View>;
}

export function GuideModeScene({ mode, experience, step, index, onDiscover, onQuiet, onRoute, onBack, onFinish, routeStatus }: {
  mode: 'navigate' | 'immerse'; experience: Experience; step: CapsuleStep; index: number;
  onDiscover: () => void; onQuiet: () => void; onRoute: () => void; onBack: () => void; onFinish: () => void; routeStatus: string;
}) {
  const [observing, setObserving] = useState(false);
  const place = experience.visitPlace;
  const hasRoute = Boolean(place || experience.routePlan?.destination || experience.routePlan?.destinationName);
  const destination = place ? guideDestination({ destination: place, destinationName: place.name }) : guideDestination(experience.routePlan);
  const [placeError, setPlaceError] = useState(false);
  const narration = referenceAudio(experience.id, step);
  return <ScrollView contentContainerStyle={s.sceneScroll}>
    <CoverImage uri={experience.image} style={s.hero}>
      <ImageShade />
      <View style={s.heroHead}><Pressable accessibilityRole="button" accessibilityLabel="Terug naar de voorbereiding" onPress={onBack} style={s.circle}><Feather name="arrow-left" size={22} color={colors.bone} /></Pressable>
        <Text style={s.brand}>MOMENTUM</Text><Pressable accessibilityRole="button" accessibilityLabel="Ervaring afronden" onPress={onFinish} style={s.circle}><Feather name="check" size={22} color={colors.bone} /></Pressable></View>
      <View style={s.heroCopy}><Text style={s.heroMeta}>Hoofdstuk {index + 1} van {experience.steps.length}</Text><Text style={s.heroTitle}>{experience.title}</Text></View>
    </CoverImage><ImageCredit uri={experience.image} />
    <View style={s.sceneBody}>
      <Text style={s.heroMeta}>{mode === 'navigate' ? 'NAVIGATE' : 'IMMERSE'}</Text>
      <Text accessibilityRole="header" style={s.sceneTitle}>{mode === 'navigate' ? place?.name ?? experience.routePlan?.destinationName ?? step.title : observing ? 'Geef de plek even de ruimte' : 'Het verhaal om je heen'}</Text>
      {mode === 'navigate' ? <>
        {destination && <GuideOrientationMap key={`${destination.latitude}:${destination.longitude}`} destination={destination} />}
        {place && <>
          <Text style={s.sceneText}>{place.address}</Text><Text style={s.sceneText}>{place.note}</Text>
          <Action title="Bekijk actuele bezoekersinformatie" onPress={() => { setPlaceError(false); Linking.openURL(place.sourceUrl).catch(() => setPlaceError(true)); }} />
          <Action title="Bron van het kaartpunt" onPress={() => { setPlaceError(false); Linking.openURL(place.coordinateSourceUrl).catch(() => setPlaceError(true)); }} />
          {placeError && <Text accessibilityLiveRegion="polite" style={s.sceneText}>De bron kon niet worden geopend.</Text>}
        </>}
        <Text style={s.sceneText}>{hasRoute ? 'De routeapp leidt je naar de bestemming. Kies zelf wanneer je het verhaal opent.' : 'Er is geen gecontroleerde bestemming gekoppeld. Je kunt de ontdekking handmatig openen.'}</Text>
        {hasRoute && <Action title="Open route in Kaarten" onPress={onRoute} />}
        {!!routeStatus && <Text accessibilityLiveRegion="polite" style={s.sceneText}>{routeStatus}</Text>}
        <Action title={hasRoute ? 'Ik ben aangekomen' : 'Open de ontdekking'} onPress={onDiscover} />
      </> : <>
        <View style={s.segments}>{[false, true].map((value) => <Pressable key={String(value)} accessibilityRole="button" aria-pressed={observing === value} accessibilityState={{ selected: observing === value }}
          onPress={() => setObserving(value)} style={[s.segment, observing === value && s.activeTab]}><Text style={[s.tabText, observing === value && s.activeText]}>{value ? 'Observeren' : 'Luisteren'}</Text></Pressable>)}</View>
        {!observing && narration ? <NarrationPlayer key={narration.id} source={narration.source} transcript={narration.transcript} /> : <Text style={s.sceneText}>{observing ? step.editorial?.observation || step.instruction : 'Audio is nog niet beschikbaar. Je kunt de verhaaltekst lezen of kiezen voor observeren.'}</Text>}
        <Action title={observing ? 'Telefoon weg' : 'Lees de verhaaltekst'} onPress={observing ? onQuiet : onDiscover} />
      </>}
    </View>
  </ScrollView>;
}

function Action({ title, onPress }: { title: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={s.action}><Text style={s.actionText}>{title}</Text><Feather name="arrow-right" size={20} color={colors.onAccent} /></Pressable>;
}

const s = schemeStyles(({ colors: c }) => StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: c.ink, padding: 10, gap: 6 },
  tab: { flex: 1, minHeight: 64, padding: 10, alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 24 },
  activeTab: { backgroundColor: c.accent }, activeText: { color: c.onAccent }, tabText: { color: c.bone, fontSize: 13 },
  read: { backgroundColor: c.ink, borderRadius: 26, padding: 20, gap: 12 },
  kicker: { color: c.muted, fontSize: 12, letterSpacing: 2 }, title: { color: c.bone, fontSize: 30, lineHeight: 37, fontFamily: typography.displayFamily },
  body: { color: c.bone, fontSize: 17, lineHeight: 27, flexShrink: 1 }, meta: { color: c.muted, fontSize: 14 },
  task: { backgroundColor: c.panelRaised, borderRadius: 18, padding: 15, gap: 8 },
  disclosure: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  disclosureText: { fontFamily: typography.displayFamily, fontSize: 19, color: c.bone, flex: 1 },
  source: { color: c.muted, fontSize: 13, lineHeight: 20, flexShrink: 1 }, link: { color: c.muted, fontSize: 15, textDecorationLine: 'underline' },
  sceneScroll: { flexGrow: 1, backgroundColor: c.ink }, hero: { minHeight: 310, justifyContent: 'space-between' },
  heroHead: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  circle: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center' },
  brand: { fontFamily: typography.displayFamily, color: c.onImage, fontSize: 17, letterSpacing: 2 },
  heroCopy: { padding: 22, backgroundColor: c.ink, gap: 10 }, heroMeta: { color: c.bone, fontSize: 13, letterSpacing: 1 },
  heroTitle: { fontFamily: typography.displayFamily, color: c.bone, fontSize: 32, lineHeight: 39 },
  sceneBody: { padding: 22, gap: 17 }, sceneTitle: { color: c.bone, fontFamily: typography.displayFamily, fontSize: 28, lineHeight: 35 },
  sceneText: { color: c.bone, fontSize: 16, lineHeight: 25 },
  action: { minHeight: 52, borderRadius: 28, backgroundColor: c.accent, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  actionText: { color: c.onAccent, fontSize: 16, flexShrink: 1 }, segments: { flexDirection: 'row', gap: 5 },
  segment: { flex: 1, minHeight: 48, borderRadius: 24, padding: 12, alignItems: 'center', justifyContent: 'center' },
}));
