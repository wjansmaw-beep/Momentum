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
import { composeTravelGuide, GuideCard } from '../../product/travelGuide';
import { composeGuideMoments } from '../../guidance/guideComposer';
import { auditCandidatePool } from '../../guidance/compositionAudit';
import { impactLight } from '../../design/haptics';
import { colors } from '../../design/theme';
import { CoverImage } from '../CoverImage';
import { ChoiceChip, ExperienceTile, GeneratedCapsulePreview, PrimaryButton, ScreenHeader, SecondaryButton } from '../primitives';
import { SurfaceFrame } from '../frames';
import { styles } from '../styles/appStyles';
import { timeOptions, useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';

// Ontdekken als Reisgids (ADR-060, punt 1): een redactioneel, magazine-achtig
// overzicht van de omgeving dat op elke locatie werkt. Bewust ANDERS dan Nu:
// geen hero en geen swipe, maar eindige secties met wisselende kaartformaten
// (één grote leadkaart, daarna rustige horizontale kaarten), sectie-intro's in
// de redactionele stem en eerlijke bronnotities. Selectie uit een kaart leidt
// naar de bestaande capsule-flow (Promise → Prepare). Nooit oneindig scrollen.
//
// Onderaan blijft de eigen-richting-flow (ADR-054/055) bereikbaar als
// redactionele slotsectie "Eigen richting" — zelfde intent- en
// generatiemachines, nu ingebed in de gids in plaats van het hele scherm.

function GuideRowCard({ card, onPress }: { card: GuideCard; onPress: () => void }) {
  const { experience } = card;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={experience.title} onPress={() => { impactLight(); onPress(); }} style={({ pressed }) => [styles.guideRowCard, pressed && styles.pressed]}>
      <CoverImage uri={experience.image} style={styles.guideRowImage} imageStyle={styles.guideRowImageStyle} />
      <View style={styles.guideRowBody}>
        <Text style={styles.guideRowKicker}>{card.kicker}</Text>
        <Text style={styles.guideRowTitle}>{experience.title}</Text>
        <Text numberOfLines={2} style={styles.guideRowPromise}>{experience.promise}</Text>
        <View style={styles.guideRowMetaRow}>
          <Text style={styles.guideRowMeta}>{experience.duration} min · {experience.effort}</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.gold} />
        </View>
        {card.note && <Text style={styles.guideRowNote}>{card.note}</Text>}
      </View>
    </Pressable>
  );
}

function GuideLeadCard({ card, onPress }: { card: GuideCard; onPress: () => void }) {
  const { experience } = card;
  return (
    <View>
      <Text style={styles.guideLeadKicker}>{card.kicker}</Text>
      <ExperienceTile experience={experience} large onPress={() => { impactLight(); onPress(); }} />
      {card.note && <Text style={styles.guideLeadNote}>{card.note}</Text>}
    </View>
  );
}

export function DiscoverScreen() {
  const {
    prototypeContext,
    candidatePool,
    learningContext,
    personalProfile,
    liveWorld,
    selectionLocationConfirmed,
    liveLoading,
    openExperience,
    useApproximateLocation,
  } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const context = prototypeContext;
  const learning = learningContext;
  const personal = personalProfile;
  const onOpen = (item: Experience) => {
    openExperience(item, 'discover');
    navigation.navigate('Prepare');
  };

  // Reisgids-compositie (ADR-060): secties uit de echte kandidatenpool, het
  // live-snapshot en de koppelstatus. Werkt op elke locatie; zonder gekoppelde
  // omgeving blijven de wereldwijde secties volledig bruikbaar.
  const guide = useMemo(() => composeTravelGuide({
    candidatePool,
    liveWorld,
    locationLinked: selectionLocationConfirmed,
  }), [candidatePool, liveWorld, selectionLocationConfirmed]);

  // --- Eigen-richting-flow (ongewijzigde machines, ingebed als slotsectie) ---
  const [minutes, setMinutes] = useState(60);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'idle' | 'clarify' | 'result'>('idle');
  const [clarificationChoice, setClarificationChoice] = useState<IntentClarificationOption | null>(null);
  const [generation, setGeneration] = useState<GenerationOutcome | null>(null);
  const [generating, setGenerating] = useState(false);
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
      <ScreenHeader
        eyebrow={`REISGIDS · ${guide.regionLabel.split(' proefcontext')[0].toUpperCase()}`}
        title={guide.locationLinked ? `De wereld rond ${guide.regionLabel.split(' proefcontext')[0]}` : 'Een gids voor waar je ook bent'}
        subtitle="Blader rustig door wat deze plek vandaag te bieden heeft. Eindig gekozen, nooit een eindeloze stroom."
      />

      {guide.liveNote && (
        <View style={styles.guideNoteCard}>
          <Ionicons name="compass-outline" size={19} color={colors.gold} />
          <View style={styles.flex}>
            <Text style={styles.guideNoteText}>{guide.liveNote}</Text>
            {!guide.locationLinked && (
              <View style={styles.guideNoteAction}>
                <SecondaryButton label={liveLoading ? 'Omgeving wordt gekoppeld…' : 'Koppel mijn omgeving'} onPress={() => { useApproximateLocation().catch(() => undefined); }} />
              </View>
            )}
          </View>
        </View>
      )}

      {guide.sections.map((section) => (
        <View key={section.id} style={styles.guideSection}>
          <Text style={styles.sectionLabel}>{section.kicker}</Text>
          <Text style={styles.guideSectionTitle}>{section.title}</Text>
          <Text style={styles.guideSectionIntro}>{section.intro}</Text>
          {section.cards.map((card, index) => index === 0
            ? <GuideLeadCard key={card.id} card={card} onPress={() => onOpen(card.experience)} />
            : <GuideRowCard key={card.id} card={card} onPress={() => onOpen(card.experience)} />)}
          {section.footnote && <Text style={styles.guideFootnote}>{section.footnote}</Text>}
        </View>
      ))}

      {/* Slotsectie: eigen richting. Dezelfde rustige intent-flow als voorheen,
          nu als redactionele pagina aan het einde van de gids. */}
      <View style={styles.guideSection}>
        <Text style={styles.sectionLabel}>JIJ GEEFT RICHTING</Text>
        <Text style={styles.guideSectionTitle}>Eigen richting</Text>
        <Text style={styles.guideSectionIntro}>Vertel waar je ruimte voor hebt; Momentum zoekt uit wat nu echt kan.</Text>

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
            </> : <View style={styles.guideNoteCard}><Ionicons name="leaf-outline" size={19} color={colors.gold} /><View style={styles.flex}><Text style={styles.guideNoteText}>Binnen deze ruimte past nu niets compleet. Vergroot de beschikbare tijd of pas één praktische beperking aan.</Text></View></View>)}
            <SecondaryButton label="Pas mijn woorden aan" onPress={() => { setClarificationChoice(null); setGeneration(null); setMode('idle'); }} />
          </View>
        )}
      </View>

      <Text style={styles.finiteNote}>Deze gids toont bewust een eindige selectie. Er valt niets eindeloos te scrollen.</Text>
    </ScrollView>
    </SurfaceFrame>
  );
}
