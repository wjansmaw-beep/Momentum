import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Stage = 'now' | 'time' | 'feeling' | 'promise' | 'prepare' | 'presence' | 'complete';
type Feeling = 'calm' | 'energy' | 'surprise' | 'connection' | 'challenge' | 'choose';
type PromiseContent = { eyebrow: string; title: string; body: string; action: string };

const times = ['15 min', '30 min', '1 uur', '2 uur', 'Tot…'] as const;
const feelings: Array<{ id: Feeling; label: string; symbol: string }> = [
  { id: 'calm', label: 'Tot rust komen', symbol: '◌' },
  { id: 'energy', label: 'Energie voelen', symbol: '↗' },
  { id: 'surprise', label: 'Verrast worden', symbol: '✦' },
  { id: 'connection', label: 'Verbinding', symbol: '◎' },
  { id: 'challenge', label: 'Mezelf uitdagen', symbol: '▲' },
  { id: 'choose', label: 'Kies voor mij', symbol: '◇' },
];

const promiseByFeeling: Record<Feeling, PromiseContent> = {
  calm: {
    eyebrow: 'RUIMTE VOOR RUST',
    title: 'Laat het tempo even van je afglijden.',
    body: 'Een korte zachte beweging en vijf rustige ademhalingen. Geen prestatie, geen haast.',
    action: 'Neem deze pauze',
  },
  energy: {
    eyebrow: 'RUIMTE VOOR ENERGIE',
    title: 'Beweeg genoeg om je middag te veranderen.',
    body: 'Een korte sessie die begint waar je nu bent en meer dan genoeg van het uur overlaat.',
    action: 'Begin met bewegen',
  },
  surprise: {
    eyebrow: 'RUIMTE VOOR VERWONDERING',
    title: 'Kijk vandaag naar iets waar je normaal voorbijloopt.',
    body: 'Dertig minuten om één detail te vinden dat het bewaren waard is: licht, natuur, vorm of geluid.',
    action: 'Geef me de aanwijzing',
  },
  connection: {
    eyebrow: 'RUIMTE VOOR VERBINDING',
    title: 'Geef iemand tien minuten echte aandacht.',
    body: 'Jij kiest wie. Momentum geeft één vraag en verdwijnt daarna uit het gesprek.',
    action: 'Geef me de vraag',
  },
  challenge: {
    eyebrow: 'RUIMTE VOOR KRACHT',
    title: 'Een sterk halfuur, zonder gehaast terug te komen.',
    body: 'Eén kettlebell is genoeg voor een complete sessie hier. Twintig minuten van je uur blijven beschermd.',
    action: 'Zet deze training klaar',
  },
  choose: {
    eyebrow: 'EEN EERLIJK VOORSTEL',
    title: 'Maak het uur merkbaar anders.',
    body: 'Ik weet nog weinig van dit moment. Daarom kies ik iets dat hier begint en niets extra’s nodig heeft.',
    action: 'Probeer dit',
  },
};

