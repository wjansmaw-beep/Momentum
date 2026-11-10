import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../app/store';
import { refinedRecommendation, refinementLabels, type MomentRefinement } from '../../product/momentRefinement';
import { useAppearance } from '../../design/theme';
import { referenceExperiences } from '../../product/referenceExperiences';
import { SurfaceFrame } from '../frames';
import { ed, EditorialAction, EditorialDisclosure, EditorialPhoto, OpenExperience, ResumeExperience, SaveExperience } from '../editorial';
import type { RootStackParamList } from '../navigation/types';

export function MinimalNowScreen() {
  const app = useApp(); useAppearance();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const choice = app.momentRefinement;
  const setChoice = app.setMomentRefinement;
  const decision = useMemo(() => refinedRecommendation(
    { ...app.effectiveContext, availableMinutes: app.momentMinutes ?? app.effectiveContext.availableMinutes },
    app.momentReference ? referenceExperiences.filter(e => e.id === app.momentReference) : app.momentCandidatePool, app.learningContext, choice),
    [app.effectiveContext, app.momentMinutes, app.momentReference, app.momentCandidatePool, app.learningContext, choice]);
  const experience = decision.selected?.experience;
  return <SurfaceFrame><ScrollView contentContainerStyle={ed.scroll}>
    <View style={{ gap: 8 }}><Text accessibilityRole="header" style={ed.title}>Nu</Text>
      <Text style={ed.small}>{app.momentReference ? `Je verkent ${referenceExperiences.find(e => e.id === app.momentReference)?.visitPlace?.name ?? 'een referentieplek'}` : app.selectionLocationConfirmed ? app.liveWorld?.regionLabel ?? 'Gekozen omgeving' : 'Kies je omgeving wanneer je wilt'}</Text>
      <Text style={ed.body}>Een mooi moment om iets te ontdekken.</Text></View>
    <ResumeExperience />
    {experience ? <>
      <EditorialPhoto experience={experience} />
      <View style={{ gap: 12 }}><Text style={ed.eyebrow}>VOORSTEL VOOR JOU</Text><Text accessibilityRole="header" style={ed.title}>{experience.title}</Text>
        <Text style={ed.body}>{experience.promise}</Text>
        <Text style={ed.small}>{experience.duration} minuten · {experience.steps.length} stappen</Text>
      </View><OpenExperience experience={experience} family={choice === 'family'} />
    </> : <Text accessibilityLiveRegion="polite" style={ed.body}>Er is nu geen passend voorstel voor deze keuze. Pas je voorkeur of beschikbare tijd aan.</Text>}
    <EditorialDisclosure title="Liever iets anders?">
      <Text style={ed.small}>Alleen voor dit moment. Je vaste voorkeuren blijven gelijk.</Text>
      {(Object.keys(refinementLabels) as MomentRefinement[]).map(value => <EditorialAction key={value} title={refinementLabels[value]} selected={choice === value} onPress={() => setChoice(value)} />)}
      <Text accessibilityLiveRegion="polite" style={ed.small}>{choice === 'closer' ? 'Lagere reisgrens waar reistijd bekend is; geen afstandsgarantie.' : `Jouw keuze: ${refinementLabels[choice]}`}</Text>
      <EditorialDisclosure title="Hoeveel tijd heb je?">
        {[15, 30, 60, 120].map(minutes => <EditorialAction key={minutes} title={`${minutes} minuten`} selected={(app.momentMinutes ?? app.effectiveContext.availableMinutes) === minutes} onPress={() => app.setMomentMinutes(minutes)} />)}
        <EditorialAction title="Gebruik mijn oorspronkelijke context" onPress={() => app.setMomentMinutes(undefined)} />
      </EditorialDisclosure>
    </EditorialDisclosure>
    {experience && <SaveExperience experience={experience} />}
    <EditorialDisclosure title="Waarom dit voorstel?">{decision.selected?.reasons.map((reason, i) => <Text key={i} style={ed.body}>{reason.text}</Text>)}
      <Text style={ed.small}>Selectie uit beschikbare ervaringen. Actuele informatie wordt alleen gebruikt waar bronnen beschikbaar zijn.</Text>
    </EditorialDisclosure>
    <EditorialDisclosure title="Meer regie over dit moment">
      <EditorialDisclosure title="Verken een referentieplek">
        <Text style={ed.small}>Een plek die je zelf kiest om te verkennen. Geen aanname over waar je bent; reistijd en actuele toegang zijn niet inbegrepen.</Text>
        {referenceExperiences.map(e => <EditorialAction key={e.id} title={e.title} selected={app.momentReference === e.id} onPress={() => { app.setMomentReference(e.id); setChoice('open'); }} />)}
        <EditorialAction title="Terug naar mijn context" onPress={() => app.setMomentReference(undefined)} />
      </EditorialDisclosure>
      <EditorialAction title="Tijd, omgeving en persoonlijke voorkeuren" onPress={() => nav.navigate('ProfileDetails')} />
      {experience && <EditorialDisclosure title="Wat past bij mij?">
        <Text style={ed.small}>Deze keuzes worden onthouden en sturen toekomstige voorstellen. Alleen bewaren in Plannen verandert je voorkeuren niet.</Text>
        <EditorialAction title="Stel deze ervaring vaker voor" onPress={() => app.applyFeedback(experience, 'repeat')} />
        <EditorialAction title="Deze ervaring past niet bij mij" onPress={() => app.applyFeedback(experience, 'not-for-me')} />
      </EditorialDisclosure>}
      {(app.pendingContextual?.length ?? 0) > 0 && <EditorialAction title="Neem nieuwe suggesties mee" onPress={app.showPendingContextual} />}
    </EditorialDisclosure>
  </ScrollView></SurfaceFrame>;
}

