import { ImageCredit } from '../ImageCredit';
import { EditorialDisclosure } from '../editorial';
import React, { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { CapsuleStep, Experience } from '../../product/experienceModel';
import type { GuideMode } from '../../guidance/adaptiveGuide';
import { colors, schemeStyles, typography } from '../../design/theme';
import { currentPlace, currentDestination } from '../../guidance/placeInformation';
import { PlaceDetails, WalkingDirections } from './PlaceDetails';
import { GuideOrientationMap } from './GuideOrientationMap';
import { renderableBlocks } from '../../guidance/experienceRenderer';
import { NarrationPlayer } from './NarrationPlayer';
import { referenceAudio } from './referenceAudio';
import { resolveChapterPhoto } from '../../product/chapterPhotos';
import { localChapterImages } from './chapterImages';





export function GuideModeBar({ mode, onChange }: { mode: GuideMode; onChange: (mode: GuideMode) => void }) {
  const modes = [{ id: 'navigate', title: 'Navigate', label: 'Kaart en bestemming', icon: 'navigation' },
    { id: 'discover', title: 'Discover', label: 'Verhaal en ontdekking', icon: 'book-open' },
    { id: 'immerse', title: 'Immerse', label: 'Luisteren en observeren', icon: 'headphones' }] as const;
  return <View style={s.bar} accessibilityLabel="Gidsmodi">
    {modes.map((item) => <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={item.label}
      aria-selected={mode === item.id} accessibilityState={{ selected: mode === item.id }} onPress={() => onChange(item.id)}
      style={[s.tab, mode === item.id && s.activeTab]}>

      <Text style={[s.tabText, mode === item.id && s.activeText]}>{item.title}</Text>
    </Pressable>)}
  </View>;
}

export function GuideChapterMenu({ experience, index, onSelect }: { experience: Experience; index: number; onSelect: (index: number) => void }) {
  const [open, setOpen] = useState(false);
  return <View style={{ marginHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }}>
    <Pressable accessibilityRole="button" aria-expanded={open} accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={s.disclosure}>
      <Text style={[s.source, { flex: 1 }]}>Hoofdstuk {index + 1} van {experience.steps.length}</Text>
      <Text accessible={false} style={s.body}>{open ? '−' : '+'}</Text>
    </Pressable>
    {open && <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled>{experience.steps.map((chapter, chapterIndex) => <Pressable key={chapterIndex}
      accessibilityRole="button" accessibilityState={{ selected: index === chapterIndex }}
      onPress={() => { onSelect(chapterIndex); setOpen(false); }} style={{ minHeight: 48, paddingVertical: 12, flexDirection: 'row', gap: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }}>
      <Text style={s.source}>{chapterIndex + 1}</Text>
      <View style={{ flex: 1, gap: 3 }}><Text style={s.body}>{chapter.editorial?.introduction?.title ?? chapter.title}</Text>
        {chapter.visitPlace && <Text style={s.source}>{chapter.visitPlace.name}</Text>}
        {index === chapterIndex && <Text style={s.source}>Huidig hoofdstuk</Text>}
      </View>
    </Pressable>)}</ScrollView>}
  </View>;
}
// Historical task fields remain in sessions; reading no longer asks for completion.
export function DiscoverChapter({ step, index, total, showInsight, onObserve, experience, onNavigate }: {
  step: CapsuleStep; index: number; total: number; completed: boolean; onToggle: () => void; showInsight: boolean; onObserve?: () => void; experience?: Experience; onNavigate?: () => void;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const [sourceError, setSourceError] = useState('');
  const intro = step.editorial?.composition === 'editorial-place' ? step.editorial.introduction : undefined;
  const photo = resolveChapterPhoto(experience?.id, step);
  const blocks = renderableBlocks(step, showInsight);
  const story = blocks.find(block => block.kind === 'story');
  const depth = blocks.find(block => block.kind === 'depth');
  const evidence = blocks.find(block => block.kind === 'evidence');
  return <View style={[s.read, s.editorialRead]}>

    {photo && (!photoFailed ? <View style={[s.documentaryPhoto, { aspectRatio: photo.aspectRatio }]}><Image source={localChapterImages[photo.key]} resizeMode="contain" accessibilityLabel={photo.alt} style={{ width: '100%', height: '100%' }} onError={() => setPhotoFailed(true)} /></View> : <Text style={s.source}>Foto niet beschikbaar. Je kunt verder lezen.</Text>)}
    {experience && currentPlace(experience, step) && <Text style={s.source}>{currentPlace(experience, step)!.name}</Text>}
    <Text accessibilityRole="header" style={s.title}>{intro?.title ?? story?.title ?? step.title}</Text>
    {intro && <Text style={s.lead}>{intro.promise}</Text>}
    {story && <Text style={s.body}>{story.text}</Text>}
    {step.meta && <Text style={s.meta}>{step.meta}</Text>}
    {onNavigate && experience && currentPlace(experience, step) && <Pressable accessibilityRole="button" onPress={onNavigate} style={s.disclosure}><Text style={s.body}>Naar deze plek →</Text></Pressable>}
    {depth && <EditorialDisclosure title="Verdiep het verhaal"><Text style={s.body}>{depth.text}</Text></EditorialDisclosure>}
    <EditorialDisclosure title="Kijk eens om je heen">
      <Text style={s.body}>{step.instruction}</Text>
      {intro && <Text style={s.source}>{intro.outside}</Text>}
      {onObserve && <Pressable accessibilityRole="button" onPress={onObserve} style={s.disclosure}><Text style={s.body}>Rustig observeren →</Text></Pressable>}
    </EditorialDisclosure>
    {experience && <PlaceDetails place={currentPlace(experience, step)} />}
    {(evidence || photo) && <EditorialDisclosure title="Feiten en bronnen">
      {evidence && <>
        <Text style={s.source}>{evidence.provenance} · {evidence.label}{evidence.reviewedAt ? ' · nagekeken ' + evidence.reviewedAt : ''}</Text>
        {evidence.url && <Pressable accessibilityRole="link" onPress={() => {
          setSourceError(''); Linking.openURL(evidence.url!).catch(() => setSourceError('De bron kon niet worden geopend. Probeer het later opnieuw.'));
        }} style={s.disclosure}><Text style={s.link}>Bekijk de oorspronkelijke bron ↗</Text></Pressable>}
      </>}
      {photo && <><Text style={s.source}>{photo.caption}</Text><ImageCredit uri={photo.credit.uri} original /></>}
      {!!sourceError && <Text accessibilityLiveRegion="polite" style={s.source}>{sourceError}</Text>}
    </EditorialDisclosure>}
  </View>;
}

export function GuideModeScene({ mode, experience, step, index, onDiscover, onRoute, onBack, onFinish, routeStatus, nearby }: {
  nearby?: React.ReactNode; mode: 'navigate' | 'immerse'; experience: Experience; step: CapsuleStep; index: number;
  onDiscover: () => void; onRoute: () => void; onBack: () => void; onFinish: () => void; routeStatus: string;
}) {
  const editorial = step.editorial?.composition === 'editorial-place';
  const [observing, setObserving] = useState(editorial);
  const place = currentPlace(experience, step);
  const hasRoute = Boolean(place || experience.routePlan?.destination || experience.routePlan?.destinationName);
  const destination = currentDestination(experience, step);
  const [placeError, setPlaceError] = useState(false);
  const narration = referenceAudio(experience.id, step);
  return <ScrollView contentContainerStyle={s.sceneScroll}>
    <View style={[s.sceneBody, { paddingBottom: 0 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Terug naar de voorbereiding" style={s.disclosure} onPress={onBack}>
        <Feather name="arrow-left" size={20} color={colors.bone} /><Text style={s.source}>Voorpret</Text>
      </Pressable>
    </View>    <View style={s.sceneBody}>
      {nearby}
      <Text style={s.heroMeta}>{mode === 'navigate' ? 'NAVIGATE' : 'IMMERSE'}</Text>
      <Text accessibilityRole="header" style={s.sceneTitle}>{mode === 'navigate' ? place?.name ?? experience.routePlan?.destinationName ?? step.title : observing ? 'Geef de plek even de ruimte' : 'Het verhaal om je heen'}</Text>
      {mode === 'navigate' ? <>
        {destination && <GuideOrientationMap key={`${destination.latitude}:${destination.longitude}`} destination={destination} />}
        {place && <>
          <Text style={s.sceneText}>{place.address}</Text><Text style={s.sceneText}>{place.note}</Text>
          <WalkingDirections approach={place.approach} />
          <PlaceDetails place={place} />
          <EditorialDisclosure title="Over deze plek">
            <Text style={s.source}>De kaart toont de bestemming, zonder ingetekende wandelroute. Live afslagbegeleiding is niet beschikbaar.</Text>
            <Pressable accessibilityRole="link" style={s.disclosure} onPress={() => { setPlaceError(false); Linking.openURL(place.sourceUrl).catch(() => setPlaceError(true)); }}><Text style={s.body}>Bezoekersinformatie ↗</Text></Pressable>
            <Pressable accessibilityRole="link" style={s.disclosure} onPress={() => { setPlaceError(false); Linking.openURL(place.coordinateSourceUrl).catch(() => setPlaceError(true)); }}><Text style={s.body}>Bron van het kaartpunt ↗</Text></Pressable>
            {placeError && <Text accessibilityLiveRegion="polite" style={s.source}>De bron kon niet worden geopend.</Text>}
          </EditorialDisclosure>
        </>}
        {!hasRoute && <Text style={s.sceneText}>Er is geen gecontroleerde bestemming gekoppeld. Je kunt het verhaal hier lezen.</Text>}
        {hasRoute && <Pressable accessibilityRole="button" style={s.disclosure} onPress={onRoute}><Text style={s.body}>Route openen in Kaarten ↗</Text></Pressable>}        {!!routeStatus && <Text accessibilityLiveRegion="polite" style={s.sceneText}>{routeStatus}</Text>}
        <Action title="Lees het verhaal" onPress={onDiscover} />
      </> : <>
        <View style={s.segments}>{[false, true].map((value) => <Pressable key={String(value)} accessibilityRole="button" aria-pressed={observing === value} accessibilityState={{ selected: observing === value }}
          onPress={() => setObserving(value)} style={[s.segment, observing === value && s.activeTab]}><Text style={[s.tabText, observing === value && s.activeText]}>{value ? 'Observeren' : 'Luisteren'}</Text></Pressable>)}</View>
        {!observing && narration ? <NarrationPlayer key={narration.id} source={narration.source} transcript={narration.transcript} /> : <Text style={s.sceneText}>{observing ? step.editorial?.observation || step.instruction : 'Audio is nog niet beschikbaar. Je kunt de verhaaltekst lezen of kiezen voor observeren.'}</Text>}
        {!observing && <Action title="Lees de verhaaltekst" onPress={onDiscover} />}
      </>}
    </View>
  </ScrollView>;
}

function Action({ title, onPress }: { title: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={s.action}><Text style={s.actionText}>{title}</Text><Feather name="arrow-right" size={20} color={colors.onAccent} /></Pressable>;
}

const s = schemeStyles(({ colors: c }) => StyleSheet.create({
  editorialRead: { padding: 0, borderRadius: 0, gap: 20 },
  editorialTask: { backgroundColor: c.ink, borderRadius: 0, padding: 0, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
  rule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line, paddingTop: 12, gap: 8 },
  documentaryPhoto: { width: '100%', aspectRatio: 4 / 3 },
  bar: { flexDirection: 'row', backgroundColor: c.ink, paddingHorizontal: 20, paddingVertical: 6, gap: 4 },
  tab: { flex: 1, minHeight: 44, paddingHorizontal: 4, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  activeTab: { backgroundColor: c.panelRaised }, activeText: { color: c.bone, fontWeight: '600' }, tabText: { color: c.muted, fontSize: 15 },
  read: { backgroundColor: c.ink, borderRadius: 26, padding: 20, gap: 12 },
  kicker: { color: c.muted, fontSize: 13 }, title: { color: c.bone, fontSize: 28, lineHeight: 35, fontWeight: '600', fontFamily: typography.family },
  lead: { color: c.muted, fontSize: 17, lineHeight: 26, fontStyle: 'italic' },
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
  sceneBody: { padding: 20, gap: 17 }, sceneTitle: { color: c.bone, fontFamily: typography.family, fontWeight: '600', fontSize: 28, lineHeight: 35 },
  sceneText: { color: c.bone, fontSize: 16, lineHeight: 25 },
  action: { minHeight: 52, borderRadius: 10, backgroundColor: c.accent, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  actionText: { color: c.onAccent, fontSize: 16, flexShrink: 1 }, segments: { flexDirection: 'row', gap: 5 },
  segment: { flex: 1, minHeight: 48, borderRadius: 24, padding: 12, alignItems: 'center', justifyContent: 'center' },
}));
