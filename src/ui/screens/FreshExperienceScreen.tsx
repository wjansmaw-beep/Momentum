import { pickMemoryPhotos } from '../memoryPhotos';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../app/store';
import { useAppearance, typography } from '../../design/theme';
import { setAppearancePreference, useAppearancePreference, useAppearanceSaveError } from '../../design/appearancePreference';
import { referenceExperiences } from '../../product/referenceExperiences';
import { chapterIds, restoreAdaptiveGuide, type GuideMode } from '../../guidance/adaptiveGuide';
import { renderableBlocks } from '../../guidance/experienceRenderer';
import { GuideOrientationMap } from '../guide/GuideOrientationMap';
import { NarrationPlayer } from '../guide/NarrationPlayer';
import { referenceAudio } from '../guide/referenceAudio';
import { referenceImageCredit } from '../../product/referenceImages';
import type { RootStackParamList } from '../navigation/types';

export function FreshExperienceScreen() {
  const app = useApp();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const dark = useAppearance() === 'dark';
  const preference = useAppearancePreference();
  const appearanceError = useAppearanceSaveError();
  const palette = dark ? { paper: '#172522', ink: '#F4F0E7', muted: '#C0CEC4', line: '#43554A', action: '#D8C8A8', actionInk: '#172522' }
    : { paper: '#F4F0E7', ink: '#172522', muted: '#526157', line: '#D1D4C9', action: '#172522', actionInk: '#F4F0E7' };
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [error, setError] = useState('');
  const [taskOpen, setTaskOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [question, setQuestion] = useState<'year' | 'food' | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState(false);
  const experience = app.selected;
  const active = app.activeSession?.experienceId === experience.id ? app.activeSession : null;
  const guide = restoreAdaptiveGuide(experience, active?.adaptiveGuide, active?.stepIndex ?? 0);
  const index = Math.max(0, chapterIds(experience).indexOf(guide.chapterId));
  const step = experience.steps[index];
  const home = () => nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'FreshHome' }] }));
  const book = () => nav.dispatch(CommonActions.reset({ index: 1, routes: [{ name: 'FreshHome' }, { name: 'FreshBook' }] }));
  const open = async (url: string) => { try { await Linking.openURL(url); } catch { setError('Deze link kon niet worden geopend. Probeer later opnieuw.'); } };
  const text = (value: string, small = false) => <Text style={[small ? s.small : s.body, { color: palette.muted }]}>{value}</Text>;
  const title = (value: string) => <Text accessibilityRole="header" style={[s.title, { color: palette.ink }]}>{value}</Text>;
  const eyebrow = (value: string) => <Text style={[s.eyebrow, { color: palette.muted }]}>{value}</Text>;
  const button = (label: string, action: () => void, secondary = false, selected?: boolean) => <Pressable accessibilityRole="button"
    accessibilityState={selected === undefined ? undefined : { selected }} aria-selected={selected}
    onPress={action} style={[s.button, { backgroundColor: secondary ? 'transparent' : palette.action, borderColor: palette.line, borderWidth: secondary ? 1 : 0 }]}>
    <Text style={{ color: secondary ? palette.ink : palette.actionInk, fontSize: 15, textAlign: 'center' }}>{label}</Text></Pressable>;
  const photo = (uri: string, personal = false) => <Image source={{ uri }} style={s.hero} contentFit="cover" accessibilityLabel={personal ? "Je eigen foto bij deze herinnering" : "Referentiefoto van de ervaring; bron en datum staan bij beeldinformatie"} />;
  const credits = (uri: string) => {
    const credit = referenceImageCredit(uri);
    return credit ? <View style={s.section}>{text(credit.label + ' · beelduitsnede, geen actuele opname', true)}{button('Beeldbron en licentie', () => open(credit.source), true)}</View> : null;
  };
  const selectReference = (position: number) => {
    if (app.activeSession && app.activeSession.experienceId !== referenceExperiences[position].id) {
      setError('Er staat nog een ervaring open. Hervat of rond die eerst af; je voortgang wordt niet overschreven.'); return;
    }
    app.openExperience(referenceExperiences[position], 'now'); nav.navigate('FreshPreview');
  };
  const resume = () => {
    const stage = app.resumeSession();
    if (!stage) { setError('Deze ervaring kan niet worden hervat. Je opgeslagen gegevens zijn behouden.'); return; }
    const isReference = app.activeSession?.experienceSnapshot?.referenceVisit;
    nav.navigate(isReference ? stage === 'prepare' ? 'FreshPreview' : 'FreshGuide' : stage === 'prepare' ? 'Prepare' : 'Guide');
  };
  const mode = (next: GuideMode) => { app.updateGuideMode(next); setTaskOpen(false); };
  const observe = active?.adaptiveGuide?.presence === 'observe';
  const setObserve = (value: boolean) => app.setActiveSession(current => current && current.experienceId === experience.id ? {
    ...current, adaptiveGuide: { ...restoreAdaptiveGuide(experience, current.adaptiveGuide, current.stepIndex), mode: 'immerse', presence: value ? 'observe' : 'listen' },
  } : current);
  const advance = (next: number) => { app.updatePresenceStep(next); app.updateGuideMode('discover'); setTaskOpen(false); };
  let content: React.ReactNode;
  switch (route.name) {
    case 'FreshHome': content = <>
      {photo(referenceExperiences[0].image)}<View style={s.content}>{eyebrow('PAESENS-MODDERGAT · REFERENTIEBELEVING')}{title('Het vissersleven\nachter de dijk')}
      {text('Ontdek de vissershuisjes en de geschiedenis van het dorp aan zee.')}
      {text('Drie brongebonden verhalen · jij bepaalt het tempo. Dit is een gekozen voorbeeld, niet je herkende locatie.', true)}
      {app.activeSession ? button('Hervat jouw ontdekking', resume) : button('Ontdek deze ervaring', () => selectReference(0))}
      {button('Ik zoek iets anders', () => setAlternatives(!alternatives), true)}
      {alternatives && <>{text('Een andere blik: natuur en rustig observeren bij het Lauwersmeer.')}{button('Bekijk Lauwersmeer', () => selectReference(1), true)}</>}
      {button('Mijn momenten', () => nav.navigate('FreshBook'), true)}{credits(referenceExperiences[0].image)}</View></>; break;
    case 'FreshPreview': content = <>{photo(experience.image)}<View style={s.content}>{eyebrow('VOORUITBLIK')}{title(experience.title)}{text(experience.promise)}
      {experience.steps.map((item, i) => <View key={i} style={[s.chapter, { borderColor: palette.line }]}>{eyebrow(`0${i + 1}`)}{text(item.insight?.title ?? item.title)}</View>)}
      {experience.prepare.map((item, i) => <View key={i}>{text(item, true)}</View>)}
      {text('De wandeling uit de ontwerpproef is nog niet gecontroleerd. Deze eerste native versie biedt de verhalen bij de bezoekplek; zij verzint geen route tussen drie stops.', true)}
      {experience.visitPlace && button('Controleer opening en toegang', () => open(experience.visitPlace!.sourceUrl), true)}
      {button('Begin mijn ontdekking', () => { app.startPresence('solo', 'guide'); nav.navigate('FreshGuide'); })}</View></>; break;
    case 'FreshGuide': {
      if (!active || !step) { content = <View style={s.content}>{title('Je plek blijft bewaard.')}{text('Open je lopende ervaring vanaf de uitnodiging.')}{button('Naar de uitnodiging', home)}</View>; break; }
      const track = referenceAudio(experience.id, step);
      content = <>{guide.mode === 'discover' && photo(experience.image)}<View style={s.content}>
        {eyebrow(`${guide.mode === 'navigate' ? 'NAVIGATE' : guide.mode === 'discover' ? 'DISCOVER' : 'IMMERSE'} · ${index + 1} / ${experience.steps.length}`)}
        {guide.mode === 'navigate' ? <>{title('Vind je beginpunt')}{text(experience.visitPlace?.name ?? 'Kies een toegankelijke kijkplek')}
          {experience.visitPlace ? <><View style={s.mapPanel}><GuideOrientationMap destination={{ latitude: experience.visitPlace.latitude, longitude: experience.visitPlace.longitude, label: experience.visitPlace.name }} /></View>
          {text(experience.visitPlace.address)}{text(experience.visitPlace.note, true)}{button('Open bestemming in Kaarten', () => open(`https://maps.apple.com/?q=${encodeURIComponent(experience.visitPlace!.address)}`), true)}</> : text('Er is geen gecontroleerde route voor deze ervaring. Blijf op toegestane paden; je kunt de verhalen ook op een zelfgekozen plek lezen.')}
          {button('Ontdek het verhaal', () => mode('discover'))}</> : guide.mode === 'discover' ? <>
          {renderableBlocks(step, true).filter(block => block.kind === 'story').map((block, i) => block.kind === 'story' ? <View key={i}>{title(block.title)}<Text style={[s.reading, { color: palette.ink }]}>{block.text}</Text></View> : null)}
          {button(taskOpen ? 'Sluit ontdekkingsmoment' : 'Jouw ontdekkingsmoment', () => setTaskOpen(!taskOpen), true)}
          {taskOpen && text(step.editorial?.observation ?? step.instruction)}
          {button('Luister naar het verhaal', () => { mode('immerse'); setObserve(false); })}
          {button('Verdiep dit verhaal', () => nav.navigate('FreshQuestion'), true)}
          {index > 0 && button('Vorig hoofdstuk', () => advance(index - 1), true)}
          {button(index + 1 < experience.steps.length ? 'Volgend hoofdstuk' : 'Rond mijn ontdekking af', () => index + 1 < experience.steps.length ? advance(index + 1) : nav.navigate('FreshFinish'), true)}
          {button(sourcesOpen ? 'Sluit bronnen' : 'Bronnen en beeld', () => setSourcesOpen(!sourcesOpen), true)}
          {sourcesOpen && <>{text(step.insight?.sourceLabel ?? 'Redactionele inhoud', true)}{step.insight?.sourceUrl && button('Lees de bron', () => open(step.insight!.sourceUrl!), true)}{credits(experience.image)}</>}
        </> : <>{title(observe ? 'De plek heeft je aandacht.' : step.insight?.title ?? step.title)}
          {observe ? <>{text(step.editorial?.observation ?? step.instruction)}{text('Leg de telefoon gerust weg. Er loopt geen timer.')}</> : track ? <View style={s.audioPanel}><NarrationPlayer key={track.id} source={track.source} transcript={track.transcript} /></View> : text('Voor dit hoofdstuk is geen audio beschikbaar. Het verhaal blijft leesbaar.')}
          {button(observe ? 'Liever luisteren' : 'Liever rustig observeren', () => setObserve(!observe), true)}</>}
        <View style={s.modes}>{(['navigate', 'discover', 'immerse'] as GuideMode[]).map((item, i) => <View key={item} style={s.mode}>{button(['Richting', 'Verhaal', 'Rust'][i], () => mode(item), guide.mode !== item, guide.mode === item)}</View>)}</View>
        {button('Pauzeer · bewaar mijn plek', home, true)}{button('Nu afronden', () => nav.navigate('FreshFinish'), true)}
      </View></>; break;
    }
    case 'FreshQuestion': content = <View style={s.content}>{eyebrow('VERDIEPING · REDACTIONEEL')}{title('Waar ben je nieuwsgierig naar?')}
      {text(step?.editorial?.depth ?? 'Voor dit verhaal is geen extra verdieping beschikbaar.')}
      {experience.id.includes('moddergat') && <>{button('Is het huis uit 1850?', () => setQuestion('year'), true)}{button('Wat aten vissersgezinnen?', () => setQuestion('food'), true)}
      {question && text(question === 'year' ? 'Het oudste huisje is uit 1794. De getoonde inrichting verwijst naar het leven rond 1850. Bouwjaar en getoonde periode zijn verschillend.' : 'De gebruikte museumbron geeft geen concreet menu. Voor een betrouwbaar antwoord is aanvullend historisch onderzoek nodig.')}</>}
      {text('Deze antwoorden zijn geredigeerde verdieping, geen live AI-gesprek.', true)}
      {step?.insight?.sourceUrl && button('Bekijk de gebruikte bron', () => open(step.insight!.sourceUrl!), true)}{button('Terug naar het verhaal', () => nav.goBack())}</View>; break;
    case 'FreshFinish': content = <View style={s.content}>{eyebrow('AFRONDEN')}{title('Wat blijft je bij?')}{text(experience.memoryPrompt)}
      <Text style={[s.small, { color: palette.ink }]}>Een zin voor jezelf · optioneel</Text><TextInput accessibilityLabel="Een zin voor jezelf" multiline maxLength={600} value={note} onChangeText={setNote} placeholder="Wat wil je bewaren?" placeholderTextColor={palette.muted} style={[s.input, { color: palette.ink, borderColor: palette.line }]} />
      {text('Je bewaart alleen je eigen woorden. Een lege notitie wordt niet ingevuld en bewaren is geen beoordeling.', true)}
      {button('Voeg een eigen foto toe', async () => { if (photos.length >= 8) { setError("Je kunt maximaal acht foto's bewaren."); return; } const chosen = await pickMemoryPhotos(8 - photos.length); setPhotos(current => [...current, ...chosen].slice(0, 8)); }, true)}
      {photos.map(uri => <View key={uri}>{photo(uri, true)}{button('Verwijder deze foto', () => setPhotos(current => current.filter(item => item !== uri)), true)}</View>)}
      {button('Bewaar mijn moment', () => { if (app.saveFreshMemory(note, photos)) book(); else setError('Bewaren kan nu niet veilig. Je bestaande herinneringen worden niet overschreven.'); })}
      {button('Afronden zonder herinnering', () => { app.discardSession(); home(); }, true)}</View>; break;
    case 'FreshBook': content = <View style={s.content}>{eyebrow('MIJN MOMENTEN')}{title('Een plek om naar terug te keren.')}
      {!app.memories.length && text('Hier verschijnen de momenten die je zelf wilt bewaren.')}
      {app.memories.map(memory => <View key={memory.id} style={[s.chapter, { borderColor: palette.line }]}>
        {memory.photos?.[0] && photo(memory.photos[0], true)}
        <Text accessibilityRole="header" style={[s.memoryTitle, { color: palette.ink }]}>{memory.title}</Text>
        {memory.note ? <Text style={[s.reading, { color: palette.ink }]}>{memory.note}</Text> : text('Deze ervaring heb je bewaard.', true)}
        {text(Number.isNaN(Date.parse(memory.date)) ? memory.date : new Date(memory.date).toLocaleDateString('nl-NL'), true)}
        {button('Mijn woorden aanpassen', () => { setEditing(memory.id); setEditNote(memory.note); }, true)}
        {editing === memory.id && <><TextInput accessibilityLabel="Mijn herinnering aanpassen" multiline maxLength={600} value={editNote} onChangeText={setEditNote} style={[s.input, { color: palette.ink, borderColor: palette.line }]} />{button('Wijziging bewaren', () => { if (app.editFreshMemory(memory.id, editNote)) setEditing(null); else setError('Je wijziging kon niet veilig worden bewaard. Je tekst blijft hier staan.'); })}{button('Annuleren', () => setEditing(null), true)}</>}
        {button('Verwijder deze herinnering', () => setDeleteId(memory.id), true)}
        {deleteId === memory.id && <>{text('Deze herinnering van je toestel verwijderen?', true)}{button('Ja, verwijderen', () => { if (app.removeFreshMemory(memory.id)) setDeleteId(null); else setError('Verwijderen is nu niet beschikbaar omdat je herinneringen niet veilig geladen zijn.'); })}{button('Bewaren', () => setDeleteId(null), true)}</>}
      </View>)}{button('Naar de uitnodiging', home)}</View>; break;
    default: content = <View style={s.content}>{eyebrow('JOUW WEERGAVE')}{title('Hetzelfde verhaal.\nJouw licht.')}
      {(['light', 'dark', 'system'] as const).map((value, i) => <View key={value}>{button(['Licht', 'Donker', 'Systeem volgen'][i], () => setAppearancePreference(value), preference !== value, preference === value)}</View>)}
      {text('De keuze geldt voor de hele app. Systeem volgt je telefoon.')}{button('Mijn momenten', () => nav.navigate('FreshBook'), true)}
      {button('Privacy en bestaande voorkeuren', () => nav.navigate('Profile'), true)}{button('Bestaande ervaringen en planning', () => nav.navigate('Now'), true)}
      {text('Bestaande functies blijven beschikbaar. De nieuwe ontdekking is de hoofdingang.', true)}{button('Terug naar de uitnodiging', home, true)}</View>;
  }
  return <SafeAreaView style={[s.root, { backgroundColor: palette.paper }]}>
    <StatusBar style={dark ? 'light' : 'dark'} />
    <View style={s.header}>{button(route.name === 'FreshHome' ? 'Momenten' : 'Terug', () => route.name === 'FreshHome' ? nav.navigate('FreshBook') : nav.canGoBack() ? nav.goBack() : home(), true)}
      <Text style={[s.brand, { color: palette.ink }]}>MOMENTUM</Text>{button('Weergave', () => nav.navigate('FreshOptions'), true)}</View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.scroll}>{content}
      {!!(error || appearanceError || app.sessionSaveError || app.memorySaveError) && <View style={s.content}><Text accessibilityRole="alert" style={{ color: palette.ink }}>{error || appearanceError || app.sessionSaveError || app.memorySaveError}</Text>{app.memorySaveError && button('Probeer opnieuw te bewaren', app.retryMemorySave, true)}</View>}
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  root: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' }, scroll: { paddingBottom: 28 }, header: { paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  brand: { fontFamily: typography.displayFamilyMedium, fontSize: 14, letterSpacing: 1.2, flexShrink: 1, textAlign: 'center' },
  hero: { width: '100%', height: 290, backgroundColor: '#6F8D81' }, content: { padding: 24, gap: 16 }, section: { gap: 8, marginTop: 12 },
  eyebrow: { fontSize: 11, letterSpacing: 1.8, lineHeight: 18 }, title: { fontFamily: typography.displayFamilyMedium, fontSize: 37, lineHeight: 43 },
  body: { fontSize: 16, lineHeight: 26 }, small: { fontSize: 12, lineHeight: 20 }, reading: { fontFamily: typography.displayFamilyMedium, fontSize: 20, lineHeight: 32 },
  button: { minHeight: 46, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 27, justifyContent: 'center' }, chapter: { borderBottomWidth: 1, paddingVertical: 20, gap: 12 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, mode: { flex: 1, minWidth: 90 }, audioPanel: { padding: 18, borderRadius: 18, backgroundColor: '#172522' },
  mapPanel: { backgroundColor: '#172522', borderRadius: 18, padding: 16 }, input: { borderWidth: 1, borderRadius: 14, minHeight: 140, fontSize: 17, padding: 16, textAlignVertical: 'top' },
  memoryTitle: { fontFamily: typography.displayFamilyMedium, fontSize: 24, lineHeight: 30 },
});
