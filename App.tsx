import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ImageBackground,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  byId,
  Experience,
  experiences,
  selectForIntent,
  Surface,
  todayMoments,
} from './src/product/experienceModel';

type FlowStage = 'promise' | 'prepare' | 'presence' | 'remember' | 'profile' | null;
type Memory = { id: string; title: string; date: string; image: string; note: string };

const colors = {
  ink: '#071013', panel: '#101A1D', bone: '#F4EEE3', muted: '#AEB4AE',
  green: '#A4C55D', gold: '#D9B36B', line: 'rgba(244,238,227,0.14)',
};
const memoryKey = 'momentum.memories.v2';
const timeOptions = [15, 30, 60, 120];

export default function App() {
  const { height } = useWindowDimensions();
  const [surface, setSurface] = useState<Surface>('now');
  const [flowStage, setFlowStage] = useState<FlowStage>(null);
  const [selected, setSelected] = useState<Experience>(byId('wadden-light'));
  const [origin, setOrigin] = useState<Surface>('now');
  const [memories, setMemories] = useState<Memory[]>([
    { id: 'seed-1', title: 'Licht boven het Wad', date: '8 juli', image: byId('wadden-light').image, note: 'De lucht werd stiller dan verwacht.' },
    { id: 'seed-2', title: 'Een sterk halfuur', date: '5 juli', image: byId('kettlebell-focus').image, note: 'Kort, scherp en precies genoeg.' },
  ]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.backgroundColor = colors.ink;
      document.body.style.backgroundColor = colors.ink;
    }
    AsyncStorage.getItem(memoryKey).then((value) => {
      if (value) setMemories(JSON.parse(value));
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(memoryKey, JSON.stringify(memories)).catch(() => undefined);
  }, [memories]);

  const openExperience = (experience: Experience, from: Surface, stage: FlowStage = 'promise') => {
    setSelected(experience);
    setOrigin(from);
    setFlowStage(stage);
  };

  const closeFlow = () => setFlowStage(null);
  const finishExperience = (note: string) => {
    const memory: Memory = {
      id: `${selected.id}-${Date.now()}`,
      title: selected.title,
      date: 'Vandaag',
      image: selected.image,
      note: note || 'Een moment dat de moeite waard was.',
    };
    setMemories((current) => [memory, ...current.filter((item) => item.id !== selected.id)].slice(0, 12));
    setFlowStage(null);
    setSurface('lifebook');
  };

  return (
    <View style={[styles.root, { minHeight: height }]}>
      <StatusBar style="light" />
      <View pointerEvents="none" style={styles.ambientGold} />
      <View pointerEvents="none" style={styles.ambientGreen} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.appFrame}>
          {flowStage === null && (
            <>
              {surface === 'now' && <NowScreen onOpen={(item, stage) => openExperience(item, 'now', stage)} onProfile={() => setFlowStage('profile')} onDiscover={() => setSurface('discover')} />}
              {surface === 'today' && <TodayScreen onOpen={(item) => openExperience(item, 'today')} />}
              {surface === 'discover' && <DiscoverScreen onOpen={(item) => openExperience(item, 'discover')} />}
              {surface === 'lifebook' && <LifeBookScreen memories={memories} onOpen={(item) => openExperience(item, 'lifebook')} />}
              <BottomNav surface={surface} onChange={setSurface} />
            </>
          )}
          {flowStage === 'promise' && <PromiseScreen experience={selected} onClose={closeFlow} onAccept={() => setFlowStage('prepare')} />}
          {flowStage === 'prepare' && <PrepareScreen experience={selected} onBack={() => setFlowStage('promise')} onStart={() => setFlowStage('presence')} />}
          {flowStage === 'presence' && <PresenceScreen experience={selected} onBack={() => setFlowStage('prepare')} onFinish={() => setFlowStage('remember')} />}
          {flowStage === 'remember' && <RememberScreen experience={selected} onSkip={() => { setFlowStage(null); setSurface(origin); }} onSave={finishExperience} />}
          {flowStage === 'profile' && <ProfileScreen onClose={closeFlow} />}
        </View>
      </SafeAreaView>
    </View>
  );
}

function ScreenHeader({ eyebrow, title, subtitle, onProfile }: { eyebrow?: string; title: string; subtitle?: string; onProfile?: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.screenTitle}>{title}</Text>
        {subtitle && <Text style={styles.screenSubtitle}>{subtitle}</Text>}
      </View>
      {onProfile && <Pressable accessibilityLabel="Open profiel" onPress={onProfile} style={styles.avatar}><Text style={styles.avatarText}>W</Text></Pressable>}
    </View>
  );
}