export default function App() {
  const [stage, setStage] = useState<Stage>('now');
  const [selectedTime, setSelectedTime] = useState('1 uur');
  const [feeling, setFeeling] = useState<Feeling>('challenge');
  const [seconds, setSeconds] = useState(40);
  const [paused, setPaused] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const transitioning = useRef(false);

  const promise = useMemo(() => promiseByFeeling[feeling], [feeling]);

  useEffect(() => {
    if (stage !== 'presence' || paused) return;
    const timer = setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          clearInterval(timer);
          setStage('complete');
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage, paused]);

  const moveTo = (next: Stage) => {
    if (transitioning.current || next === stage) return;
    transitioning.current = true;
    Animated.timing(fade, {
      toValue: 0,
      duration: 120,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setStage(next);
      fade.setValue(0);
      Animated.timing(fade, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        transitioning.current = false;
      });
    });
  };

  const restart = () => {
    setSeconds(40);
    setPaused(false);
    setSelectedTime('1 uur');
    setFeeling('challenge');
    moveTo('now');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Atmosphere stage={stage} />
      <SafeAreaView style={styles.safe}>
        <Animated.View
          style={[
            styles.appFrame,
            {
              opacity: fade,
              transform: [
                { translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
                { scale: fade.interpolate({ inputRange: [0, 1], outputRange: [0.992, 1] }) },
              ],
            },
          ]}
        >
          {stage === 'now' && <Now onStart={() => moveTo('time')} />}
          {stage === 'time' && (
            <TimeChoice
              selected={selectedTime}
              onSelect={setSelectedTime}
              onContinue={() => moveTo('feeling')}
              onBack={() => moveTo('now')}
            />
          )}
          {stage === 'feeling' && (
            <FeelingChoice
              selected={feeling}
              onSelect={setFeeling}
              onContinue={() => moveTo('promise')}
              onBack={() => moveTo('time')}
            />
          )}
          {stage === 'promise' && (
            <PromiseView
              promise={promise}
              time={selectedTime}
              onAccept={() => moveTo('prepare')}
              onRedirect={() => moveTo('feeling')}
              onClose={() => moveTo('now')}
            />
          )}
          {stage === 'prepare' && (
            <Prepare onStart={() => moveTo('presence')} onBack={() => moveTo('promise')} />
          )}
          {stage === 'presence' && (
            <Presence seconds={seconds} paused={paused} onPause={() => setPaused((value) => !value)} onStop={() => moveTo('complete')} />
          )}
          {stage === 'complete' && <Complete onDone={restart} />}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function Atmosphere({ stage }: { stage: Stage }) {
  const quiet = stage === 'presence' || stage === 'complete';
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.deepField} />
      <View style={[styles.glow, styles.glowGold, quiet && styles.glowQuiet]} />
      <View style={[styles.glow, styles.glowGreen, quiet && styles.glowQuiet]} />
      <View style={[styles.glow, styles.glowBlue, quiet && styles.glowQuiet]} />
      <View style={styles.horizon} />
      <View style={styles.grainLineOne} />
      <View style={styles.grainLineTwo} />
    </View>
  );
}

function Now({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.now}>
      <View style={styles.brandRow}>
        <Text style={styles.brand}>MOMENTUM</Text>
        <View style={styles.contextPill}><View style={styles.liveDot} /><Text style={styles.scenario}>LOKAAL MOMENT</Text></View>
      </View>
      <View style={styles.nowCopy}>
        <Text style={styles.eyebrow}>NU</Text>
        <Text style={styles.heroTitle}>Er is ruimte ontstaan.</Text>
        <Text style={styles.heroBody}>Vertel alleen hoeveel. Momentum helpt je zien wat dit moment kan worden.</Text>
        <View style={styles.contextLine}>
          <Text style={styles.contextLineText}>10 juli</Text>
          <View style={styles.contextDivider} />
          <Text style={styles.contextLineText}>Jij houdt de regie</Text>
        </View>
      </View>
      <View>
        <PrimaryButton label="Ik heb tijd nu" onPress={onStart} />
        <Text style={styles.quietNote}>Geen agenda of locatie gebruikt</Text>
      </View>
    </View>
  );
}

function TimeChoice({ selected, onSelect, onContinue, onBack }: { selected: string; onSelect: (value: string) => void; onContinue: () => void; onBack: () => void }) {
  return (
    <Panel title="Hoeveel tijd kwam er vrij?" subtitle="We beschermen ook tijd om rustig terug te keren." onBack={onBack}>
      <View style={styles.chipGrid}>
        {times.map((time) => <Choice key={time} label={time} selected={selected === time} onPress={() => onSelect(time)} />)}
      </View>
      <PrimaryButton label="Verder" onPress={onContinue} />
    </Panel>
  );
}

function FeelingChoice({ selected, onSelect, onContinue, onBack }: { selected: Feeling; onSelect: (value: Feeling) => void; onContinue: () => void; onBack: () => void }) {
  return (
    <Panel title="Wat zou dit uur de moeite waard maken?" subtitle="Kies een gevoel, geen activiteit." onBack={onBack}>
      <View style={styles.feelingList}>
        {feelings.map((item) => (
          <Pressable key={item.id} onPress={() => onSelect(item.id)} style={[styles.feeling, selected === item.id && styles.choiceSelected]}>
            <Text style={[styles.feelingSymbol, selected === item.id && styles.choiceTextSelected]}>{item.symbol}</Text>
            <Text style={[styles.feelingText, selected === item.id && styles.choiceTextSelected]}>{item.label}</Text>
            <Text style={[styles.check, selected === item.id && styles.choiceTextSelected]}>{selected === item.id ? '●' : '○'}</Text>
          </Pressable>
        ))}
      </View>
      <PrimaryButton label="Laat mijn voorstel zien" onPress={onContinue} />
    </Panel>
  );
}

