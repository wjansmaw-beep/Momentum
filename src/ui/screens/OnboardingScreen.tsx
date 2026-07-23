import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Company } from '../../product/localIntelligence';
import { ExperienceKind } from '../../product/experienceModel';
import { experienceKindLabels, initiativeLabels, PersonalProfile } from '../../profile/personalModel';
import { impactLight } from '../../design/haptics';
import { colors } from '../../design/theme';
import { ChoiceChip, PrimaryButton, SecondaryButton } from '../primitives';
import { styles } from '../styles/appStyles';
import { useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';

// Onboarding-scherm (ADR-058): verhuisd uit App.tsx; hoort bij de eerste-run-
// flow als eigen scherm op de stack. Afronden reset naar Nu (voorheen viel de
// conditionele render terug op het surfacescherm).

export function OnboardingScreen() {
  const { personalProfile, finishOnboarding } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const initial = personalProfile;
  const onComplete = (profile: PersonalProfile) => {
    finishOnboarding(profile);
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Now' }] }));
  };
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(initial);
  const kinds = Object.keys(experienceKindLabels) as ExperienceKind[];
  const companyOptions: Array<{ id: Company; label: string }> = [
    { id: 'solo', label: 'Vaak alleen' }, { id: 'together', label: 'Vaak samen' }, { id: 'family', label: 'Vaak met gezin' },
  ];
  const next = () => step === 4 ? onComplete(draft) : setStep((value) => value + 1);
  const canContinue = step !== 1 || draft.preferredKinds.length > 0;
  return <View style={styles.root}>
    <StatusBar style="light" />
    <SafeAreaView style={styles.safe}><View style={styles.appFrame}>
      <ScrollView contentContainerStyle={styles.onboardingScroll} keyboardShouldPersistTaps="handled">
        <View style={styles.onboardingProgress}>{[0, 1, 2, 3, 4].map((item) => <View key={item} style={[styles.onboardingProgressPart, item <= step && styles.onboardingProgressActive]} />)}</View>
        {step === 0 && <>
          <Text style={styles.eyebrow}>WELKOM BIJ MOMENTUM</Text><Text style={styles.onboardingTitle}>Minder zoeken. Meer beleven.</Text>
          <Text style={styles.onboardingBody}>Momentum helpt je één passende volgende stap te zien en verdwijnt daarna weer naar de achtergrond. We beginnen zonder agenda, locatie of gezondheidsdata.</Text>
          <Text style={styles.fieldLabel}>HOE MOGEN WE JE NOEMEN?</Text>
          <TextInput value={draft.firstName} onChangeText={(firstName) => setDraft({ ...draft, firstName })} placeholder="Je voornaam (optioneel)" placeholderTextColor={colors.placeholder} style={styles.singleInput} />
        </>}
        {step === 1 && <>
          <Text style={styles.eyebrow}>JOUW RICHTING</Text><Text style={styles.onboardingTitle}>Waar wil je vaker ruimte voor?</Text>
          <Text style={styles.onboardingBody}>Dit zijn startvoorkeuren, geen hokjes. Kies er gerust meerdere; je kunt alles later wijzigen.</Text>
          <View style={styles.onboardingChoices}>{kinds.map((kind) => <Pressable key={kind} onPress={() => { impactLight(); setDraft({ ...draft, preferredKinds: draft.preferredKinds.includes(kind) ? draft.preferredKinds.filter((item) => item !== kind) : [...draft.preferredKinds, kind] }); }} style={[styles.onboardingChoice, draft.preferredKinds.includes(kind) && styles.onboardingChoiceSelected]}><Text style={styles.onboardingChoiceTitle}>{experienceKindLabels[kind]}</Text><Ionicons name={draft.preferredKinds.includes(kind) ? 'radio-button-on' : 'radio-button-off'} size={17} color={draft.preferredKinds.includes(kind) ? colors.accent : colors.muted} style={styles.profileChoiceMark} /></Pressable>)}</View>
          <TextInput value={draft.aspiration} onChangeText={(aspiration) => setDraft({ ...draft, aspiration })} placeholder="Bijv. vaker echt iets doen met mijn vrije tijd" placeholderTextColor={colors.placeholder} style={styles.singleInput} />
        </>}
        {step === 2 && <>
          <Text style={styles.eyebrow}>PRAKTISCHE BASIS</Text><Text style={styles.onboardingTitle}>Wat past meestal bij jouw leven?</Text>
          <Text style={styles.onboardingBody}>Hiermee voorkomt Momentum voorstellen die praktisch niet uitvoerbaar zijn.</Text>
          <Text style={styles.fieldLabel}>MET WIE?</Text><View style={styles.chipRow}>{companyOptions.map((item) => <ChoiceChip key={item.id} label={item.label} selected={draft.defaultCompany === item.id} onPress={() => setDraft({ ...draft, defaultCompany: item.id })} />)}</View>
          <Text style={styles.fieldLabel}>WAT HEB JE BESCHIKBAAR?</Text><View style={styles.chipRow}>
            <ChoiceChip label="Kettlebell" selected={draft.equipment.kettlebell} onPress={() => setDraft({ ...draft, equipment: { ...draft.equipment, kettlebell: !draft.equipment.kettlebell } })} />
            <ChoiceChip label="Fiets" selected={draft.equipment.bike} onPress={() => setDraft({ ...draft, equipment: { ...draft.equipment, bike: !draft.equipment.bike } })} />
            <ChoiceChip label="Auto" selected={draft.equipment.car} onPress={() => setDraft({ ...draft, equipment: { ...draft.equipment, car: !draft.equipment.car } })} />
          </View>
        </>}
        {step === 3 && <>
          <Text style={styles.eyebrow}>AFSTAND</Text><Text style={styles.onboardingTitle}>Hoe ver mag een mooi moment beginnen?</Text>
          <Text style={styles.onboardingBody}>Momentum telt reistijd mee. Een bijzondere kans mag verder weg zijn, maar alleen binnen jouw grens.</Text>
          <View style={styles.onboardingChoices}>{[10, 20, 35, 60].map((minutes) => <Pressable key={minutes} onPress={() => { impactLight(); setDraft({ ...draft, maxTravelMinutes: minutes }); }} style={[styles.onboardingChoice, draft.maxTravelMinutes === minutes && styles.onboardingChoiceSelected]}><Text style={styles.onboardingChoiceTitle}>Maximaal {minutes} minuten reizen</Text><Ionicons name={draft.maxTravelMinutes === minutes ? 'radio-button-on' : 'radio-button-off'} size={17} color={draft.maxTravelMinutes === minutes ? colors.accent : colors.muted} style={styles.profileChoiceMark} /></Pressable>)}</View>
        </>}
        {step === 4 && <>
          <Text style={styles.eyebrow}>INITIATIEF</Text><Text style={styles.onboardingTitle}>Wanneer mag Momentum meedenken?</Text>
          <Text style={styles.onboardingBody}>Je opent altijd zelf de deur. Proactieve meldingen worden pas later gebouwd en vragen dan afzonderlijk toestemming.</Text>
          <View style={styles.onboardingChoices}>{(Object.keys(initiativeLabels) as PersonalProfile['initiative'][]).map((initiative) => <Pressable key={initiative} onPress={() => { impactLight(); setDraft({ ...draft, initiative }); }} style={[styles.onboardingChoice, draft.initiative === initiative && styles.onboardingChoiceSelected]}><View style={styles.flex}><Text style={styles.onboardingChoiceTitle}>{initiativeLabels[initiative]}</Text>{initiative === 'proactive-later' && <Text style={styles.profileChoiceBody}>Voorkeur onthouden · nog niet actief</Text>}</View><Ionicons name={draft.initiative === initiative ? 'radio-button-on' : 'radio-button-off'} size={17} color={draft.initiative === initiative ? colors.accent : colors.muted} style={styles.profileChoiceMark} /></Pressable>)}</View>
          <View style={styles.trustCard}><Text style={styles.learningTitle}>Jouw profiel blijft van jou</Text><Text style={styles.learningBody}>Je kunt zien wat Momentum leert, signalen wissen en iedere voorkeur aanpassen. “Niet nu” wordt nooit als afwijzing van jou geïnterpreteerd.</Text></View>
        </>}
        <View style={styles.onboardingFooter}>{step > 0 && <SecondaryButton label="Terug" onPress={() => setStep((value) => value - 1)} />}<PrimaryButton label={step === 4 ? 'Toon mijn eerste moment' : 'Verder'} onPress={() => canContinue && next()} />{!canContinue && <Text style={styles.validationText}>Kies minimaal één richting om verder te gaan.</Text>}</View>
      </ScrollView>
    </View></SafeAreaView>
  </View>;
}