function NowScreen({ onOpen, onProfile, onDiscover }: { onOpen: (item: Experience, stage?: FlowStage) => void; onProfile: () => void; onDiscover: () => void }) {
  const [declined, setDeclined] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const experience = byId('wadden-light');
  return (
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow="GOEDEMORGEN · DOKKUM" title="Vandaag wacht er iets moois op je." subtitle="Eén voorstel voor dit moment." onProfile={onProfile} />
      {!declined ? (
        <View style={styles.heroCard}>
          <ImageBackground source={{ uri: experience.image }} style={styles.heroImage} imageStyle={styles.heroImageStyle}>
            <View style={styles.imageShade} />
            <View style={styles.heroTop}><Pill label="NATURE MOMENT" accent={experience.accent} /><Text style={styles.heroTime}>VANAVOND</Text></View>
            <View style={styles.heroBottom}>
              <Text style={styles.heroTitle}>{experience.title}</Text>
              <Text style={styles.heroPromise}>{experience.promise}</Text>
              <View style={styles.heroFacts}>
                <MiniFact value={`${experience.duration} min`} label="wandeling" />
                <MiniFact value={experience.distance ?? 'dichtbij'} label="bereik" />
                <MiniFact value={experience.effort} label="tempo" />
              </View>
            </View>
          </ImageBackground>
          <View style={styles.heroActionArea}>
            <Text style={styles.wonderText}>{experience.wonder}</Text>
            <PrimaryButton label={experience.cta} onPress={() => onOpen(experience)} />
            <Pressable onPress={() => setWhyOpen((value) => !value)} style={styles.whyButton}>
              <Text style={styles.whyButtonText}>Waarom dit nu past</Text><Text style={styles.whyChevron}>{whyOpen ? '⌃' : '⌄'}</Text>
            </Pressable>
            {whyOpen && <View style={styles.whyPanel}>{experience.why.map((reason) => <Text key={reason} style={styles.whyReason}>• {reason}</Text>)}<Text style={styles.proofNote}>Proefcontext · geen live agenda of gezondheidsdata gebruikt</Text></View>}
            <Pressable onPress={() => setDeclined(true)} style={styles.quietAction}><Text style={styles.quietActionText}>Niet nu</Text></Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.silentCard}>
          <Text style={styles.eyebrow}>MOMENTUM BLIJFT STIL</Text>
          <Text style={styles.silentTitle}>Prima. Dit moment hoeft niets te worden.</Text>
          <Text style={styles.screenSubtitle}>Je keuze verandert je blijvende voorkeuren niet.</Text>
          <SecondaryButton label="Toon het voorstel opnieuw" onPress={() => setDeclined(false)} />
        </View>
      )}
      <Pressable onPress={onDiscover} style={styles.spaceCard}>
        <View style={styles.spaceIcon}><Text style={styles.spaceIconText}>✦</Text></View>
        <View style={styles.flex}><Text style={styles.spaceTitle}>Er is ruimte ontstaan</Text><Text style={styles.spaceBody}>Vertel wat er veranderde of waar je zin in hebt</Text></View>
        <Text style={styles.arrow}>→</Text>
      </Pressable>
    </ScrollView>
  );
}