function PromiseView({ promise, time, onAccept, onRedirect, onClose }: { promise: PromiseContent; time: string; onAccept: () => void; onRedirect: () => void; onClose: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.promise} showsVerticalScrollIndicator={false}>
      <TopAction label="Sluiten" onPress={onClose} />
      <View style={styles.promiseVisual}>
        <View style={styles.visualHalo} />
        <View style={styles.visualFloor} />
        <View style={styles.kettlebellOuter}>
          <View style={styles.kettlebellHandle} />
          <View style={styles.kettlebellBody}><View style={styles.kettlebellLight} /></View>
        </View>
        <View style={styles.visualCaption}>
          <Text style={styles.visualCaptionTop}>ÉÉN KETTLEBELL</Text>
          <Text style={styles.visualCaptionBottom}>meer is niet nodig</Text>
        </View>
      </View>
      <Text style={styles.eyebrow}>{promise.eyebrow}</Text>
      <Text style={styles.promiseTitle}>{promise.title}</Text>
      <Text style={styles.promiseBody}>{promise.body}</Text>
      <View style={styles.factRow}>
        <Fact value="30 min" label="ervaring" />
        <Fact value={time} label="beschikbaar" />
        <Fact value="20 min" label="buffer" />
      </View>
      <PrimaryButton label={promise.action} onPress={onAccept} />
      <SecondaryButton label="Iets anders past beter" onPress={onRedirect} />
      <Text style={styles.why}>Waarom dit past · tijd en jouw keuze voor uitdaging</Text>
    </ScrollView>
  );
}

function Prepare({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  return (
    <View style={styles.prepare}>
      <TopAction label="Terug" onPress={onBack} />
      <View>
        <Text style={styles.eyebrow}>VOORBEREIDEN</Text>
        <Text style={styles.promiseTitle}>Alles wat je nodig hebt.</Text>
        {['Eén kettlebell', 'Water', 'Vrije ruimte'].map((item) => (
          <View style={styles.checkRow} key={item}><Text style={styles.checkDot}>✓</Text><Text style={styles.checkLabel}>{item}</Text></View>
        ))}
      </View>
      <View>
        <PrimaryButton label="Ik ben klaar" onPress={onStart} />
        <Text style={styles.quietNote}>Hierna wordt Momentum stil</Text>
      </View>
    </View>
  );
}

function Presence({ seconds, paused, onPause, onStop }: { seconds: number; paused: boolean; onPause: () => void; onStop: () => void }) {
  return (
    <View style={styles.presence}>
      <Text style={styles.presenceLabel}>RONDE 1 · OEFENING 1</Text>
      <Text style={styles.exercise}>Goblet squat</Text>
      <View style={styles.timerRing}>
        <Text style={styles.timer}>{`00:${String(seconds).padStart(2, '0')}`}</Text>
        <Text style={styles.timerCaption}>{paused ? 'gepauzeerd' : 'rustig en sterk'}</Text>
      </View>
      <Pressable onPress={onPause} style={styles.pause}><Text style={styles.pauseText}>{paused ? '▶' : 'Ⅱ'}</Text></Pressable>
      <Pressable onPress={onStop}><Text style={styles.stop}>Stop de ervaring</Text></Pressable>
      <Text style={styles.presenceFooter}>Momentum wordt stil.</Text>
    </View>
  );
}

function Complete({ onDone }: { onDone: () => void }) {
  const [answer, setAnswer] = useState<string | null>(null);
  return (
    <View style={styles.complete}>
      <Text style={styles.completeMark}>✓</Text>
      <Text style={styles.promiseTitle}>Klaar.</Text>
      <Text style={styles.heroBody}>Neem de rest van je uur terug.</Text>
      <View style={styles.reflection}>
        <Text style={styles.reflectionTitle}>Was dit een goede besteding van je uur?</Text>
        <View style={styles.reflectionRow}>
          {['Nee', 'Een beetje', 'Ja'].map((item) => <Choice key={item} label={item} selected={answer === item} onPress={() => setAnswer(item)} />)}
        </View>
      </View>
      <PrimaryButton label={answer ? 'Afronden' : 'Sla over'} onPress={onDone} />
    </View>
  );
}

function Panel({ title, subtitle, onBack, children }: React.PropsWithChildren<{ title: string; subtitle: string; onBack: () => void }>) {
  return (
    <View style={styles.panelWrap}>
      <TopAction label="Terug" onPress={onBack} />
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{title}</Text>
        <Text style={styles.panelSubtitle}>{subtitle}</Text>
        {children}
      </View>
    </View>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}><Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text></Pressable>;
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>{label}</Text></Pressable>;
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}><Text style={styles.secondaryText}>{label}</Text></Pressable>;
}

