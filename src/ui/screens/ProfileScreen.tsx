import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions, StackActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ExperienceKind } from '../../product/experienceModel';
import {
  Company,
  DayPart,
  dayPartLabels,
  profileLabels,
  PrototypeContext,
  PrototypeProfile,
} from '../../product/localIntelligence';
import {
  directionLabels,
  experienceKindLabels,
  initiativeLabels,
} from '../../profile/personalModel';
import { futureSourceRegistry } from '../../liveworld/liveWorld';
import { livingWorldSourceRegistry } from '../../liveworld/sourceRegistry';
import { formatWindow } from '../../context/calendarContext';
import { routingCapability } from '../../routing/routeIntelligence';
import {
  generatorEvaluationPlan,
  generatorEvaluationProgress,
  nextGeneratorEvaluationScenario,
  scenarioContext,
} from '../../product/generatorEvaluation';
import { colors } from '../../design/theme';
import { impactLight } from '../../design/haptics';
import { BackButton, ChoiceChip, DirectionEditor, PrimaryButton, ProfileRow, SecondaryButton } from '../primitives';
import { FlowFrame } from '../frames';
import { styles } from '../styles/appStyles';
import { defaultRegion, MOMENTUM_DEBUG, timeOptions, useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';

// Profiel-scherm (ADR-058): verhuisd uit App.tsx. 'Sluiten' is nu de
// platform-pop; een lab-proef vervangt Profiel door Prepare zodat 'Terug' op
// de surface uitkomt — zoals de vroegere flowStage-wissel.

export function ProfileScreen() {
  const {
    personalProfile: personal,
    evidence,
    compositionSummary: composition,
    opportunityResult: opportunitySummary,
    generatorStatus,
    momentGenerationLoading: generatingMoment,
    prototypeContext: context,
    calendarContext: calendar,
    calendarLoading,
    liveWorld,
    selectionLocationConfirmed: locationConfirmed,
    contentCatalog,
    liveLoading,
    liveMessage,
    setPrototypeContext: onChange,
    createEvaluationMoment,
    setPersonalProfile: onPersonalChange,
    forgetReflectionById: onForgetReflection,
    forgetLearningEventById: onForgetLearningEvent,
    resetEvidence: onResetEvidence,
    resetLearningSignals: onResetLearning,
    redoOnboarding,
    clearLiveCache: onClearLiveCache,
    connectCalendar: onConnectCalendar,
    refreshLiveWorld,
    useApproximateLocation: onUseLocation,
  } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const onEvaluateGenerator = async (kind: ExperienceKind, evaluationContext: PrototypeContext) => {
    if (await createEvaluationMoment(kind, evaluationContext)) navigation.dispatch(StackActions.replace('Prepare'));
  };
  const onRedoOnboarding = () => {
    redoOnboarding();
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Onboarding' }] }));
  };
  const onRefresh = () => { refreshLiveWorld().catch(() => undefined); };
  const onClose = () => navigation.goBack();
  const [labOpen, setLabOpen] = useState(false);
  const [evaluationKind, setEvaluationKind] = useState<ExperienceKind>('outside');
  const [evaluationMinutes, setEvaluationMinutes] = useState(30);
  const [evaluationDayPart, setEvaluationDayPart] = useState<DayPart>(context.dayPart);
  const [evaluationCompany, setEvaluationCompany] = useState<Company>('solo');
  const [evaluationKettlebell, setEvaluationKettlebell] = useState(context.hasKettlebell);
  const dayParts: DayPart[] = ['morning', 'midday', 'afternoon', 'evening'];
  const profiles: PrototypeProfile[] = ['balanced', 'explorer', 'mover', 'family'];
  const companies: Array<{ id: Company; label: string }> = [{ id: 'solo', label: 'Alleen' }, { id: 'together', label: 'Samen' }, { id: 'family', label: 'Met gezin' }];
  const evaluationProgress = generatorEvaluationProgress(evidence.generationTrials);
  const nextEvaluation = nextGeneratorEvaluationScenario(evidence.generationTrials);
  const nextCompany = companies.find((item) => item.id === nextEvaluation.company)?.label ?? nextEvaluation.company;
  return <FlowFrame><ScrollView contentContainerStyle={styles.flowScroll}>
    <BackButton label="Sluiten" onPress={onClose} />
    <Text style={styles.eyebrow}>JOUW MOMENTUM</Text><Text style={styles.flowTitle}>Jij houdt de regie.</Text>
    <Text style={styles.screenSubtitle}>Bekijk wat Momentum gebruikt, pas het aan of wis wat het heeft geleerd. Alles hieronder blijft lokaal op dit apparaat.</Text>
    <View style={styles.personalCard}>
      <ProfileRow label="Naam" value={personal.firstName || 'Niet ingevuld'} />
      <ProfileRow label="Initiatief" value={initiativeLabels[personal.initiative]} />
      <ProfileRow label="Reisbereidheid" value={`maximaal ${personal.maxTravelMinutes} min`} />
      <ProfileRow label="Begeleiding" value={personal.guidanceBalance <= -0.2 ? 'Zo weinig mogelijk uitleg' : personal.guidanceBalance >= 0.2 ? 'Graag wat meer context' : 'In balans'} />
    </View>
    <Text style={styles.fieldLabel}>MIJN RICHTING</Text>
    <Text style={styles.screenSubtitle}>Dit zijn woorden die jij zelf kiest. Momentum gebruikt ze als zachte richting, nooit als opdracht of score.</Text>
    {(Object.keys(directionLabels) as Array<keyof typeof directionLabels>).map((horizon) => <DirectionEditor key={horizon} horizon={horizon} values={personal.directions[horizon]} paused={personal.pausedDirections} onTogglePause={(value) => onPersonalChange({ ...personal, pausedDirections: personal.pausedDirections.includes(value) ? personal.pausedDirections.filter((item) => item !== value) : [...personal.pausedDirections, value] })} onSave={(values) => onPersonalChange({ ...personal, directions: { ...personal.directions, [horizon]: values }, pausedDirections: personal.pausedDirections.filter((item) => values.includes(item) || Object.entries(personal.directions).some(([key, entries]) => key !== horizon && entries.includes(item))) })} />)}
    <Text style={styles.fieldLabel}>ZELF GEKOZEN VOORKEUREN</Text>
    <View style={styles.chipRow}>{(Object.keys(experienceKindLabels) as ExperienceKind[]).map((kind) => <ChoiceChip key={kind} label={experienceKindLabels[kind]} selected={personal.preferredKinds.includes(kind)} onPress={() => onPersonalChange({ ...personal, preferredKinds: personal.preferredKinds.includes(kind) ? personal.preferredKinds.filter((item) => item !== kind) : [...personal.preferredKinds, kind] })} />)}</View>
    <Text style={styles.fieldLabel}>WAT MOMENTUM HEEFT GELEERD</Text>
    <View style={styles.learningCard}>
      <Text style={styles.learningTitle}>{personal.reflectionMemories.length || personal.learningEvents.length ? `${personal.reflectionMemories.length + personal.learningEvents.length} expliciete signalen` : 'Nog geen duurzaam leersignaal'}</Text>
      <Text style={styles.learningBody}>{personal.reflectionMemories[0]?.explanation ?? personal.learningEvents[0]?.explanation ?? '“Niet nu” verandert niets. Alleen bevestigingen en correcties die jij bewust geeft worden onthouden.'}</Text>
      {personal.reflectionMemories.slice(0, 5).map((memory) => <View key={memory.id} style={styles.memorySignalRow}><View style={styles.flex}><Text style={styles.learningEvent}>• {memory.explanation}</Text>{memory.note && <Text style={styles.memorySignalNote}>“{memory.note}”</Text>}</View><Pressable accessibilityLabel={`Vergeet feedback over ${memory.experienceTitle}`} onPress={() => onForgetReflection(memory.id)} style={styles.forgetSignal}><Text style={styles.forgetSignalText}>Vergeet</Text></Pressable></View>)}
      {personal.learningEvents.filter((event) => !personal.reflectionMemories.some((memory) => memory.learningEventId === event.id)).slice(0, 5).map((event) => <View key={event.id} style={styles.memorySignalRow}><Text style={[styles.learningEvent, styles.flex]}>• {event.explanation}</Text><Pressable accessibilityLabel={`Vergeet leersignaal over ${event.experienceId}`} onPress={() => onForgetLearningEvent(event.id)} style={styles.forgetSignal}><Text style={styles.forgetSignalText}>Vergeet</Text></Pressable></View>)}
      {personal.mutedInsightTopics.length > 0 && <Text style={styles.learningEvent}>Minder uitleg over: {personal.mutedInsightTopics.join(', ')}.</Text>}
      {personal.mutedInsightExperienceIds.length > 0 && <Text style={styles.learningEvent}>Uitleg uitgezet bij {personal.mutedInsightExperienceIds.length} specifieke ervaring(en).</Text>}
    </View>
    <SecondaryButton label="Wis alleen wat Momentum heeft geleerd" onPress={onResetLearning} />
    <SecondaryButton label="Doorloop mijn startkeuzes opnieuw" onPress={onRedoOnboarding} />
    <Text style={styles.fieldLabel}>KOPPELINGEN & PRIVACY</Text>
    <View style={styles.personalCard}><ProfileRow label="Globale omgeving" value={locationConfirmed ? liveWorld?.regionLabel ?? 'Gekoppeld' : 'Niet gekoppeld'} /><ProfileRow label="Agenda" value={calendar.state === 'live' ? 'Lokaal gekoppeld' : calendar.state === 'denied' ? 'Niet toegestaan' : 'Niet gekoppeld'} /><ProfileRow label="Weer" value={locationConfirmed && liveWorld?.weather ? 'Live gekoppeld' : 'Wereldwijde fallback'} /><ProfileRow label="Frisse capsules" value={generatorStatus.label} /><ProfileRow label="Gezondheid" value="Niet gekoppeld" /></View>
    <Text style={styles.sourcePrivacy}>Voor een frisse capsule bij openen gebruikt de generator hooguit één richting die jij zelf koos, dagdeel, beschikbare tijd, gezelschap en expliciet materiaal. Geen doelen, reflecties, agenda-inhoud of locatie.</Text>
    {calendar.state !== 'live' && <SecondaryButton label={calendarLoading ? 'Agenda wordt gecontroleerd…' : Platform.OS === 'web' ? 'Agenda vereist een development build' : 'Koppel mijn agenda'} onPress={onConnectCalendar} />}
    <SecondaryButton label={locationConfirmed ? 'Werk mijn globale omgeving bij' : 'Gebruik mijn globale omgeving'} onPress={onUseLocation} />
    {MOMENTUM_DEBUG && <>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: labOpen }} onPress={() => setLabOpen((value) => !value)} style={styles.labDisclosure}><View style={styles.flex}><Text style={styles.labDisclosureTitle}>Momentum Lab</Text><Text style={styles.labDisclosureBody}>Testcontext, bronstatus en lokale compositiediagnostiek.</Text></View><Ionicons name={labOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.gold} /></Pressable>
    {labOpen && <>
    <Text style={styles.fieldLabel}>MOMENTMAKER-PROEFBANK</Text>
    <Text style={styles.screenSubtitle}>Open telkens één volledige capsule met gecontroleerde testcontext. Dit wijzigt je profiel, agenda en gewone Nu-selectie niet.</Text>
    <View style={styles.learningCard}>
      <Text style={styles.learningTitle}>Volgende ontbrekende proef</Text>
      <Text style={styles.learningBody}>{nextEvaluation.label} · {experienceKindLabels[nextEvaluation.kind]} · {nextEvaluation.availableMinutes} min · {dayPartLabels[nextEvaluation.dayPart].toLowerCase()} · {nextCompany.toLowerCase()}{nextEvaluation.kind === 'movement' ? nextEvaluation.hasKettlebell ? ' · met kettlebell' : ' · zonder materiaal' : ''}.</Text>
      <Text style={styles.learningEvent}>{evaluationProgress.evaluated} van {evaluationProgress.planned} kernscenario's volledig beleefd en beoordeeld · {evaluationProgress.attempted} geprobeerd{evaluationProgress.rejected ? ` · ${evaluationProgress.rejected} tegengehouden` : ''}.</Text>
    </View>
    <PrimaryButton label={generatingMoment ? 'Capsule wordt opgebouwd…' : 'Voer de volgende proef uit'} onPress={() => { if (!generatingMoment) onEvaluateGenerator(nextEvaluation.kind, scenarioContext(context, nextEvaluation)); }} />
    <Text style={styles.fieldLabel}>OF STEL EEN VRIJE PROEF SAMEN</Text>
    <Text style={styles.fieldLabel}>RICHTING</Text>
    <View style={styles.chipRow}>{(Object.keys(experienceKindLabels) as ExperienceKind[]).map((kind) => <ChoiceChip key={kind} label={experienceKindLabels[kind]} selected={evaluationKind === kind} onPress={() => setEvaluationKind(kind)} />)}</View>
    <Text style={styles.fieldLabel}>TIJD EN DAGDEEL</Text>
    <View style={styles.chipRow}>{timeOptions.map((minutes) => <ChoiceChip key={minutes} label={minutes < 60 ? `${minutes} min` : minutes === 60 ? '1 uur' : '2 uur'} selected={evaluationMinutes === minutes} onPress={() => setEvaluationMinutes(minutes)} />)}</View>
    <View style={styles.chipRow}>{dayParts.map((dayPart) => <ChoiceChip key={dayPart} label={dayPartLabels[dayPart]} selected={evaluationDayPart === dayPart} onPress={() => setEvaluationDayPart(dayPart)} />)}</View>
    <Text style={styles.fieldLabel}>GEZELSCHAP EN MATERIAAL</Text>
    <View style={styles.chipRow}>{companies.map((item) => <ChoiceChip key={item.id} label={item.label} selected={evaluationCompany === item.id} onPress={() => setEvaluationCompany(item.id)} />)}</View>
    {evaluationKind === 'movement' && <View style={styles.chipRow}><ChoiceChip label="Kettlebell beschikbaar" selected={evaluationKettlebell} onPress={() => setEvaluationKettlebell(true)} /><ChoiceChip label="Zonder materiaal" selected={!evaluationKettlebell} onPress={() => setEvaluationKettlebell(false)} /></View>}
    <PrimaryButton label={generatingMoment ? 'Capsule wordt opgebouwd…' : `Proef ${experienceKindLabels[evaluationKind].toLowerCase()}`} onPress={() => { if (!generatingMoment) onEvaluateGenerator(evaluationKind, { ...context, availableMinutes: evaluationMinutes, dayPart: evaluationDayPart, company: evaluationCompany, hasKettlebell: evaluationKettlebell }); }} />
    <Text style={styles.fieldLabel}>MOMENTMAKER EVALUATIE</Text>
    <View style={styles.personalCard}>
      <ProfileRow label="Geldige concepten getoond" value={`${evidence.generatedShown}`} />
      <ProfileRow label="Door contract tegengehouden" value={`${evidence.generatedRejected}`} />
      <ProfileRow label="Na beleven beoordeeld" value={`${evidence.generatedEvaluated}`} />
      <ProfileRow label="Voelde persoonlijk" value={`${evidence.generationSignals.personal}`} />
      <ProfileRow label="Was verrassend" value={`${evidence.generationSignals.surprising}`} />
      <ProfileRow label="Was uitvoerbaar" value={`${evidence.generationSignals.executable}`} />
      <ProfileRow label="Inhoud hielp" value={`${evidence.generationSignals['content-useful']}`} />
    </View>
    <Text style={styles.screenSubtitle}>{evidence.lastGenerationNote ?? 'Maak een nieuw moment om de generatorroute te evalueren.'} Deze lokale evaluatie staat los van je persoonlijke voorkeuren en herinneringen.</Text>
    <Text style={styles.fieldLabel}>DEKKING PER RICHTING</Text>
    <View style={styles.personalCard}>{(Object.keys(experienceKindLabels) as ExperienceKind[]).map((kind) => {
      const item = evidence.generationByKind[kind];
      const qualities = [item.personal ? `${item.personal} persoonlijk` : '', item.surprising ? `${item.surprising} verrassend` : '', item.executable ? `${item.executable} uitvoerbaar` : '', item.contentUseful ? `${item.contentUseful} inhoud` : ''].filter(Boolean).join(' · ');
      return <ProfileRow key={kind} label={experienceKindLabels[kind]} value={`${item.shown} getoond · ${item.evaluated} beoordeeld${qualities ? ` · ${qualities}` : ''}`} />;
    })}</View>
    <Text style={styles.fieldLabel}>KERNMATRIX</Text>
    <View style={styles.personalCard}>{generatorEvaluationPlan.map((scenario) => {
      const trials = evidence.generationTrials.filter((trial) => trial.id === scenario.id);
      const evaluatedTrial = [...trials].reverse().find((trial) => trial.status === 'evaluated');
      const state = evaluatedTrial ? `${evaluatedTrial.signals.length}/4 kwaliteitssignalen` : trials.some((trial) => trial.status === 'shown') ? 'Nog beleven en beoordelen' : trials.some((trial) => trial.status === 'rejected') ? 'Tegengehouden · opnieuw onderzoeken' : 'Nog niet geprobeerd';
      return <ProfileRow key={scenario.id} label={scenario.label} value={state} />;
    })}</View>
    <Text style={styles.fieldLabel}>AUTOMATISCHE COMPOSITIE</Text>
    <View style={styles.personalCard}><ProfileRow label="Kaarten gecontroleerd" value={`${composition.checked}`} /><ProfileRow label="Automatisch verrijkt" value={`${composition.automaticallyComposed}`} /><ProfileRow label="Gidsmomenten" value={`${composition.guideMoments}`} /><ProfileRow label="Actueel bron-onderbouwd" value={`${composition.liveGrounded}`} /><ProfileRow label="Tegenhouden" value={`${composition.rejected}`} /></View>
    <Text style={styles.screenSubtitle}>Elke kandidaat wordt lokaal gecontroleerd op een complete belofte, uitvoerbare stappen, tijd, gezelschap, route en bronversheid. Een afgekeurde kaart bereikt Nu, Vandaag en Ontdekken niet.</Text>
    <Text style={styles.fieldLabel}>LIVING WORLD OPPORTUNITY ENGINE</Text>
    <View style={styles.personalCard}><ProfileRow label="Bronstatus" value={opportunitySummary.sourceLabel} /><ProfileRow label="Bronmix" value={opportunitySummary.sourceMix.join(' + ') || 'Geen actuele mix'} /><ProfileRow label="Plaatsverhalen" value={`${opportunitySummary.knowledgeCount}`} /><ProfileRow label="Routecontrole" value={routingCapability().providerLabel} /><ProfileRow label="Perspectieven" value={`${opportunitySummary.perspectiveCount}`} /><ProfileRow label="Kansen beoordeeld" value={`${opportunitySummary.considered}`} /><ProfileRow label="Uitvoerbaar" value={`${opportunitySummary.ready.length}`} /><ProfileRow label="Terecht tegengehouden" value={`${opportunitySummary.withheld.length}`} /></View>
    {opportunitySummary.withheld.slice(0, 3).map((item) => <Text key={item.id} style={styles.screenSubtitle}>Niet getoond: {item.reason}</Text>)}
    <Text style={styles.fieldLabel}>LOKAAL PROEFBEWIJS</Text>
    <View style={styles.personalCard}><ProfileRow label="Gestart" value={`${evidence.started}`} /><ProfileRow label="Afgerond" value={`${evidence.completed}`} /><ProfileRow label="Gereflecteerd" value={`${evidence.reflected}`} /><ProfileRow label="Reflectie overgeslagen" value={`${evidence.skippedReflection}`} /></View>
    <Text style={styles.screenSubtitle}>Alleen lokale aantallen, zonder account, inhoud, tijdstip of externe analytics. Dit helpt straks beoordelen of mensen werkelijk beginnen en afronden.</Text>
    <SecondaryButton label="Wis lokale proeftellingen" onPress={onResetEvidence} />
    <Text style={styles.fieldLabel}>TESTCONTEXT</Text>
    <Text style={styles.screenSubtitle}>Deze waarden simuleren voorlopig context die later alleen met jouw toestemming uit apparaatbronnen kan komen.</Text>
    <Text style={styles.fieldLabel}>MOMENT VAN DE DAG</Text><View style={styles.chipRow}>{dayParts.map((item) => <ChoiceChip key={item} label={dayPartLabels[item]} selected={context.dayPart === item} onPress={() => onChange({ ...context, dayPart: item })} />)}</View>
    <Text style={styles.fieldLabel}>PROEFPROFIEL</Text>
    <View style={styles.profileChoiceList}>{profiles.map((item) => <Pressable key={item} onPress={() => { impactLight(); onChange({ ...context, profile: item }); }} style={[styles.profileChoice, context.profile === item && styles.profileChoiceSelected]}><View style={styles.flex}><Text style={styles.profileChoiceTitle}>{profileLabels[item].title}</Text><Text style={styles.profileChoiceBody}>{profileLabels[item].body}</Text></View><Ionicons name={context.profile === item ? 'radio-button-on' : 'radio-button-off'} size={17} color={context.profile === item ? colors.accent : colors.muted} style={styles.profileChoiceMark} /></Pressable>)}</View>
    {/* ADR-059, punt 4: gezelschap is een per-moment-keuze en hoort in de
        Prepare-verfijning, niet in Profiel. De lab-proefbank hieronder kiest
        gezelschap uitsluitend als vast evaluatiescenario. */}
    <Text style={styles.fieldLabel}>BESCHIKBAAR MATERIAAL</Text><View style={styles.chipRow}><ChoiceChip label="Kettlebell" selected={context.hasKettlebell} onPress={() => onChange({ ...context, hasKettlebell: !context.hasKettlebell })} /><ChoiceChip label="Geen trainingsmateriaal" selected={!context.hasKettlebell} onPress={() => onChange({ ...context, hasKettlebell: false })} /></View>
    <View style={styles.profileCard}><ProfileRow label="Locatie" value={liveWorld?.regionLabel ?? 'Niet gekoppeld'} /><ProfileRow label="Ervaringen" value={contentCatalog.coverageLabel} /><ProfileRow label="Seizoen" value={contentCatalog.context.season === 'spring' ? 'Lente' : contentCatalog.context.season === 'summer' ? 'Zomer' : contentCatalog.context.season === 'autumn' ? 'Herfst' : 'Winter'} /><ProfileRow label="Agenda" value={calendar.state === 'live' ? 'Lokaal gekoppeld' : calendar.state === 'denied' ? 'Niet toegestaan' : 'Niet gekoppeld'} /><ProfileRow label="Weer" value={liveWorld?.weather ? 'Live gekoppeld' : 'Niet gekoppeld'} /><ProfileRow label="Gezondheid" value="Niet gekoppeld" /></View>
    <View style={styles.calendarControlCard}>
      <Text style={styles.liveEvidenceTitle}>AGENDA · VRIJE RUIMTE</Text>
      <Text style={styles.liveControlMessage}>{calendar.detail}</Text>
      {calendar.state === 'live' && calendar.freeWindows.slice(0, 3).map((window) => <View key={window.start} style={styles.calendarWindowRow}><Ionicons name="time-outline" size={13} color={colors.bone} /><Text style={styles.calendarWindowText}>{formatWindow(window)}</Text></View>)}
      {calendar.state !== 'live' && <SecondaryButton label={calendarLoading ? 'Agenda wordt gecontroleerd…' : Platform.OS === 'web' ? 'Beschikbaar in development build' : 'Koppel mijn agenda'} onPress={onConnectCalendar} />}
      <Text style={styles.sourcePrivacy}>Momentum vraagt dit pas hier. Na toestemming worden alleen bezette begin- en eindtijden gebruikt; titels, locaties, deelnemers en notities worden direct genegeerd.</Text>
    </View>
    <View style={styles.liveControlCard}>
      <Text style={styles.liveEvidenceTitle}>LIVE WORLD · {liveWorld?.regionLabel ?? defaultRegion.label}</Text>
      <Text style={styles.liveControlMessage}>{liveMessage}</Text>
      {(liveWorld?.sources ?? []).map((source) => <View key={source.id} style={styles.sourceRow}><View style={[styles.sourceState, source.state === 'live' ? styles.sourceLive : source.state === 'error' ? styles.sourceError : styles.sourceWaiting]} /><View style={styles.flex}><Text style={styles.sourceName}>{source.name}</Text><Text style={styles.sourceDetail}>{source.detail}</Text></View></View>)}
      <View style={styles.liveControlActions}><SecondaryButton label={liveLoading ? 'Bezig met vernieuwen…' : 'Vernieuw live bronnen'} onPress={onRefresh} /><SecondaryButton label="Gebruik mijn globale omgeving" onPress={onUseLocation} /><SecondaryButton label="Wis regionale live cache" onPress={onClearLiveCache} /></View>
      <Text style={styles.sourcePrivacy}>Globale locatie wordt alleen na jouw tik opgevraagd en afgerond voordat bronnen worden benaderd.</Text>
    </View>
    <View style={styles.futureSources}><Text style={styles.fieldLabel}>ACTIEVE BRONCONTRACTEN</Text>{livingWorldSourceRegistry.map((source) => <View key={source.id} style={styles.futureSourceRow}><View style={styles.flex}><Text style={styles.futureSourceLabel}>{source.label}</Text><Text style={styles.sourceDetail}>{source.role} · {source.coverage} · {source.maySelectDestination ? 'mag een publieke bestemming aandragen' : 'alleen verrijking'}</Text></View><Text style={styles.futureSourceState}>{source.status === 'active' ? 'ACTIEF' : 'OPTIONEEL'}</Text></View>)}</View>
    <View style={styles.futureSources}><Text style={styles.fieldLabel}>VOLGENDE LIVE BRONNEN</Text>{futureSourceRegistry.map((source) => <View key={source.id} style={styles.futureSourceRow}><Text style={styles.futureSourceLabel}>{source.label}</Text><Text style={styles.futureSourceState}>GEPLAND</Text></View>)}</View>
    </>}
    </>}
    <View style={styles.learningCard}><Text style={styles.learningTitle}>Transparante lokale selectie</Text><Text style={styles.learningBody}>Momentum filtert eerst op tijd, gezelschap en materiaal. Daarna wegen moment, jouw eigen woorden, bevestigde voorkeuren, actuele bronnen en voldoende afwisseling mee.</Text></View>
    <PrimaryButton label={MOMENTUM_DEBUG ? 'Gebruik deze proefcontext' : 'Klaar'} onPress={onClose} />
  </ScrollView></FlowFrame>;
}
