import React, { useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Company, TransportMode, transportLabels } from '../../product/localIntelligence';
import { experienceKindLabels } from '../../profile/personalModel';
import {
  buildInviteUrl,
  createSharedInvite,
  hostSharedState,
  SharedCapsuleState,
  SharedCoordination,
} from '../../sharing/sharedCapsule';
import { buildExperienceGuide, GuideDepth } from '../../guidance/experienceGuide';
import { routingCapability } from '../../routing/routeIntelligence';
import { colors, phase } from '../../design/theme';
import { impactLight } from '../../design/haptics';
import { useImageContinuity } from '../../design/motion';
import { CoverImage, ImageShade } from '../CoverImage';
import { RouteMapPreview } from '../RouteMapPreview';
import { BackButton, ChoiceChip, MeaningThreadCard, PrimaryButton } from '../primitives';
import { FlowFrame } from '../frames';
import { styles } from '../styles/appStyles';
import { useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';

// Voorpret (ADR-065, fase 1): Prepare wordt een verhaal dat zich ontvouwt,
// geen werkblad. Verwachting leidt (foto-hero met de wonderzin als hart),
// daarna volgen scènes in consumententaal — zo ga je, neem mee, de route en
// het verhaal van de plek. De genummerde stappenrail, de readiness-checkboxes
// en de vier operationele vragen zijn verdwenen: maximaal één zichtbare vraag
// (met wie), de rest krijgt slimme standaardwaarden die zichtbaar zijn in de
// samenvatting en één tik aanpasbaar via "Aanpassen". Eerlijkheid over
// bronnen en aannames woont één tik dieper in "Waarom dit plan?".
// De sticky primaire actie start Presence via de navigator (push).

export function PrepareScreen() {
  const { selected: experience, personalProfile: personal, activeSession, sharedDraft, savePreparation, startPresence } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const hostName = personal.firstName || 'Iemand';
  const initialCompany: Company = (activeSession?.experienceId === experience.id ? activeSession.company : sharedDraft ? 'together' : personal.defaultCompany) ?? 'solo';
  const initialGuideDepth = activeSession?.experienceId === experience.id ? activeSession.guideDepth : undefined;
  const initialShared = activeSession?.experienceId === experience.id ? activeSession.shared : sharedDraft ?? undefined;
  const onBack = () => navigation.goBack();
  // ADR-059, punt 4: gezelschap en vervoer zijn per-moment-verfijningen van
  // deze kaart. Ze gelden voor deze ervaring (via de sessie) en horen niet in
  // Profiel. Het model kent te voet en fiets; de standaard volgt het routeplan.
  const initialTransport: TransportMode = (activeSession?.experienceId === experience.id ? activeSession.transport : undefined) ?? experience.routePlan?.mode ?? 'walking';
  const onDraftChange = (company: Company, guideDepth: GuideDepth, shared?: SharedCapsuleState, transport?: TransportMode) => savePreparation(company, guideDepth, shared, transport);
  const onStart = (company: Company, guideDepth: GuideDepth, shared?: SharedCapsuleState, transport?: TransportMode) => {
    startPresence(company, guideDepth, shared, transport);
    navigation.navigate('Presence');
  };
  const supportedCompanies = experience.company;
  const [company, setCompany] = useState<Company>(supportedCompanies.includes(initialCompany) ? initialCompany : supportedCompanies[0]);
  const [transport, setTransport] = useState<TransportMode>(initialTransport);
  const guidanceMuted = personal.mutedInsightExperienceIds.includes(experience.id);
  const preferredGuideDepth: GuideDepth = guidanceMuted || personal.guidanceBalance <= -0.2 ? 'quiet' : personal.guidanceBalance >= 0.45 ? 'deep' : experience.presenceMode === 'quiet' ? 'quiet' : 'guide';
  const [guideDepth, setGuideDepth] = useState<GuideDepth>(initialGuideDepth ?? preferredGuideDepth);
  const [coordination, setCoordination] = useState<SharedCoordination>(initialShared?.coordination ?? 'leave-together');
  const [shared, setShared] = useState<SharedCapsuleState | undefined>(initialShared);
  const [shareStatus, setShareStatus] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const guide = buildExperienceGuide(experience, 0);
  const freshEvidence = guide.evidence.filter((item) => item.freshness === 'current');
  const companyChoices: Array<{ id: Company; label: string }> = [{ id: 'solo', label: 'Alleen' }, { id: 'together', label: 'Samen' }, { id: 'family', label: 'Met gezin' }];
  useEffect(() => {
    onDraftChange(company, guideDepth, shared ? { ...shared, coordination } : undefined, transport);
  }, [company, coordination, guideDepth, shared, transport]);
  const shareExperience = async () => {
    if (company === 'solo') return;
    const companion = company === 'family' ? 'met gezin' : 'samen';
    const invite = createSharedInvite({ experienceId: experience.id, title: experience.title, promise: experience.promise, duration: experience.duration, hostName, company, guideDepth, coordination });
    const inviteUrl = buildInviteUrl(invite);
    const message = `Ga je mee?\n\n${experience.title}\n${experience.promise}\n${experience.duration} minuten · ${companion}\n${coordination === 'meet-there' ? 'We ontmoeten elkaar bij het startpunt.' : 'We vertrekken samen.'}\n\n${inviteUrl ? `Open de uitnodiging:\n${inviteUrl}` : 'Open Momentum om samen af te stemmen.'}`;
    try {
      if (Platform.OS === 'web' && inviteUrl && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
        setShareStatus('Uitnodigingslink gekopieerd. Je kunt hem nu zelf versturen.');
      } else {
        await Share.share({ title: experience.title, message });
        setShareStatus('Uitnodiging geopend in het deelmenu.');
      }
      setShared(hostSharedState(invite));
    } catch {
      setShareStatus('Delen lukte niet. Probeer het opnieuw vanaf dit toestel.');
    }
  };
  const chooseCompany = (value: Company) => {
    setCompany(value);
    if (value === 'solo') setShared(undefined);
  };
  // Beeldcontinuïteit (Horizon B, punt 6): dezelfde beeld-uri als op Nu reist mee;
  // de container legt het beeld met één rustige scale/fade neer (zie motion.ts).
  const imageContinuity = useImageContinuity();
  // Scène "Zo ga je": proza uit echte plandata in plaats van een spec-kaart.
  // Tijden, modus en marge komen uit het routeplan; zonder route spreekt de
  // duur, inspanning en het tijdvenster van de capsule zelf.
  const journeyLine = experience.routePlan
    ? `Je vertrekt ${transportLabels[transport].toLowerCase()} richting ${experience.routePlan.destinationName} — ${experience.routePlan.outboundMinutes} minuten heen, ${experience.routePlan.experienceMinutes} minuten daar en ${experience.routePlan.returnMinutes} minuten terug.`
    : `${experience.duration} minuten · ${experience.effort.toLowerCase()}${experience.timeWindow ? ` · het mooiste venster is ${experience.timeWindow}` : ''}.`;
  const journeyNote = experience.routePlan
    ? `Met ${experience.routePlan.bufferMinutes} minuten marge blijft haast overbodig.`
    : experience.distance
      ? `${experience.distance} is al meegerekend, zodat je nergens op hoeft te letten.`
      : undefined;
  const companyLabel = company === 'solo' ? 'Alleen' : company === 'family' ? 'Met gezin' : 'Samen';
  const guideDepthLabel = guideDepth === 'quiet' ? 'rustige begeleiding' : guideDepth === 'deep' ? 'verdiepende gids' : 'gids op het juiste moment';
  return (
    <FlowFrame>
    <View style={styles.flowScreen}>
    <ScrollView contentContainerStyle={[styles.flowScroll, styles.flowScrollStickyAction]} showsVerticalScrollIndicator={false}>
      <BackButton label="Terug" onPress={onBack} />
      <Text style={[styles.eyebrow, { color: phase.prepare.text }]}>{experienceKindLabels[experience.kind].toUpperCase()} · VOORPRET</Text><Text style={styles.flowTitle}>{experience.title}</Text><Text style={styles.screenSubtitle}>{experience.promise}</Text>
      {/* Verwachting eerst: de foto-hero met de wonderzin als hart. Niets
          praktisch boven de vouw. */}
      <CoverImage uri={experience.image} style={styles.prepareExpectationCard} imageStyle={styles.prepareExpectationImage} imageContainerStyle={imageContinuity as StyleProp<ViewStyle>}>
        <ImageShade />
        <View style={styles.prepareExpectationCopy}>
          <Text style={styles.prepareExpectationLabel}>DIT MOMENT WACHT OP JE</Text>
          <Text style={styles.prepareExpectationTitle}>{experience.wonder}</Text>
        </View>
      </CoverImage>
      {experience.meaningThread && <MeaningThreadCard experience={experience} compact />}
      {/* Scène: zo ga je — het plan als één rustige zin. */}
      <View style={styles.commitmentCard}><Text style={styles.commitmentLabel}>ZO GA JE</Text><Text style={styles.commitmentValue}>{journeyLine}</Text>{journeyNote && <Text style={styles.commitmentBody}>{journeyNote}</Text>}</View>
      {/* Scène: neem mee — de paklijst als deel van het verhaal. */}
      <View style={styles.prepareCard}><Text style={styles.expectationLabel}>NEEM MEE</Text><Text style={styles.expectationTitle}>{experience.prepareTitle}</Text>{experience.prepare.map((item) => <View key={item} style={styles.prepareRow}><View style={[styles.prepareBullet, { backgroundColor: experience.accent }]} /><Text style={styles.prepareText}>{item}</Text></View>)}</View>
      {/* Scène: de route — kaart en aankomst in consumententaal. Aannames en
          bronvensters wonen in "Waarom dit plan?" hieronder. */}
      {experience.routePlan && <View style={styles.routePlanCard}>
        <Text style={styles.liveEvidenceTitle}>ZO KOM JE ER</Text><Text style={styles.routePlanTitle}>{experience.routePlan.destinationName}</Text>
        {/* ADR-061, punt 3: in-kaart oriëntatie op de bestemming (OSM-tegels
            op native, stijlvolle fallback op web). Alleen oriëntatie; de
            routeapp blijft de route-eigenaar. */}
        {experience.routePlan.destination && <RouteMapPreview latitude={experience.routePlan.destination.latitude} longitude={experience.routePlan.destination.longitude} label={experience.routePlan.destinationName} radiusMeters={experience.routePlan.arrivalPlan?.radiusMeters} />}
        {experience.routePlan.arrivalPlan && <View style={styles.arrivalPlanCard}><Text style={styles.arrivalPlanLabel}>DAAR AANGEKOMEN</Text><Text style={styles.arrivalPlanTitle}>{experience.routePlan.arrivalPlan.label}</Text><Text style={styles.arrivalPlanBody}>{experience.routePlan.arrivalPlan.instruction}</Text><Text style={styles.arrivalPlanMeta}>{experience.routePlan.arrivalPlan.durationMinutes} min{experience.routePlan.arrivalPlan.radiusMeters ? ` · tot circa ${experience.routePlan.arrivalPlan.radiusMeters} m rond het anker` : ''}</Text><Text style={styles.arrivalPlanReturn}>{experience.routePlan.arrivalPlan.returnTrigger}</Text></View>}
        <Text style={styles.routeGuard}>{experience.routePlan.natureGuard}</Text>
      </View>}
      {/* Scène: het verhaal van de plek. */}
      {experience.placeKnowledge && <View style={styles.placeKnowledgeCard}>
        <Text style={styles.placeKnowledgeLabel}>VERHAAL VAN DE PLEK</Text>
        <Text style={styles.placeKnowledgeTitle}>{experience.placeKnowledge.title}</Text>
        <Text style={styles.placeKnowledgeBody}>{experience.placeKnowledge.summary}</Text>
        <Pressable accessibilityRole="link" accessibilityLabel={`Open bron over ${experience.placeKnowledge.title}`} onPress={() => Linking.openURL(experience.placeKnowledge!.sourceUrl).catch(() => undefined)}><Text style={[styles.placeKnowledgeSource, { color: phase.prepare.text }]}>{experience.placeKnowledge.sourceLabel} · Bekijk bron <Ionicons name="open-outline" size={11} color={phase.prepare.text} /></Text></Pressable>
      </View>}
      {/* ADR-065, fase 1: maximaal één zichtbare vraag — met wie. Dit is de
          meest ervaringsgerichte keuze; de rest zijn slimme standaardwaarden. */}
      <Text style={styles.fieldLabel}>MET WIE BELEEF JE DIT?</Text><View style={styles.chipRow}>{companyChoices.filter((item) => supportedCompanies.includes(item.id)).map((item) => <ChoiceChip key={item.id} label={item.label} selected={company === item.id} onPress={() => chooseCompany(item.id)} />)}</View>
      <View style={styles.readySummary}>
        <View style={styles.flex}><Text style={styles.readySummaryLabel}>ALLES STAAT KLAAR</Text><Text style={styles.readySummaryTitle}>{companyLabel}{experience.routePlan ? ` · ${transportLabels[transport].toLowerCase()}` : ''} · {guideDepthLabel}</Text></View>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: detailsOpen }} onPress={() => setDetailsOpen((value) => !value)} style={styles.adjustButton}><Text style={styles.adjustButtonText}>{detailsOpen ? 'Sluit' : 'Aanpassen'}</Text></Pressable>
      </View>
      {detailsOpen && <>
      {experience.routePlan && <>
      <Text style={styles.fieldLabel}>HOE GA JE?</Text><View style={styles.chipRow}>{(['walking', 'cycling'] as TransportMode[]).map((mode) => <ChoiceChip key={mode} label={transportLabels[mode]} selected={transport === mode} onPress={() => setTransport(mode)} />)}</View>
      </>}
      {company !== 'solo' && <View style={styles.sharedPlanCard}>
        <Text style={styles.expectationLabel}>SAMEN AFSTEMMEN</Text>
        <Text style={styles.sharedPlanTitle}>Hoe komen jullie samen bij het begin?</Text>
        <View style={styles.guideDepthList}>
          <Pressable onPress={() => { impactLight(); setCoordination('leave-together'); }} style={[styles.guideDepthChoice, coordination === 'leave-together' && styles.guideDepthChoiceSelected]}><View style={styles.flex}><Text style={styles.guideDepthTitle}>Samen vertrekken</Text><Text style={styles.guideDepthBody}>Eén toestel kan de voorbereiding en gids dragen.</Text></View><Ionicons name={coordination === 'leave-together' ? 'radio-button-on' : 'radio-button-off'} size={17} color={coordination === 'leave-together' ? colors.accent : colors.muted} /></Pressable>
          <Pressable onPress={() => { impactLight(); setCoordination('meet-there'); }} style={[styles.guideDepthChoice, coordination === 'meet-there' && styles.guideDepthChoiceSelected]}><View style={styles.flex}><Text style={styles.guideDepthTitle}>Ontmoet bij het startpunt</Text><Text style={styles.guideDepthBody}>Iedereen regelt de eigen reis; de ervaring begint samen.</Text></View><Ionicons name={coordination === 'meet-there' ? 'radio-button-on' : 'radio-button-off'} size={17} color={coordination === 'meet-there' ? colors.accent : colors.muted} /></Pressable>
        </View>
        {shared ? <View style={styles.participantList}>
          {shared.participants.map((participant) => <View key={participant.id} style={styles.participantRow}><View style={[styles.participantAvatar, participant.status === 'ready' && styles.participantAvatarReady]}><Text style={styles.participantAvatarText}>{participant.name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.flex}><Text style={styles.participantName}>{participant.name}</Text><Text style={styles.participantStatus}>{participant.role === 'host' ? 'Organiseert' : participant.status === 'ready' ? 'Doet mee op dit toestel' : 'Uitnodiging gedeeld'}</Text></View></View>)}
          <Text style={styles.localSharedNote}>Alleen deze ervaring wordt gedeeld. Profiel, agenda, locatiegeschiedenis en redenen achter de aanbeveling blijven privé.</Text>
        </View> : null}
        {shared?.role !== 'guest' && <Pressable onPress={shareExperience} style={styles.shareCard}><View style={styles.shareMark}><Ionicons name="share-social-outline" size={18} color={colors.accent} /></View><View style={styles.flex}><Text style={styles.shareTitle}>{shared ? 'Deel uitnodiging opnieuw' : 'Nodig iemand uit'}</Text><Text style={styles.shareBody}>De ontvanger kan de kaart openen, bekijken en meedoen op het eigen toestel.</Text></View><Ionicons name="arrow-forward" size={21} color={colors.gold} /></Pressable>}
        {shareStatus ? <Text style={styles.shareStatus}>{shareStatus}</Text> : null}
        {shared && <Pressable onPress={() => { setShared(undefined); setShareStatus('Gedeelde voorbereiding is op dit toestel gestopt.'); }} style={styles.stopSharingButton}><Text style={styles.stopSharingText}>{shared.role === 'guest' ? 'Verlaat gedeelde voorbereiding' : 'Trek deze lokale uitnodiging in'}</Text></Pressable>}
      </View>}
      <Text style={styles.fieldLabel}>HOEVEEL BEGELEIDING WIL JE?</Text><View style={styles.guideDepthList}>
        {([{ id: 'quiet', title: 'Rustig', body: 'Alleen de huidige aanwijzing; de gids blijft op afroep beschikbaar.' }, { id: 'guide', title: 'Gids', body: 'Huidige uitleg en actuele bronnen precies wanneer ze helpen.' }, { id: 'deep', title: 'Verdieping', body: 'Ook extra verhalen, alle inzichten en praktische achtergrond.' }] as Array<{ id: GuideDepth; title: string; body: string }>).map((item) => <Pressable accessibilityRole="radio" accessibilityState={{ selected: guideDepth === item.id }} key={item.id} onPress={() => { impactLight(); setGuideDepth(item.id); }} style={[styles.guideDepthChoice, guideDepth === item.id && styles.guideDepthChoiceSelected]}><View style={styles.flex}><Text style={styles.guideDepthTitle}>{item.title}</Text><Text style={styles.guideDepthBody}>{item.body}</Text></View><Ionicons name={guideDepth === item.id ? 'radio-button-on' : 'radio-button-off'} size={17} color={guideDepth === item.id ? colors.accent : colors.muted} /></Pressable>)}
      </View>
      </>}
      {/* Waarom/bron-laag (ADR-065, fase 1): eerlijkheid blijft één tik dieper
          beschikbaar — actuele aanwijzingen met bronnen, en de aannames achter
          tijden en geldigheid. Nooit als hoofdtekst. */}
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: whyOpen }} onPress={() => setWhyOpen((value) => !value)} style={styles.learningDisclosure}><View style={styles.flex}><Text style={styles.learningDisclosureTitle}>Waarom dit plan?</Text><Text style={styles.learningDisclosureBody}>{whyOpen ? 'Sluit de uitleg' : 'Actuele aanwijzingen, bronnen en aannames'}</Text></View><Ionicons name={whyOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.gold} /></Pressable>
      {whyOpen && <>
      {freshEvidence.length ? <View style={styles.prepareLiveCard}><Text style={styles.liveEvidenceTitle}>WAT DE WERELD NU LAAT ZIEN</Text>{freshEvidence.slice(0, 3).map((evidence) => <View key={`${evidence.sourceName}-${evidence.label}`} style={styles.prepareLiveRow}><View style={styles.liveEvidenceDot} /><View style={styles.flex}><Text style={styles.liveEvidenceLabel}>{evidence.label}</Text><Text style={styles.liveEvidenceMeta}>{evidence.sourceName} · {evidence.certainty === 'observation' ? 'recente waarneming' : 'actuele verwachting'} · {evidence.freshnessLabel.toLowerCase()}</Text></View></View>)}</View> : <View style={styles.editorialDepthCard}><Text style={styles.expectationLabel}>TIJDENS JE ERVARING</Text><Text style={styles.editorialDepthText}>{experience.steps.find((step) => step.insight)?.insight?.title ?? experience.wonder}</Text><Text style={styles.editorialDepthSource}>Een verdiepend gidsmoment is beschikbaar wanneer het helpt.</Text>{guide.evidence.some((item) => item.freshness === 'expired') ? <Text style={styles.expiredEvidenceText}>Eerdere broncontext is verlopen en wordt niet meer als actuele aanwijzing gebruikt.</Text> : null}</View>}
      {experience.routePlan && <View style={styles.commitmentCard}>
        <Text style={styles.commitmentLabel}>ZO ZIJN TIJDEN EN BRONNEN OPGEBOUWD</Text>
        <Text style={styles.commitmentBody}>Je gaat {transportLabels[transport].toLowerCase()} · rustig geschat (conservatieve voorinschatting){experience.routePlan.sourceLabel ? ` · ${experience.routePlan.sourceLabel}` : ''}</Text>
        {transport !== experience.routePlan.mode && <Text style={styles.commitmentBody}>De tijdsinschatting is samengesteld voor {transportLabels[experience.routePlan.mode].toLowerCase()}; jouw keuze past het plan aan zonder die eerlijke marge te verkorten.</Text>}
        <Text style={styles.commitmentBody}>{experience.routePlan.routeCapability?.detail ?? routingCapability().detail}</Text>
        {experience.routePlan.expiresAt && <Text style={styles.commitmentBody}>Bronvenster geldig tot {new Date(experience.routePlan.expiresAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}. Vlak voor vertrek volgt een nieuwe geldigheidscontrole.</Text>}
        {experience.routePlan.recheckLabel && <Text style={styles.commitmentBody}>{experience.routePlan.recheckLabel}</Text>}
      </View>}
      <View style={styles.commitmentCard}><Text style={styles.commitmentLabel}>ZO IS DIT PLAN SAMENGESTELD</Text><Text style={styles.commitmentBody}>{guide.coverageLabel}{guide.compositionLabel ? ` · ${guide.compositionLabel}` : ''}. Je kunt tijdens de ervaring altijd terugschakelen naar je omgeving.</Text></View>
      </>}
    </ScrollView>
    <View style={styles.stickyActionBar}>
      <PrimaryButton label={company === 'solo' ? 'Ik ga nu' : 'Wij gaan beginnen'} onPress={() => onStart(company, guideDepth, shared ? { ...shared, coordination } : undefined, transport)} />
    </View>
    </View>
    </FlowFrame>
  );
}
