import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  DoAgain,
  doAgainLabels,
  feelingOptions,
  LearningOutcome,
  ReflectionAspect,
  reflectionAspectLabels,
  ReflectionInput,
} from '../../profile/personalModel';
import { GeneratorEvaluationSignal as GenerationEvaluationSignal } from '../../product/generatorEvaluation';
import { colors, phase } from '../../design/theme';
import { CoverImage, ImageShade } from '../CoverImage';
import { ChoiceChip, MeaningThreadCard, PrimaryButton, SecondaryButton } from '../primitives';
import { FlowFrame } from '../frames';
import { pickMemoryPhotos } from '../memoryPhotos';
import { styles } from '../styles/appStyles';
import { useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';

// Remember-scherm (ADR-058): verhuisd uit App.tsx. Bewaren reset naar het
// Leefboek (voorheen setSurface('lifebook')); overslaan én Android-back tellen
// als overgeslagen reflectie en keren terug naar de surface onderaan de stack
// (voorheen setSurface(origin)). De swipe-pop staat uit zodat die telling altijd loopt.

export function RememberScreen() {
  const { selected: experience, personalProfile: personal, completedSession, finishExperience, skipReflection } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const shared = completedSession?.shared;
  const savedRef = useRef(false);
  const onSkip = () => {
    savedRef.current = true;
    skipReflection();
    navigation.popToTop();
  };
  const onSave = (input: ReflectionInput, generationEvaluation: GenerationEvaluationSignal[] = [], photos: string[] = []) => {
    savedRef.current = true;
    finishExperience(input, generationEvaluation, photos);
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'LifeBook' }] }));
  };
  useEffect(() => navigation.addListener('beforeRemove', (event) => {
    if (savedRef.current) return;
    event.preventDefault();
    onSkip();
  }), [navigation]);
  const [note, setNote] = useState('');
  const [aspects, setAspects] = useState<ReflectionAspect[]>([]);
  const [outcome, setOutcome] = useState<LearningOutcome>('worth-it');
  const [feelings, setFeelings] = useState<string[]>([]);
  const [doAgain, setDoAgain] = useState<DoAgain | undefined>(undefined);
  const [photos, setPhotos] = useState<string[]>([]);
  const [learningOpen, setLearningOpen] = useState(false);
  const [generationEvaluation, setGenerationEvaluation] = useState<GenerationEvaluationSignal[]>([]);
  const visibleInsights = experience.steps.flatMap((step) => step.insight ? [step.insight] : []).filter((insight) => !personal.mutedInsightExperienceIds.includes(experience.id) && !personal.mutedInsightTopics.includes(insight.topic));
  const hasInsight = visibleInsights.length > 0;
  const meaningThread = visibleInsights.map((insight) => insight.title).slice(0, 2);
  const options = (Object.keys(reflectionAspectLabels) as ReflectionAspect[]).filter((aspect) => !['content-not-useful', 'topic-not-useful'].includes(aspect) || hasInsight);
  const toggle = (aspect: ReflectionAspect) => setAspects((current) => current.includes(aspect) ? current.filter((item) => item !== aspect) : [...current, aspect]);
  const toggleFeeling = (feeling: string) => setFeelings((current) => current.includes(feeling) ? current.filter((item) => item !== feeling) : [...current, feeling]);
  const addPhotos = async () => {
    const picked = await pickMemoryPhotos(Math.max(1, 8 - photos.length));
    if (picked.length) setPhotos((current) => [...current, ...picked].slice(0, 8));
  };
  const removePhoto = (uri: string) => setPhotos((current) => current.filter((item) => item !== uri));
  const toggleGenerationSignal = (signal: GenerationEvaluationSignal) => setGenerationEvaluation((current) => current.includes(signal) ? current.filter((item) => item !== signal) : [...current, signal]);
  const save = (selectedAspects = aspects) => onSave({ note, outcome, aspects: selectedAspects, feelings, doAgain }, generationEvaluation, photos);
  return (
    <FlowFrame>
    <ScrollView contentContainerStyle={styles.flowScroll} keyboardShouldPersistTaps="handled">
      <Text style={[styles.eyebrow, { color: phase.remember.text }]}>HERINNERING</Text><Text style={styles.flowTitle}>Wat blijft er over?</Text><Text style={styles.screenSubtitle}>{experience.memoryPrompt}</Text>
      <CoverImage uri={experience.image} style={styles.memoryPreview} imageStyle={styles.memoryImageStyle}><ImageShade /><Text style={styles.memoryPreviewTitle}>{experience.title}</Text></CoverImage>
      {shared && <View style={styles.sharedMemoryCard}><Text style={styles.expectationLabel}>SAMEN BELEEFD</Text><Text style={styles.sharedMemoryTitle}>{shared.participants.filter((participant) => participant.status === 'ready').map((participant) => participant.name).join(' + ')}</Text><Text style={styles.sharedMemoryBody}>Je bewaart alleen jouw eigen herinnering. De andere deelnemer krijgt geen kopie van jouw reflectie.</Text></View>}
      {experience.meaningThread && <MeaningThreadCard experience={experience} reflective />}
      {meaningThread.length ? <View style={styles.meaningTraceCard}><Text style={styles.expectationLabel}>WAT MISSCHIEN BLEEF HANGEN</Text><Text style={styles.meaningTraceTitle}>{meaningThread.join(' · ')}</Text><Text style={styles.meaningTraceBody}>Je hoeft hier niets over te schrijven. Bewaar alleen wat voor jou werkelijk betekenis had.</Text></View> : null}
      <Text style={styles.fieldLabel}>HOE WAS DIT VOOR JOU?</Text>
      <View style={styles.memoryOutcomeRow}>
        <ChoiceChip label="De moeite waard" selected={outcome === 'worth-it'} onPress={() => setOutcome('worth-it')} />
        <ChoiceChip label="Neutraal" selected={outcome === 'neutral'} onPress={() => setOutcome('neutral')} />
        <ChoiceChip label="Paste niet" selected={outcome === 'not-for-me'} onPress={() => setOutcome('not-for-me')} />
      </View>
      {/* Rijkere reflectie (ADR-061, punt 3): gevoelschips en "opnieuw doen?"
          verrijken de herinnering en het omkeerbare leermodel. Geen scores. */}
      <Text style={styles.fieldLabel}>HOE VOELDE DIT?</Text>
      <View style={styles.chipRow}>
        {feelingOptions.map((feeling) => <ChoiceChip key={feeling} label={feeling} selected={feelings.includes(feeling)} onPress={() => toggleFeeling(feeling)} />)}
      </View>
      <Text style={styles.fieldLabel}>ZOU JE DIT OPNIEUW DOEN?</Text>
      <View style={styles.memoryOutcomeRow}>
        {(Object.keys(doAgainLabels) as DoAgain[]).map((value) => <ChoiceChip key={value} label={doAgainLabels[value]} selected={doAgain === value} onPress={() => setDoAgain((current) => current === value ? undefined : value)} />)}
      </View>
      <TextInput value={note} onChangeText={setNote} placeholder="Optioneel: één zin die je wilt bewaren…" placeholderTextColor={colors.placeholder} multiline style={styles.memoryInput} />
      {/* Foto's bij de herinnering (ADR-061, punt 3): expliciete keuze via de
          systeemkiezer; beelden blijven alleen op dit apparaat. */}
      <Text style={styles.fieldLabel}>FOTO'S BIJ DIT MOMENT</Text>
      <View style={styles.photoStrip}>
        {photos.map((uri) => (
          <View key={uri} style={styles.photoThumbWrap}>
            <Image source={{ uri }} style={styles.photoThumb} contentFit="cover" transition={0} recyclingKey={uri} />
            <Pressable accessibilityRole="button" accessibilityLabel="Verwijder deze foto" onPress={() => removePhoto(uri)} style={styles.photoRemove}><Ionicons name="close" size={13} color={colors.onImage} /></Pressable>
          </View>
        ))}
        {photos.length < 8 && <Pressable accessibilityRole="button" accessibilityLabel="Voeg foto's toe aan deze herinnering" onPress={addPhotos} style={styles.photoAdd}><Ionicons name="images-outline" size={19} color={colors.muted} /><Text style={styles.photoAddText}>FOTO'S</Text></Pressable>}
      </View>
      <Text style={styles.photoHint}>Optioneel · blijven alleen op dit apparaat · worden nooit geüpload</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: learningOpen }} onPress={() => setLearningOpen((value) => !value)} style={styles.learningDisclosure}><View style={styles.flex}><Text style={styles.learningDisclosureTitle}>Help Momentum hiervan leren</Text><Text style={styles.learningDisclosureBody}>Alleen je bewuste keuzes worden aan je lokale profiel toegevoegd.</Text></View><Ionicons name={learningOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.gold} /></Pressable>
      {learningOpen && <><Text style={styles.fieldLabel}>WAT MAG VOLGENDE KEER ANDERS?</Text><View style={styles.chipRow}>{options.map((aspect) => <ChoiceChip key={aspect} label={reflectionAspectLabels[aspect]} selected={aspects.includes(aspect)} onPress={() => toggle(aspect)} />)}</View></>}
      {experience.generation && <View style={styles.learningCard}>
        <Text style={styles.learningTitle}>Beoordeel de Momentmaker</Text>
        <Text style={styles.learningBody}>Deze signalen meten de kwaliteit van de generator. Ze veranderen je persoonlijke profiel niet.</Text>
        <View style={styles.chipRow}>
          <ChoiceChip label="Voelde persoonlijk" selected={generationEvaluation.includes('personal')} onPress={() => toggleGenerationSignal('personal')} />
          <ChoiceChip label="Verraste me" selected={generationEvaluation.includes('surprising')} onPress={() => toggleGenerationSignal('surprising')} />
          <ChoiceChip label="Was direct uitvoerbaar" selected={generationEvaluation.includes('executable')} onPress={() => toggleGenerationSignal('executable')} />
          <ChoiceChip label="De inhoud hielp" selected={generationEvaluation.includes('content-useful')} onPress={() => toggleGenerationSignal('content-useful')} />
        </View>
      </View>}
      <PrimaryButton label="Bewaar dit moment" onPress={() => save(learningOpen ? aspects : [])} />
      <SecondaryButton label="Afronden zonder bewaren" onPress={onSkip} />
    </ScrollView>
    </FlowFrame>
  );
}