function TodayScreen({ onOpen }: { onOpen: (item: Experience) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow="ZONDAG · 12 JULI" title="Ruimte in je dag." subtitle="Niet om alles te vullen. Alleen om kansen te zien." />
      <View style={styles.daySummary}><Text style={styles.daySummaryTitle}>Vier mogelijke openingen</Text><Text style={styles.daySummaryBody}>Dit is een lokale proefdag. Jij bepaalt welke tijd echt van jou is.</Text></View>
      <View style={styles.timeline}>
        {todayMoments.map((moment, index) => {
          const item = byId(moment.experienceId);
          return (
            <Pressable key={item.id} onPress={() => onOpen(item)} style={styles.timelineRow}>
              <View style={styles.timelineRail}><View style={[styles.timelineDot, { backgroundColor: item.accent }]} />{index < todayMoments.length - 1 && <View style={styles.timelineLine} />}</View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTime}>{moment.label} · {moment.time}</Text>
                <ImageBackground source={{ uri: item.image }} style={styles.dayCardImage} imageStyle={styles.dayCardImageStyle}>
                  <View style={styles.imageShade} />
                  <View style={styles.dayCardCopy}>
                    <Text style={styles.dayCardTitle}>{item.title}</Text>
                    <Text style={styles.dayCardPromise}>{item.promise}</Text>
                    <Text style={styles.dayCardMeta}>{item.duration} min · {item.effort}  →</Text>
                  </View>
                </ImageBackground>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.quietDay}><Text style={styles.quietDayTitle}>Een volle dag is ook compleet.</Text><Text style={styles.quietDayBody}>Momentum voegt niets toe wanneer er geen echte ruimte is.</Text></View>
    </ScrollView>
  );
}

function DiscoverScreen({ onOpen }: { onOpen: (item: Experience) => void }) {
  const [minutes, setMinutes] = useState(60);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'idle' | 'result'>('idle');
  const result = useMemo(() => selectForIntent(input, minutes), [input, minutes]);
  const surprise = () => { setInput(''); setMode('result'); };
  return (
    <ScrollView contentContainerStyle={styles.screenScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow="JIJ GEEFT RICHTING" title="Waar heb je ruimte voor?" subtitle="Zeg het in je eigen woorden. Momentum maakt er geen categorie van." />
      {mode === 'idle' ? (
        <View style={styles.intentPanel}>
          <Text style={styles.fieldLabel}>HOEVEEL TIJD HEB JE?</Text>
          <View style={styles.chipRow}>{timeOptions.map((option) => <ChoiceChip key={option} label={option < 60 ? `${option} min` : option === 60 ? '1 uur' : '2 uur'} selected={minutes === option} onPress={() => setMinutes(option)} />)}</View>
          <Text style={styles.fieldLabel}>WAT HEB JE IN GEDACHTEN?</Text>
          <TextInput
            accessibilityLabel="Beschrijf waar je ruimte voor hebt"
            value={input}
            onChangeText={setInput}
            placeholder="Bijv. iets met mijn kind, buiten fietsen, koken met wat ik heb…"
            placeholderTextColor="rgba(174,180,174,0.52)"
            multiline
            style={styles.intentInput}
          />
          <PrimaryButton label={input.trim() ? 'Vind wat hierbij past' : 'Help me kiezen'} onPress={() => setMode('result')} />
          <View style={styles.orRow}><View style={styles.orLine} /><Text style={styles.orText}>OF</Text><View style={styles.orLine} /></View>
          <SecondaryButton label="Verras me binnen deze tijd" onPress={surprise} />
          <Text style={styles.intentPrivacy}>Voor deze proef wordt je zin alleen lokaal geïnterpreteerd. Er wordt geen chatgeschiedenis gemaakt.</Text>
        </View>
      ) : (
        <View>
          <View style={styles.interpretation}><Text style={styles.interpretationLabel}>ZO HEB IK JE MOMENT BEGREPEN</Text><Text style={styles.interpretationText}>{result.interpretedAs} · {minutes} minuten beschikbaar</Text></View>
          <Text style={styles.sectionLabel}>MIJN BESTE VOORSTEL</Text>
          <ExperienceTile experience={result.primary} large onPress={() => onOpen(result.primary)} />
          {result.alternative && <><Text style={styles.sectionLabel}>EEN ECHT ANDERE RICHTING</Text><ExperienceTile experience={result.alternative} onPress={() => onOpen(result.alternative!)} /></>}
          <SecondaryButton label="Pas mijn woorden aan" onPress={() => setMode('idle')} />
          <Text style={styles.finiteNote}>Momentum toont bewust geen eindeloze lijst.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function LifeBookScreen({ memories, onOpen }: { memories: Memory[]; onOpen: (item: Experience) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow="JOUW ERVARINGEN" title="Leefboek" subtitle="Niet wat je volhield, maar wat de moeite waard was." />
      <View style={styles.lifeSummary}><Text style={styles.lifeSummaryBig}>{memories.length}</Text><View><Text style={styles.lifeSummaryTitle}>bewaarde momenten</Text><Text style={styles.lifeSummaryBody}>Lokaal op dit apparaat in deze proef.</Text></View></View>
      <Text style={styles.sectionLabel}>JULI</Text>
      <View style={styles.memoryGrid}>
        {memories.map((memory) => {
          const experience = experiences.find((item) => item.title === memory.title) ?? byId('wadden-light');
          return <Pressable key={memory.id} onPress={() => onOpen(experience)} style={styles.memoryCard}><ImageBackground source={{ uri: memory.image }} style={styles.memoryImage} imageStyle={styles.memoryImageStyle}><View style={styles.imageShade} /><View style={styles.memoryCopy}><Text style={styles.memoryDate}>{memory.date}</Text><Text style={styles.memoryTitle}>{memory.title}</Text><Text style={styles.memoryNote}>{memory.note}</Text></View></ImageBackground></Pressable>;
        })}
      </View>
      <View style={styles.learningCard}><Text style={styles.learningTitle}>Een voorzichtig patroon</Text><Text style={styles.learningBody}>Momenten met buitenlucht en een helder einde lijken vaak de moeite waard. Jij kunt dit later bekijken, corrigeren of verwijderen.</Text></View>
    </ScrollView>
  );
}

function PromiseScreen({ experience, onClose, onAccept }: { experience: Experience; onClose: () => void; onAccept: () => void }) {
  const [whyOpen, setWhyOpen] = useState(false);
  return (
    <ScrollView contentContainerStyle={styles.flowScroll} showsVerticalScrollIndicator={false}>
      <BackButton label="Sluiten" onPress={onClose} />
      <ImageBackground source={{ uri: experience.image }} style={styles.detailHero} imageStyle={styles.detailHeroImage}><View style={styles.imageShade} /><View style={styles.detailHeroCopy}><Pill label={experience.kind.toUpperCase()} accent={experience.accent} /><Text style={styles.detailTitle}>{experience.title}</Text><Text style={styles.detailPromise}>{experience.promise}</Text></View></ImageBackground>
      <Text style={styles.wonderHeadline}>Wat je kunt verwachten</Text>
      <Text style={styles.wonderLarge}>{experience.wonder}</Text>
      <View style={styles.factStrip}><MiniFact value={`${experience.duration} min`} label="totaal" /><MiniFact value={experience.effort} label="inspanning" /><MiniFact value={experience.timeWindow ?? 'nu mogelijk'} label="moment" /></View>
      <PrimaryButton label={experience.cta} onPress={onAccept} />
      <Pressable onPress={() => setWhyOpen((value) => !value)} style={styles.whyButton}><Text style={styles.whyButtonText}>Waarom deze ervaring?</Text><Text style={styles.whyChevron}>{whyOpen ? '⌃' : '⌄'}</Text></Pressable>
      {whyOpen && <View style={styles.whyPanel}>{experience.why.map((reason) => <Text key={reason} style={styles.whyReason}>• {reason}</Text>)}</View>}
    </ScrollView>
  );
}

function PrepareScreen({ experience, onBack, onStart }: { experience: Experience; onBack: () => void; onStart: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.flowScroll} showsVerticalScrollIndicator={false}>
      <BackButton label="Terug" onPress={onBack} />
      <Text style={styles.eyebrow}>PREPARE</Text><Text style={styles.flowTitle}>{experience.prepareTitle}</Text><Text style={styles.screenSubtitle}>Alles wat nodig is. Niets dat je nog laat zoeken.</Text>
      <View style={styles.prepareCard}>{experience.prepare.map((item, index) => <View key={item} style={styles.prepareRow}><View style={[styles.stepNumber, { borderColor: experience.accent }]}><Text style={styles.stepNumberText}>{index + 1}</Text></View><Text style={styles.prepareText}>{item}</Text></View>)}</View>
      <View style={styles.commitmentCard}><Text style={styles.commitmentLabel}>TOTALE VERPLICHTING</Text><Text style={styles.commitmentValue}>{experience.duration} minuten · {experience.effort.toLowerCase()}</Text>{experience.distance && <Text style={styles.commitmentBody}>{experience.distance} is meegenomen voordat je begint.</Text>}</View>
      <PrimaryButton label="Ik ga nu" onPress={onStart} />
    </ScrollView>
  );
}

function PresenceScreen({ experience, onBack, onFinish }: { experience: Experience; onBack: () => void; onFinish: () => void }) {
  const openHandoff = async () => {
    const url = Platform.OS === 'ios' ? `maps://?q=${encodeURIComponent(experience.title)}` : `https://maps.apple.com/?q=${encodeURIComponent(experience.title)}`;
    await Linking.openURL(url).catch(() => undefined);
  };
  return (
    <View style={styles.presenceScreen}>
      <BackButton label="Voorbereiding" onPress={onBack} />
      <View style={styles.presenceCenter}>
        <Text style={styles.eyebrow}>PRESENCE</Text><Text style={styles.presenceTitle}>{experience.presenceTitle}</Text><Text style={styles.presenceCue}>{experience.presenceCue}</Text>
        <View style={[styles.presenceRing, { borderColor: experience.accent }]}><Text style={styles.presenceMinutes}>{experience.duration}</Text><Text style={styles.presenceUnit}>MINUTEN</Text></View>
        {experience.presenceMode === 'handoff' && <SecondaryButton label="Open route in Kaarten" onPress={openHandoff} />}
      </View>
      <View><PrimaryButton label="Ik ben terug" onPress={onFinish} /><Text style={styles.presenceFooter}>Geniet. Momentum hoeft nu niets meer.</Text></View>
    </View>
  );
}

function RememberScreen({ experience, onSkip, onSave }: { experience: Experience; onSkip: () => void; onSave: (note: string) => void }) {
  const [note, setNote] = useState('');
  return (
    <ScrollView contentContainerStyle={styles.flowScroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>MEMORY</Text><Text style={styles.flowTitle}>Wat blijft er over?</Text><Text style={styles.screenSubtitle}>{experience.memoryPrompt}</Text>
      <ImageBackground source={{ uri: experience.image }} style={styles.memoryPreview} imageStyle={styles.memoryImageStyle}><View style={styles.imageShade} /><Text style={styles.memoryPreviewTitle}>{experience.title}</Text></ImageBackground>
      <TextInput value={note} onChangeText={setNote} placeholder="Eén zin is genoeg…" placeholderTextColor="rgba(174,180,174,0.52)" multiline style={styles.memoryInput} />
      <PrimaryButton label="Bewaar in Leefboek" onPress={() => onSave(note)} />
      <SecondaryButton label="Afronden zonder bewaren" onPress={onSkip} />
    </ScrollView>
  );
}

function ProfileScreen({ onClose }: { onClose: () => void }) {
  return <ScrollView contentContainerStyle={styles.flowScroll}><BackButton label="Sluiten" onPress={onClose} /><Text style={styles.eyebrow}>PROEFCONTEXT</Text><Text style={styles.flowTitle}>Jij houdt de regie.</Text><Text style={styles.screenSubtitle}>De huidige app gebruikt lokale voorbeeldcontext. Echte permissies worden pas gevraagd wanneer ze direct iets opleveren.</Text><View style={styles.profileCard}><ProfileRow label="Profiel" value="Ontdekker" /><ProfileRow label="Materiaal" value="Kettlebell beschikbaar" /><ProfileRow label="Locatie" value="Niet continu gedeeld" /><ProfileRow label="Agenda" value="Niet gekoppeld" /><ProfileRow label="Gezondheid" value="Niet gekoppeld" /></View><View style={styles.learningCard}><Text style={styles.learningTitle}>Wat Momentum later mag leren</Text><Text style={styles.learningBody}>Voorkeuren worden zichtbaar, corrigeerbaar en verwijderbaar. Een enkele afwijzing verandert nooit wie Momentum denkt dat je bent.</Text></View></ScrollView>;
}

function BottomNav({ surface, onChange }: { surface: Surface; onChange: (surface: Surface) => void }) {
  const items: Array<{ id: Surface; label: string; icon: string }> = [
    { id: 'now', label: 'Nu', icon: '◉' }, { id: 'today', label: 'Vandaag', icon: '☼' },
    { id: 'discover', label: 'Ontdekken', icon: '✦' }, { id: 'lifebook', label: 'Leefboek', icon: '▣' },
  ];
  return <View style={styles.bottomNav}>{items.map((item) => <Pressable key={item.id} onPress={() => onChange(item.id)} style={styles.navItem}><Text style={[styles.navIcon, surface === item.id && styles.navActive]}>{item.icon}</Text><Text style={[styles.navLabel, surface === item.id && styles.navActive]}>{item.label}</Text></Pressable>)}</View>;
}

function ExperienceTile({ experience, large, onPress }: { experience: Experience; large?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.experienceTile}><ImageBackground source={{ uri: experience.image }} style={[styles.tileImage, large && styles.tileImageLarge]} imageStyle={styles.tileImageStyle}><View style={styles.imageShade} /><View style={styles.tileCopy}><Pill label={experience.kind.toUpperCase()} accent={experience.accent} /><Text style={styles.tileTitle}>{experience.title}</Text><Text style={styles.tilePromise}>{experience.promise}</Text><Text style={styles.tileMeta}>{experience.duration} min · {experience.effort}  →</Text></View></ImageBackground></Pressable>;
}

function Pill({ label, accent }: { label: string; accent: string }) { return <View style={[styles.pill, { borderColor: accent }]}><View style={[styles.pillDot, { backgroundColor: accent }]} /><Text style={[styles.pillText, { color: accent }]}>{label}</Text></View>; }
function MiniFact({ value, label }: { value: string; label: string }) { return <View style={styles.miniFact}><Text numberOfLines={1} style={styles.miniFactValue}>{value}</Text><Text style={styles.miniFactLabel}>{label}</Text></View>; }
function ChoiceChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.choiceChip, selected && styles.choiceChipSelected]}><Text style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>{label}</Text></Pressable>; }
function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>{label}</Text><Text style={styles.primaryArrow}>→</Text></Pressable>; }
function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>{label}</Text></Pressable>; }
function BackButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.backButton}><Text style={styles.backButtonText}>‹  {label}</Text></Pressable>; }
function ProfileRow({ label, value }: { label: string; value: string }) { return <View style={styles.profileRow}><Text style={styles.profileLabel}>{label}</Text><Text style={styles.profileValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink }, safe: { flex: 1, alignItems: 'center' }, appFrame: { flex: 1, width: '100%', maxWidth: 520 }, flex: { flex: 1 },
  ambientGold: { position: 'absolute', width: 520, height: 520, borderRadius: 260, backgroundColor: 'rgba(143,93,42,0.19)', top: -350, right: -260 },
  ambientGreen: { position: 'absolute', width: 500, height: 500, borderRadius: 250, backgroundColor: 'rgba(58,87,66,0.15)', bottom: -330, left: -270 },
  screenScroll: { padding: 20, paddingTop: 12, paddingBottom: 116 }, flowScroll: { padding: 22, paddingTop: 12, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 }, headerCopy: { flex: 1, paddingRight: 12 },
  eyebrow: { color: colors.gold, fontSize: 10, letterSpacing: 1.9, fontWeight: '700', marginBottom: 10 },
  screenTitle: { color: colors.bone, fontSize: 40, lineHeight: 44, letterSpacing: -1.3, fontWeight: '300' }, screenSubtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.bone, fontSize: 15, fontWeight: '700' },
  heroCard: { borderRadius: 30, overflow: 'hidden', backgroundColor: 'rgba(16,26,29,0.96)', borderWidth: 1, borderColor: colors.line }, heroImage: { height: 390, padding: 18, justifyContent: 'space-between' }, heroImageStyle: { borderTopLeftRadius: 29, borderTopRightRadius: 29 }, imageShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(3,8,9,0.36)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, heroTime: { color: colors.bone, fontSize: 10, letterSpacing: 1.4 }, heroBottom: { gap: 11 }, heroTitle: { color: '#FFF9EF', fontSize: 38, lineHeight: 41, fontWeight: '300', letterSpacing: -1.1 }, heroPromise: { color: 'rgba(255,249,239,0.88)', fontSize: 16, lineHeight: 23, maxWidth: 390 }, heroFacts: { flexDirection: 'row', gap: 18, marginTop: 8 },
  heroActionArea: { padding: 18 }, wonderText: { color: colors.bone, fontSize: 15, lineHeight: 22, marginBottom: 16 },
  pill: { alignSelf: 'flex-start', borderRadius: 99, borderWidth: 1, backgroundColor: 'rgba(5,10,10,0.56)', paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 7 }, pillDot: { width: 6, height: 6, borderRadius: 3 }, pillText: { fontSize: 9, letterSpacing: 1.2, fontWeight: '700' },
  miniFact: { minWidth: 70 }, miniFactValue: { color: colors.bone, fontSize: 13, fontWeight: '600' }, miniFactLabel: { color: 'rgba(244,238,227,0.62)', fontSize: 9, marginTop: 3 },
  primaryButton: { minHeight: 56, borderRadius: 19, backgroundColor: colors.green, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, primaryButtonText: { color: '#10160D', fontSize: 16, fontWeight: '700' }, primaryArrow: { color: '#10160D', fontSize: 22 },
  secondaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }, secondaryButtonText: { color: colors.bone, fontSize: 14, fontWeight: '600' }, pressed: { opacity: 0.74, transform: [{ scale: 0.992 }] },
  whyButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }, whyButtonText: { color: colors.muted, fontSize: 13 }, whyChevron: { color: colors.gold, fontSize: 18 }, whyPanel: { borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(164,197,93,0.06)', padding: 15, gap: 8 }, whyReason: { color: colors.bone, fontSize: 12, lineHeight: 18 }, proofNote: { color: 'rgba(174,180,174,0.58)', fontSize: 9, lineHeight: 14, marginTop: 3 }, quietAction: { minHeight: 38, alignItems: 'center', justifyContent: 'center' }, quietActionText: { color: colors.muted, fontSize: 12 },
  silentCard: { minHeight: 520, borderRadius: 30, borderWidth: 1, borderColor: colors.line, padding: 24, justifyContent: 'center', backgroundColor: 'rgba(16,26,29,0.6)' }, silentTitle: { color: colors.bone, fontSize: 36, lineHeight: 42, fontWeight: '300' },
  spaceCard: { marginTop: 16, minHeight: 90, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(217,179,107,0.3)', backgroundColor: 'rgba(16,26,29,0.75)', padding: 16, flexDirection: 'row', alignItems: 'center' }, spaceIcon: { width: 45, height: 45, borderRadius: 23, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginRight: 13 }, spaceIconText: { color: colors.gold, fontSize: 19 }, spaceTitle: { color: colors.bone, fontSize: 17, fontWeight: '600' }, spaceBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 }, arrow: { color: colors.gold, fontSize: 25 },
  daySummary: { borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(16,26,29,0.78)', padding: 17, marginBottom: 26 }, daySummaryTitle: { color: colors.bone, fontSize: 17 }, daySummaryBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 }, timeline: { gap: 0 }, timelineRow: { flexDirection: 'row' }, timelineRail: { width: 28, alignItems: 'center' }, timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 }, timelineLine: { flex: 1, width: 1, backgroundColor: colors.line, marginVertical: 7 }, timelineContent: { flex: 1, paddingBottom: 20 }, timelineTime: { color: colors.gold, fontSize: 9, letterSpacing: 1.3, fontWeight: '700', marginBottom: 9 }, dayCardImage: { minHeight: 190, justifyContent: 'flex-end' }, dayCardImageStyle: { borderRadius: 22 }, dayCardCopy: { padding: 17 }, dayCardTitle: { color: colors.bone, fontSize: 25, lineHeight: 29, fontWeight: '300' }, dayCardPromise: { color: 'rgba(244,238,227,0.8)', fontSize: 12, lineHeight: 17, marginTop: 6, maxWidth: 330 }, dayCardMeta: { color: colors.bone, fontSize: 11, marginTop: 12 }, quietDay: { borderTopWidth: 1, borderColor: colors.line, paddingTop: 20, marginTop: 2 }, quietDayTitle: { color: colors.bone, fontSize: 16 }, quietDayBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  intentPanel: { borderRadius: 28, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(16,26,29,0.88)', padding: 20 }, fieldLabel: { color: colors.gold, fontSize: 9, letterSpacing: 1.5, fontWeight: '700', marginTop: 6, marginBottom: 12 }, chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }, choiceChip: { borderRadius: 99, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 15, paddingVertical: 11 }, choiceChipSelected: { borderColor: colors.green, backgroundColor: 'rgba(164,197,93,0.16)' }, choiceChipText: { color: colors.muted, fontSize: 13 }, choiceChipTextSelected: { color: colors.bone }, intentInput: { minHeight: 118, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(4,10,12,0.48)', color: colors.bone, fontSize: 16, lineHeight: 23, padding: 16, textAlignVertical: 'top', marginBottom: 14 }, orRow: { flexDirection: 'row', alignItems: 'center', marginTop: 13 }, orLine: { flex: 1, height: 1, backgroundColor: colors.line }, orText: { color: colors.muted, fontSize: 9, marginHorizontal: 12 }, intentPrivacy: { color: 'rgba(174,180,174,0.6)', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 10 }, interpretation: { borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 15, marginBottom: 24 }, interpretationLabel: { color: colors.green, fontSize: 9, letterSpacing: 1.4, fontWeight: '700' }, interpretationText: { color: colors.bone, fontSize: 13, lineHeight: 19, marginTop: 7 }, sectionLabel: { color: colors.gold, fontSize: 9, letterSpacing: 1.5, fontWeight: '700', marginTop: 6, marginBottom: 10 }, experienceTile: { marginBottom: 20 }, tileImage: { minHeight: 210, justifyContent: 'flex-end' }, tileImageLarge: { minHeight: 310 }, tileImageStyle: { borderRadius: 25 }, tileCopy: { padding: 18 }, tileTitle: { color: colors.bone, fontSize: 29, lineHeight: 33, fontWeight: '300', marginTop: 12 }, tilePromise: { color: 'rgba(244,238,227,0.82)', fontSize: 13, lineHeight: 19, marginTop: 7 }, tileMeta: { color: colors.bone, fontSize: 11, marginTop: 14 }, finiteNote: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 2 },
  lifeSummary: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, paddingVertical: 18, marginBottom: 28 }, lifeSummaryBig: { color: colors.green, fontSize: 48, fontWeight: '200', marginRight: 16 }, lifeSummaryTitle: { color: colors.bone, fontSize: 16 }, lifeSummaryBody: { color: colors.muted, fontSize: 11, marginTop: 4 }, memoryGrid: { gap: 14 }, memoryCard: { minHeight: 230 }, memoryImage: { minHeight: 230, justifyContent: 'flex-end' }, memoryImageStyle: { borderRadius: 24 }, memoryCopy: { padding: 18 }, memoryDate: { color: colors.gold, fontSize: 9, letterSpacing: 1.2 }, memoryTitle: { color: colors.bone, fontSize: 27, lineHeight: 31, fontWeight: '300', marginTop: 7 }, memoryNote: { color: 'rgba(244,238,227,0.74)', fontSize: 12, lineHeight: 17, marginTop: 6 }, learningCard: { borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(164,197,93,0.06)', padding: 18, marginTop: 22 }, learningTitle: { color: colors.green, fontSize: 14, fontWeight: '700' }, learningBody: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 7 },
  bottomNav: { position: 'absolute', left: 14, right: 14, bottom: 10, minHeight: 72, borderRadius: 26, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(9,17,20,0.96)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5, minHeight: 62 }, navIcon: { color: colors.muted, fontSize: 18 }, navLabel: { color: colors.muted, fontSize: 10 }, navActive: { color: colors.green },
  backButton: { alignSelf: 'flex-start', minHeight: 42, justifyContent: 'center', marginBottom: 12 }, backButtonText: { color: colors.muted, fontSize: 14 }, detailHero: { height: 430, justifyContent: 'flex-end', marginHorizontal: -22, marginTop: -66, marginBottom: 24 }, detailHeroImage: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }, detailHeroCopy: { padding: 22, paddingTop: 120 }, detailTitle: { color: colors.bone, fontSize: 42, lineHeight: 45, fontWeight: '300', letterSpacing: -1.3, marginTop: 13 }, detailPromise: { color: 'rgba(244,238,227,0.84)', fontSize: 16, lineHeight: 23, marginTop: 10 }, wonderHeadline: { color: colors.gold, fontSize: 10, letterSpacing: 1.4, fontWeight: '700' }, wonderLarge: { color: colors.bone, fontSize: 21, lineHeight: 30, fontWeight: '300', marginTop: 10 }, factStrip: { flexDirection: 'row', gap: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, paddingVertical: 16, marginVertical: 22 },
  flowTitle: { color: colors.bone, fontSize: 41, lineHeight: 45, fontWeight: '300', letterSpacing: -1.2 }, prepareCard: { borderRadius: 25, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(16,26,29,0.82)', padding: 18, gap: 18, marginVertical: 28 }, prepareRow: { flexDirection: 'row', alignItems: 'center' }, stepNumber: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 13 }, stepNumberText: { color: colors.bone, fontSize: 12 }, prepareText: { color: colors.bone, fontSize: 16, flex: 1 }, commitmentCard: { borderRadius: 20, borderWidth: 1, borderColor: colors.line, padding: 16, marginBottom: 22 }, commitmentLabel: { color: colors.gold, fontSize: 9, letterSpacing: 1.3, fontWeight: '700' }, commitmentValue: { color: colors.bone, fontSize: 17, marginTop: 7 }, commitmentBody: { color: colors.muted, fontSize: 11, marginTop: 5 },
  presenceScreen: { flex: 1, padding: 22, paddingTop: 12, paddingBottom: 28, justifyContent: 'space-between' }, presenceCenter: { alignItems: 'center' }, presenceTitle: { color: colors.bone, fontSize: 38, lineHeight: 44, fontWeight: '300', textAlign: 'center' }, presenceCue: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 330, marginTop: 15 }, presenceRing: { width: 210, height: 210, borderRadius: 105, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginVertical: 38 }, presenceMinutes: { color: colors.bone, fontSize: 58, fontWeight: '200' }, presenceUnit: { color: colors.muted, fontSize: 9, letterSpacing: 1.5 }, presenceFooter: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 12 },
  memoryPreview: { minHeight: 280, justifyContent: 'flex-end', marginVertical: 28 }, memoryPreviewTitle: { color: colors.bone, fontSize: 30, fontWeight: '300', padding: 18 }, memoryInput: { minHeight: 120, borderRadius: 20, borderWidth: 1, borderColor: colors.line, color: colors.bone, fontSize: 16, lineHeight: 23, padding: 16, textAlignVertical: 'top', marginBottom: 16, backgroundColor: 'rgba(16,26,29,0.7)' },
  profileCard: { borderRadius: 24, borderWidth: 1, borderColor: colors.line, marginTop: 28, overflow: 'hidden' }, profileRow: { minHeight: 58, borderBottomWidth: 1, borderBottomColor: colors.line, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, profileLabel: { color: colors.muted, fontSize: 13 }, profileValue: { color: colors.bone, fontSize: 13 },
});
