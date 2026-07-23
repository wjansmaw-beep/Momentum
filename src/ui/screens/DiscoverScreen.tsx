import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Experience } from '../../product/experienceModel';
import { Company, rankForMoment } from '../../product/localIntelligence';
import { composeExperienceBlueprints, IntentClarificationOption, understandActiveIntent } from '../../product/experienceBlueprintComposer';
import { attachMeaningThread } from '../../product/meaningThread';
import { generateExperienceCandidates, GenerationOutcome, isRemoteGenerationConfigured } from '../../product/generativeExperience';
import { composeGuideMoments } from '../../guidance/guideComposer';
import { auditCandidatePool } from '../../guidance/compositionAudit';
import { impactLight } from '../../design/haptics';
import { colors } from '../../design/theme';
import { CoverImage, ImageShade } from '../CoverImage';
import { QuietCanvas } from '../QuietCanvas';
import { ChoiceChip, ExperienceTile, GeneratedCapsulePreview, PrimaryButton, ScreenHeader, SecondaryButton } from '../primitives';
import { SurfaceFrame } from '../frames';
import { styles } from '../styles/appStyles';
import { timeOptions, useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';

// Ontdekken-scherm (ADR-058): verhuisd uit App.tsx; alle intent- en
// generatielogica is ongewijzigd. Alleen het openen van een kaart gaat nu via
// de navigator (push 'Prepare').

export function DiscoverScreen() {
  const { prototypeContext, candidatePool, learningContext, personalProfile, openExperience } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const context = prototypeContext;
  const learning = learningContext;
  const personal = personalProfile;
  const onOpen = (item: Experience) => {
    openExperience(item, 'discover');
    navigation.navigate('Prepare');
  };
  const [minutes, setMinutes] = useState(60);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'idle' | 'clarify' | 'result'>('idle');
  const [clarificationChoice, setClarificationChoice] = useState<IntentClarificationOption | null>(null);
  const [generation, setGeneration] = useState<GenerationOutcome | null>(null);
  const [generating, setGenerating] = useState(false);
  const discoveryCanvas = candidatePool.find((item) => item.kind === 'outside') ?? candidatePool[0];
  const remoteGenerationConfigured = isRemoteGenerationConfigured();
  const intentExamples = context.company === 'family'
    ? ['Iets samen buiten', 'Een klein spel thuis', 'Samen iets maken']
    : context.dayPart === 'evening'
      ? ['Even naar buiten', 'Iets lekkers maken', 'Rust met een goed verhaal']
      : ['Buiten bewegen', 'Iets nieuws dichtbij', 'Koken met wat ik heb'];
  const understanding = useMemo(() => understandActiveIntent(input), [input]);
  const effectiveIntent = `${input} ${clarificationChoice?.terms ?? ''}`.trim();
  const explicitCompany: Company = /kind|kinderen|gezin/i.test(effectiveIntent) ? 'family' : /samen|partner|vriend/i.test(effectiveIntent) ? 'together' : context.company;
  const intentContext = useMemo(() => ({ ...context, company: explicitCompany, availableMinutes: minutes }), [context, explicitCompany, minutes]);
  const blueprintComposition = useMemo(() => composeExperienceBlueprints(input, intentContext, candidatePool, clarificationChoice?.terms), [candidatePool, clarificationChoice?.terms, input, intentContext]);
  const generatedExperiences = useMemo(() => {
    const prepared = (generation?.experiences ?? [])
      .map((experience) => composeGuideMoments(experience))
      .map((experience) => attachMeaningThread(experience, personal));
    return auditCandidatePool(prepared).accepted;
  }, [generation, personal]);
  const intentPool = useMemo(() => [...generatedExperiences, ...blueprintComposition.experiences, ...candidatePool].filter((experience, index, all) => all.findIndex((item) => item.id === experience.id) === index), [blueprintComposition.experiences, candidatePool, generatedExperiences]);
  const result = useMemo(() => rankForMoment(intentContext, effectiveIntent, [], intentPool, learning), [effectiveIntent, intentContext, intentPool, learning]);
  const primary = result.selected?.experience;
  const alternative = result.alternative?.experience;
  useEffect(() => {
    if (mode !== 'result' || (!input.trim() && !clarificationChoice)) { setGeneration(null); setGenerating(false); return; }
    let active = true;
    setGenerating(true);
    setGeneration(null);
    generateExperienceCandidates(input, clarificationChoice?.terms ?? '', intentContext, candidatePool)
      .then((outcome) => { if (active) setGeneration(outcome); })
      .finally(() => { if (active) setGenerating(false); });
    return () => { active = false; };
  }, [candidatePool, clarificationChoice, input, intentContext, mode]);
  const submitIntent = () => { setClarificationChoice(null); setGeneration(null); setMode(understanding.clarification ? 'clarify' : 'result'); };
  const chooseClarification = (option: IntentClarificationOption) => { setClarificationChoice(option); setGeneration(null); setMode('result'); };
  const surprise = () => { setInput(''); setClarificationChoice(null); setGeneration(null); setMode('result'); };
  return (
    <SurfaceFrame>
    <ScrollView contentContainerStyle={styles.screenScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow="JIJ GEEFT RICHTING" title="Waar heb je nu ruimte voor?" subtitle="Kies je tijd en vertel wat je ongeveer zoekt." />
      {mode === 'idle' ? (
        <View>
        {discoveryCanvas && <CoverImage uri={discoveryCanvas.image} style={styles.discoveryCanvas} imageStyle={styles.discoveryCanvasImage}><ImageShade /><View style={styles.discoveryCanvasCopy}><Text style={styles.discoveryCanvasLabel}>ER IS RUIMTE</Text><Text style={styles.discoveryCanvasTitle}>Geef één richting. Momentum zoekt uit wat nu echt kan.</Text><Text style={styles.discoveryCanvasBody}>Dichtbij, thuis of onderweg — jij hoeft nog niet te weten wat je precies wilt doen.</Text></View></CoverImage>}
        <View style={styles.intentPanel}>
          <Text style={styles.fieldLabel}>HOEVEEL TIJD HEB JE?</Text>
          <View style={styles.chipRow}>{timeOptions.map((option) => <ChoiceChip key={option} label={option < 60 ? `${option} min` : option === 60 ? '1 uur' : '2 uur'} selected={minutes === option} onPress={() => setMinutes(option)} />)}</View>
          <Text style={styles.fieldLabel}>WAT HEB JE IN GEDACHTEN?</Text>
          <TextInput
            accessibilityLabel="Beschrijf waar je ruimte voor hebt"
            value={input}
            onChangeText={setInput}
            placeholder="Bijv. iets met mijn kind, buiten fietsen, koken met wat ik heb…"
            placeholderTextColor={colors.placeholder}
            multiline
            style={styles.intentInput}
          />
          <View style={styles.intentExamples}>{intentExamples.map((example) => <Pressable key={example} onPress={() => setInput(example)} style={styles.intentExample}><Text style={styles.intentExampleText}>{example}</Text></Pressable>)}</View>
          <PrimaryButton label={input.trim() ? 'Vind wat hierbij past' : 'Help me kiezen'} onPress={submitIntent} />
          <View style={styles.orRow}><View style={styles.orLine} /><Text style={styles.orText}>OF</Text><View style={styles.orLine} /></View>
          <SecondaryButton label="Verras me binnen deze tijd" onPress={surprise} />
          <Text style={styles.intentPrivacy}>{remoteGenerationConfigured ? 'Alleen je vraag, beschikbare tijd en praktische keuzes worden gebruikt. Geen chatgeschiedenis of herinneringen.' : 'Je woorden worden alleen voor deze keuze gebruikt.'}</Text>
        </View>
        </View>
      ) : mode === 'clarify' && understanding.clarification ? (
        <View style={styles.clarificationPanel}>
          <Text style={styles.interpretationLabel}>ÉÉN KEUZE MAAKT HET VERSCHIL</Text>
          <Text style={styles.clarificationTitle}>{understanding.clarification.question}</Text>
          <Text style={styles.clarificationBody}>{understanding.clarification.reason}</Text>
          {input.trim() && <Text style={styles.intentQuote}>“{input.trim()}”</Text>}
          <View style={styles.clarificationOptions}>{understanding.clarification.options.map((option) => <Pressable key={option.id} onPress={() => { impactLight(); chooseClarification(option); }} style={styles.clarificationOption}><Text style={styles.clarificationOptionText}>{option.label}</Text><Ionicons name="arrow-forward" size={19} color={colors.gold} /></Pressable>)}</View>
          <SecondaryButton label="Pas mijn woorden aan" onPress={() => setMode('idle')} />
        </View>
      ) : (
        <View>
          <View style={styles.interpretation}>
            <Text style={styles.interpretationLabel}>ZO HEB IK JE MOMENT BEGREPEN</Text>
            {input.trim() && <Text style={styles.intentQuote}>“{input.trim()}”</Text>}
            <Text style={styles.interpretationText}>{blueprintComposition.interpretation} · {minutes} minuten · {explicitCompany === 'solo' ? 'alleen' : explicitCompany === 'family' ? 'met gezin' : 'samen'}{clarificationChoice ? ` · ${clarificationChoice.label.toLowerCase()}` : ''}</Text>
            {!generating && primary?.blueprint && <Text style={styles.blueprintTrust}>Samengesteld met {primary.blueprint.validationLabel.toLowerCase()}.</Text>}
          </View>
          {generating ? <View style={styles.generationCard}><Ionicons name="sparkles" size={18} color={colors.accent} style={styles.generationMarkIcon} /><View style={styles.flex}><Text style={styles.generationTitle}>Momentum maakt een nieuwe combinatie</Text><Text style={styles.generationBody}>Je huidige vraag wordt vertaald naar een complete capsule en daarna gecontroleerd.</Text></View></View> : generation ? <View style={styles.generationCard}>{generation.mode === 'remote' ? <Text style={styles.generationMark}>AI</Text> : <Ionicons name="construct-outline" size={17} color={colors.accent} style={styles.generationMarkIcon} />}<View style={styles.flex}><Text style={styles.generationTitle}>{generation.mode === 'remote' ? 'Nieuw voor dit moment gemaakt' : 'Lokaal nieuw gecombineerd'}</Text><Text style={styles.generationBody}>{generation.message} Alleen complete kandidaten gaan door.</Text></View></View> : null}
          {!generating && (primary ? <>
            <Text style={styles.sectionLabel}>MIJN BESTE VOORSTEL · VERTROUWEN {result.confidence.toUpperCase()}</Text>
            <ExperienceTile experience={primary} large onPress={() => onOpen(primary)} />
            {primary.generation && <GeneratedCapsulePreview experience={primary} />}
            <View style={styles.selectionReasons}>{result.selected?.reasons.map((reason) => <Text key={reason.text} style={styles.selectionReason}>• {reason.text}</Text>)}</View>
            {alternative && <><Text style={styles.sectionLabel}>EEN ECHT ANDERE RICHTING</Text><ExperienceTile experience={alternative} onPress={() => onOpen(alternative)} /></>}
          </> : <QuietCanvas eyebrow="GEEN EERLIJK VOORSTEL" title="Binnen deze ruimte past nu niets compleet."><Text style={styles.screenSubtitle}>Vergroot de beschikbare tijd of pas één praktische beperking aan.</Text></QuietCanvas>)}
          <SecondaryButton label="Pas mijn woorden aan" onPress={() => { setClarificationChoice(null); setGeneration(null); setMode('idle'); }} />
          <Text style={styles.finiteNote}>Momentum toont bewust geen eindeloze lijst.</Text>
        </View>
      )}
    </ScrollView>
    </SurfaceFrame>
  );
}