function TopAction({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} hitSlop={12} style={styles.topAction}><Text style={styles.topActionText}>‹  {label}</Text></Pressable>;
}

function Fact({ value, label }: { value: string; label: string }) {
  return <View style={styles.fact}><Text style={styles.factValue}>{value}</Text><Text style={styles.factLabel}>{label}</Text></View>;
}

const colors = { ink: '#071017', panel: '#0E1A21', bone: '#F3EBDD', muted: '#AAB3AE', gold: '#D8AA68', green: '#91A96D', line: 'rgba(243,235,221,0.14)' };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink }, safe: { flex: 1, alignItems: 'center' }, flex: { flex: 1 }, appFrame: { flex: 1, width: '100%', maxWidth: 520 },
  deepField: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#071017' }, glow: { position: 'absolute', borderRadius: 999, opacity: 0.3 }, glowGold: { width: 460, height: 460, backgroundColor: '#875A2A', top: -250, right: -220 }, glowGreen: { width: 390, height: 390, backgroundColor: '#2D4937', bottom: -210, left: -190 }, glowBlue: { width: 430, height: 430, backgroundColor: '#142D3A', top: '28%', left: -330, opacity: 0.36 }, glowQuiet: { opacity: 0.065 }, horizon: { position: 'absolute', top: '44%', left: 26, right: 26, height: 1, backgroundColor: 'rgba(216,170,104,0.14)' }, grainLineOne: { position: 'absolute', width: 1, top: 0, bottom: 0, left: '23%', backgroundColor: 'rgba(255,255,255,0.018)' }, grainLineTwo: { position: 'absolute', width: 1, top: 0, bottom: 0, right: '18%', backgroundColor: 'rgba(255,255,255,0.012)' },
  now: { flex: 1, padding: 26, paddingTop: 20, justifyContent: 'space-between' }, brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brand: { color: colors.bone, fontWeight: '700', fontSize: 12, letterSpacing: 3 }, contextPill: { minHeight: 28, borderRadius: 99, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(7,16,23,0.42)' }, liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.green }, scenario: { color: colors.muted, fontSize: 8, letterSpacing: 1.2 }, nowCopy: { marginBottom: 42 }, eyebrow: { color: colors.gold, fontSize: 11, letterSpacing: 2.2, fontWeight: '700', marginBottom: 12 }, heroTitle: { color: colors.bone, fontSize: 50, lineHeight: 53, letterSpacing: -1.8, fontWeight: '300', maxWidth: 380 }, heroBody: { color: colors.muted, fontSize: 17, lineHeight: 25, marginTop: 18, maxWidth: 370 }, contextLine: { flexDirection: 'row', alignItems: 'center', marginTop: 26 }, contextLineText: { color: 'rgba(243,235,221,0.56)', fontSize: 11, letterSpacing: 0.4 }, contextDivider: { width: 22, height: 1, marginHorizontal: 10, backgroundColor: 'rgba(216,170,104,0.36)' }, quietNote: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 12 },
  panelWrap: { flex: 1, padding: 22 }, panel: { marginTop: 'auto', backgroundColor: 'rgba(14,26,33,0.95)', borderWidth: 1, borderColor: colors.line, borderRadius: 30, padding: 22, gap: 18 }, panelTitle: { color: colors.bone, fontSize: 31, lineHeight: 37, fontWeight: '400', letterSpacing: -0.8 }, panelSubtitle: { color: colors.muted, fontSize: 15, lineHeight: 21 }, chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, choice: { borderWidth: 1, borderColor: colors.line, paddingVertical: 13, paddingHorizontal: 17, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.025)' }, choiceSelected: { borderColor: colors.green, backgroundColor: 'rgba(145,169,109,0.18)' }, choiceText: { color: colors.muted, fontSize: 15 }, choiceTextSelected: { color: colors.bone },
  feelingList: { gap: 8 }, feeling: { minHeight: 54, borderRadius: 18, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }, feelingSymbol: { color: colors.gold, width: 34, fontSize: 18 }, feelingText: { color: colors.muted, fontSize: 16, flex: 1 }, check: { color: colors.muted, fontSize: 14 },
  primary: { backgroundColor: colors.green, minHeight: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 }, primaryText: { color: '#0C160E', fontSize: 16, fontWeight: '700' }, secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: colors.bone, fontSize: 14 }, pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] }, topAction: { alignSelf: 'flex-start', paddingVertical: 8 }, topActionText: { color: colors.muted, fontSize: 14 },
  promise: { padding: 22, paddingBottom: 40 }, promiseVisual: { height: 250, marginVertical: 14, borderRadius: 32, backgroundColor: '#101A1D', borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, visualHalo: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(216,170,104,0.17)', top: -72, right: -54 }, visualFloor: { position: 'absolute', height: 110, left: -30, right: -30, bottom: -58, borderRadius: 999, backgroundColor: 'rgba(145,169,109,0.13)', transform: [{ scaleX: 1.35 }] }, kettlebellOuter: { alignItems: 'center', marginTop: 5 }, kettlebellHandle: { width: 88, height: 72, borderRadius: 44, borderWidth: 16, borderColor: '#1B1F1B', marginBottom: -24, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } }, kettlebellBody: { width: 132, height: 119, borderRadius: 62, backgroundColor: '#171B18', borderWidth: 1, borderColor: '#3D433A', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 18, shadowOffset: { width: 0, height: 13 } }, kettlebellLight: { width: 42, height: 100, borderRadius: 30, marginLeft: 23, marginTop: 5, backgroundColor: 'rgba(243,235,221,0.055)', transform: [{ rotate: '12deg' }] }, visualCaption: { position: 'absolute', left: 18, bottom: 16 }, visualCaptionTop: { color: colors.gold, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 }, visualCaptionBottom: { color: 'rgba(243,235,221,0.64)', fontSize: 11, marginTop: 3 }, promiseTitle: { color: colors.bone, fontSize: 37, lineHeight: 42, letterSpacing: -1.1, fontWeight: '300' }, promiseBody: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 15 }, factRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, marginVertical: 24, paddingVertical: 15 }, fact: { flex: 1 }, factValue: { color: colors.bone, fontSize: 17, fontWeight: '600' }, factLabel: { color: colors.muted, fontSize: 11, marginTop: 3 }, why: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 8 },
  prepare: { flex: 1, padding: 24, justifyContent: 'space-between' }, checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 }, checkDot: { color: colors.green, width: 34, fontSize: 19 }, checkLabel: { color: colors.bone, fontSize: 18 },
  presence: { flex: 1, padding: 26, alignItems: 'center', justifyContent: 'center' }, presenceLabel: { color: colors.muted, fontSize: 10, letterSpacing: 2, marginBottom: 16 }, exercise: { color: colors.bone, fontSize: 40, fontWeight: '300', letterSpacing: -1 }, timerRing: { width: 230, height: 230, borderRadius: 115, borderWidth: 4, borderColor: 'rgba(145,169,109,0.45)', alignItems: 'center', justifyContent: 'center', marginVertical: 48 }, timer: { color: colors.bone, fontSize: 55, fontVariant: ['tabular-nums'], fontWeight: '200' }, timerCaption: { color: colors.muted, fontSize: 12, marginTop: 6 }, pause: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }, pauseText: { color: colors.bone, fontSize: 22 }, stop: { color: colors.muted, fontSize: 12, marginTop: 24 }, presenceFooter: { color: colors.muted, fontSize: 12, position: 'absolute', bottom: 28 },
  complete: { flex: 1, padding: 26, justifyContent: 'center' }, completeMark: { color: colors.green, fontSize: 44, marginBottom: 20 }, reflection: { marginVertical: 42, paddingTop: 22, borderTopWidth: 1, borderColor: colors.line }, reflectionTitle: { color: colors.bone, fontSize: 17, lineHeight: 24, marginBottom: 18 }, reflectionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
