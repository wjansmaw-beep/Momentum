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
import { Company } from '../../product/localIntelligence';
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
import { colors } from '../../design/theme';
import { impactLight } from '../../design/haptics';
import { useImageContinuity } from '../../design/motion';
import { CoverImage, ImageShade } from '../CoverImage';
import { BackButton, CapsuleShapePreview, ChoiceChip, MeaningThreadCard, MiniFact, PrimaryButton, SecondaryButton } from '../primitives';
import { FlowFrame } from '../frames';
import { styles } from '../styles/appStyles';
import { useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';

// Prepare-scherm (ADR-058): verhuisd uit App.tsx. De sticky primaire actie
// start Presence via de navigator (push); 'Terug' is nu de platform-pop.

export function PrepareScreen() {
  const { selected: experience, personalProfile: personal, activeSession, sharedDraft, savePreparation, startPresence } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const hostName = personal.firstName || 'Iemand';
  const initialCompany: Company = (activeSession?.experienceId === experience.id ? activeSession.company : sharedDraft ? 'together' : personal.defaultCompany) ?? 'solo';
  const initialGuideDepth = activeSession?.experienceId === experience.id ? activeSession.guideDepth : undefined;
  const initialShared = activeSession?.experienceId === experience.id ? activeSession.shared : sharedDraft ?? undefined;
  const onBack = () => navigation.goBack();
  const onDraftChange = (company: Company, guideDepth: GuideDepth, shared?: SharedCapsuleState) => savePreparation(company, guideDepth, shared);
  const onStart = (company: Company, guideDepth: GuideDepth, shared?: SharedCapsuleState) => {
    startPresence(company, guideDepth, shared);
    navigation.navigate('Presence');
  };
  const supportedCompanies = experience.company;
  const [company, setCompany] = useState<Company>(supportedCompanies.includes(initialCompany) ? initialCompany : supportedCompanies[0]);
  const guidanceMuted = personal.mutedInsightExperienceIds.includes(experience.id);
  const preferredGuideDepth: GuideDepth = guidanceMuted || personal.guidanceBalance <= -0.2 ? 'quiet' : personal.guidanceBalance >= 0.45 ? 'deep' : experience.presenceMode === 'quiet' ? 'quiet' : 'guide';
  const [guideDepth, setGuideDepth] = useState<GuideDepth>(initialGuideDepth ?? preferredGuideDepth);
  const [coordination, setCoordination] = useState<SharedCoordination>(initialShared?.coordination ?? 'leave-together');
  const [shared, setShared] = useState<SharedCapsuleState | undefined>(initialShared);
  const [shareStatus, setShareStatus] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const guide = buildExperienceGuide(experience, 0);
  const freshEvidence = guide.evidence.filter((item) => item.freshness === 'current');
  const guideInsights = ([guide.currentInsight, ...guide.furtherInsights].filter(Boolean) as NonNullable<typeof guide.currentInsight>[]).filter((insight) => !guidanceMuted && !personal.mutedInsightTopics.includes(insight.topic));
  const companyChoices: Array<{ id: Company; label: string }> = [{ id: 'solo', label: 'Alleen' }, { id: 'together', label: 'Samen' }, { id: 'family', label: 'Met gezin' }];
  useEffect(() => {
    onDraftChange(company, guideDepth, shared ? { ...shared, coordination } : undefined);
  }, [company, coordination, guideDepth, shared]);
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
  const toggleReadiness = (key: keyof NonNullable<SharedCapsuleState['readiness']>) => {
    impactLight();
    setShared((current) => current ? {
      ...current,
      readiness: { ...(current.readiness ?? { timing: false, pace: false, practical: false }), [key]: !(current.readiness?.[key] ?? false) },
    } : current);
  };
  // Beeldcontinuïteit (Horizon B, punt 6): dezelfde beeld-uri als op Nu reist mee;
  // de container legt het beeld met één rustige scale/fade neer (zie motion.ts).
  const imageContinuity = useImageContinuity();
  // North Star Frame 5: de voorbereiding toont in eerste zicht alleen het noodzakelijke —
  // fotokaart/belofte → capsule-essentie (tijd, wat je nodig hebt, gezelschap) → primaire actie.
  // Verdieping (live-aanwijzingen, route, verhaal van de plek) blijft ongewijzigd beschikbaar
  // achter een rustige disclosure; de primaire actie blijft via een sticky voettekst altijd
  // zichtbaar, zonder content te overlappen (extra padding onderaan de scroll).
  return (
    <FlowFrame>
    <View style={styles.flowScreen}>
    <ScrollView contentContainerStyle={[styles.flowScroll, styles.flowScrollStickyAction]} showsVerticalScrollIndicator={false}>
      <BackButton label="Terug" onPress={onBack} />
      <Text style={styles.eyebrow}>{experienceKindLabels[experience.kind].toUpperCase()} · UITNODIGING</Text><Text style={styles.flowTitle}>{experience.title}</Text><Text style={styles.screenSubtitle}>{experience.promise}</Text>
      <CoverImage uri={experience.image} style={styles.prepareExpectationCard} imageStyle={styles.prepareExpectationImage} imageContainerStyle={imageContinuity as StyleProp<ViewStyle>}>
        <ImageShade />
        <View style={styles.prepareExpectationCopy}>
          <Text style={styles.prepareExpectationLabel}>WAT JE KUNT VERWACHTEN</Text>
          <Text style={styles.prepareExpectationTitle}>{experience.wonder}</Text>
          <Text style={styles.prepareExpectationBody}>{experience.prepareTitle}</Text>
        </View>
      </CoverImage>
      <CapsuleShapePreview experience={experience} />
      {experience.meaningThread && <MeaningThreadCard experience={experience} compact />}
      <View style={styles.commitmentCard}><Text style={styles.commitmentLabel}>TIJD EN INSPANNING</Text><Text style={styles.commitmentValue}>{experience.duration} minuten · {experience.effort.toLowerCase()}</Text>{experience.distance && <Text style={styles.commitmentBody}>{experience.distance} is meegenomen voordat je begint.</Text>}</View>
      <Text style={styles.fieldLabel}>{experience.kind === 'food' ? 'INGREDIËNTEN EN KEUKEN' : experience.kind === 'movement' ? 'MATERIAAL EN OPBOUW' : experience.kind === 'restore' ? 'MAAK RUIMTE VOOR RUST' : experience.kind === 'outside' ? 'VOOR ROUTE EN OMSTANDIGHEDEN' : 'ALLEEN WAT JE NODIG HEBT'}</Text><View style={styles.prepareCard}>{experience.prepare.map((item) => <View key={item} style={styles.prepareRow}><View style={[styles.prepareBullet, { backgroundColor: experience.accent }]} /><Text style={styles.prepareText}>{item}</Text></View>)}</View>
      <View style={styles.readySummary}>
        <View style={styles.flex}><Text style={styles.readySummaryLabel}>ZO GA JE</Text><Text style={styles.readySummaryTitle}>{company === 'solo' ? 'Alleen' : company === 'family' ? 'Met gezin' : 'Samen'} · {guideDepth === 'quiet' ? 'rustige begeleiding' : guideDepth === 'deep' ? 'verdiepende gids' : 'gids op het juiste moment'}</Text></View>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: detailsOpen }} onPress={() => setDetailsOpen((value) => !value)} style={styles.adjustButton}><Text style={styles.adjustButtonText}>{detailsOpen ? 'Sluit keuzes' : 'Gezelschap & gids'}</Text></Pressable>
      </View>
      {detailsOpen && <>
      <Text style={styles.fieldLabel}>MET WIE BELEEF JE DIT?</Text><View style={styles.chipRow}>{companyChoices.filter((item) => supportedCompanies.includes(item.id)).map((item) => <ChoiceChip key={item.id} label={item.label} selected={company === item.id} onPress={() => chooseCompany(item.id)} />)}</View>
      {company !== 'solo' && <View style={styles.sharedPlanCard}>
        <Text style={styles.expectationLabel}>SAMEN AFSTEMMEN</Text>
        <Text style={styles.sharedPlanTitle}>Hoe komen jullie samen bij het begin?</Text>
        <View style={styles.guideDepthList}>
          <Pressable onPress={() => { impactLight(); setCoordination('leave-together'); }} style={[styles.guideDepthChoice, coordination === 'leave-together' && styles.guideDepthChoiceSelected]}><View style={styles.flex}><Text style={styles.guideDepthTitle}>Samen vertrekken</Text><Text style={styles.guideDepthBody}>Eén toestel kan de voorbereiding en gids dragen.</Text></View><Ionicons name={coordination === 'leave-together' ? 'radio-button-on' : 'radio-button-off'} size={17} color={coordination === 'leave-together' ? colors.accent : colors.muted} /></Pressable>
          <Pressable onPress={() => { impactLight(); setCoordination('meet-there'); }} style={[styles.guideDepthChoice, coordination === 'meet-there' && styles.guideDepthChoiceSelected]}><View style={styles.flex}><Text style={styles.guideDepthTitle}>Ontmoet bij het startpunt</Text><Text style={styles.guideDepthBody}>Iedereen regelt de eigen reis; de ervaring begint samen.</Text></View><Ionicons name={coordination === 'meet-there' ? 'radio-button-on' : 'radio-button-off'} size={17} color={coordination === 'meet-there' ? colors.accent : colors.muted} /></Pressable>
        </View>
        {shared ? <View style={styles.participantList}>
          {shared.participants.map((participant) => <View key={participant.id} style={styles.participantRow}><View style={[styles.participantAvatar, participant.status === 'ready' && styles.participantAvatarReady]}><Text style={styles.participantAvatarText}>{participant.name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.flex}><Text style={styles.participantName}>{participant.name}</Text><Text style={styles.participantStatus}>{participant.role === 'host' ? 'Organiseert' : participant.status === 'ready' ? 'Doet mee op dit toestel' : 'Uitnodiging gedeeld · reactie nog niet gesynchroniseerd'}</Text></View></View>)}
          <Text style={styles.localSharedNote}>Alleen deze ervaring wordt gedeeld. Profiel, agenda, locatiegeschiedenis en redenen achter de aanbeveling blijven privé.</Text>
          <Text style={styles.sharedReadinessTitle}>LOKAAL SAMEN CONTROLEREN</Text>
          {([{ key: 'timing', label: 'De tijd klopt voor ons' }, { key: 'pace', label: 'Tempo en uitdaging passen' }, { key: 'practical', label: 'Startpunt en praktisch zijn duidelijk' }] as const).map((item) => <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: shared.readiness?.[item.key] ?? false }} key={item.key} onPress={() => toggleReadiness(item.key)} style={styles.sharedReadinessRow}><Ionicons name={(shared.readiness?.[item.key] ?? false) ? 'checkmark-circle' : 'ellipse-outline'} size={19} color={(shared.readiness?.[item.key] ?? false) ? experience.accent : colors.muted} style={styles.sharedReadinessMark} /><Text style={styles.sharedReadinessLabel}>{item.label}</Text></Pressable>)}
          <Text style={styles.localSharedNote}>{Object.values(shared.readiness ?? {}).filter(Boolean).length === 3 ? 'Op dit toestel is alles samen gecontroleerd.' : 'Deze controle is alleen lokaal en blokkeert het starten niet.'}</Text>
        </View> : null}
        {shared?.role !== 'guest' && <Pressable onPress={shareExperience} style={styles.shareCard}><View style={styles.shareMark}><Ionicons name="share-social-outline" size={18} color={colors.accent} /></View><View style={styles.flex}><Text style={styles.shareTitle}>{shared ? 'Deel uitnodiging opnieuw' : 'Nodig iemand uit'}</Text><Text style={styles.shareBody}>De ontvanger kan de kaart openen, bekijken en lokaal deelnemen.</Text></View><Ionicons name="arrow-forward" size={21} color={colors.gold} /></Pressable>}
        {shareStatus ? <Text style={styles.shareStatus}>{shareStatus}</Text> : null}
        {shared && <Pressable onPress={() => { setShared(undefined); setShareStatus('Gedeelde voorbereiding is op dit toestel gestopt.'); }} style={styles.stopSharingButton}><Text style={styles.stopSharingText}>{shared.role === 'guest' ? 'Verlaat gedeelde voorbereiding' : 'Trek deze lokale uitnodiging in'}</Text></Pressable>}
      </View>}
      <Text style={styles.fieldLabel}>HOEVEEL BEGELEIDING WIL JE?</Text><View style={styles.guideDepthList}>
        {([{ id: 'quiet', title: 'Rustig', body: 'Alleen de huidige aanwijzing; de gids blijft op afroep beschikbaar.' }, { id: 'guide', title: 'Gids', body: 'Huidige uitleg en actuele bronnen precies wanneer ze helpen.' }, { id: 'deep', title: 'Verdieping', body: 'Ook extra verhalen, alle inzichten en praktische achtergrond.' }] as Array<{ id: GuideDepth; title: string; body: string }>).map((item) => <Pressable accessibilityRole="radio" accessibilityState={{ selected: guideDepth === item.id }} key={item.id} onPress={() => { impactLight(); setGuideDepth(item.id); }} style={[styles.guideDepthChoice, guideDepth === item.id && styles.guideDepthChoiceSelected]}><View style={styles.flex}><Text style={styles.guideDepthTitle}>{item.title}</Text><Text style={styles.guideDepthBody}>{item.body}</Text></View><Ionicons name={guideDepth === item.id ? 'radio-button-on' : 'radio-button-off'} size={17} color={guideDepth === item.id ? colors.accent : colors.muted} /></Pressable>)}
      </View>
      <View style={styles.guidePreviewCard}>
        <Text style={styles.expectationLabel}>ZO BLIJFT DE GIDS BESCHIKBAAR</Text>
        <Text style={styles.guidePreviewTitle}>{guideDepth === 'quiet' ? 'Alleen wanneer jij hem opent' : guideDepth === 'guide' ? 'Eén inzicht op het juiste moment' : `${guideInsights.length} gidsmomenten om verder te kijken`}</Text>
        <Text style={styles.guidePreviewBody}>{guideDepth === 'quiet' ? 'Je ziet de huidige stap. Uitleg en bronnen blijven op de achtergrond.' : guideDepth === 'guide' ? (guideInsights[0]?.title ?? 'De huidige aanwijzing blijft leidend.') : guideInsights.slice(0, 3).map((item) => item.title).join(' · ')}</Text>
        <Text style={styles.guidePreviewSource}>{guide.coverageLabel}{guide.compositionLabel ? ` · ${guide.compositionLabel}` : ''}. Je kunt tijdens de ervaring altijd terugschakelen naar je omgeving.</Text>
      </View>
      </>}
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: moreOpen }} onPress={() => setMoreOpen((value) => !value)} style={styles.learningDisclosure}><View style={styles.flex}><Text style={styles.learningDisclosureTitle}>Meer over deze ervaring</Text><Text style={styles.learningDisclosureBody}>{moreOpen ? 'Sluit de verdieping' : 'Actuele aanwijzingen, route en verhaal van de plek'}</Text></View><Ionicons name={moreOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.gold} /></Pressable>
      {moreOpen && <>
      {freshEvidence.length ? <View style={styles.prepareLiveCard}><Text style={styles.liveEvidenceTitle}>WAT DE WERELD NU LAAT ZIEN</Text>{freshEvidence.slice(0, 3).map((evidence) => <View key={`${evidence.sourceName}-${evidence.label}`} style={styles.prepareLiveRow}><View style={styles.liveEvidenceDot} /><View style={styles.flex}><Text style={styles.liveEvidenceLabel}>{evidence.label}</Text><Text style={styles.liveEvidenceMeta}>{evidence.sourceName} · {evidence.certainty === 'observation' ? 'recente waarneming' : 'actuele verwachting'} · {evidence.freshnessLabel.toLowerCase()}</Text></View></View>)}</View> : <View style={styles.editorialDepthCard}><Text style={styles.expectationLabel}>TIJDENS JE ERVARING</Text><Text style={styles.editorialDepthText}>{experience.steps.find((step) => step.insight)?.insight?.title ?? experience.wonder}</Text><Text style={styles.editorialDepthSource}>Een verdiepend gidsmoment is beschikbaar wanneer het helpt.</Text>{guide.evidence.some((item) => item.freshness === 'expired') ? <Text style={styles.expiredEvidenceText}>Eerdere broncontext is verlopen en wordt niet meer als actuele aanwijzing gebruikt.</Text> : null}</View>}
      {experience.routePlan && <View style={styles.routePlanCard}>
        <Text style={styles.liveEvidenceTitle}>ROUTE NAAR HET BEGIN</Text><Text style={styles.routePlanTitle}>{experience.routePlan.destinationName}</Text>
        <View style={styles.routeBudget}><MiniFact value={`${experience.routePlan.outboundMinutes} min`} label="heen" /><MiniFact value={`${experience.routePlan.experienceMinutes} min`} label="beleven" /><MiniFact value={`${experience.routePlan.returnMinutes} min`} label="terug" /><MiniFact value={`${experience.routePlan.bufferMinutes} min`} label="buffer" /></View>
        <Text style={styles.routeEstimate}>{experience.routePlan.mode === 'cycling' ? 'Fiets' : 'Te voet'} · conservatieve voorinschatting{experience.routePlan.sourceLabel ? ` · ${experience.routePlan.sourceLabel}` : ''}</Text>
        <Text style={styles.routeWindow}>{experience.routePlan.routeCapability?.detail ?? routingCapability().detail}</Text>
        {experience.routePlan.expiresAt && <Text style={styles.routeWindow}>Bronvenster geldig tot {new Date(experience.routePlan.expiresAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}. Vlak voor vertrek volgt een nieuwe geldigheidscontrole.</Text>}
        <Text style={styles.routeGuard}>{experience.routePlan.natureGuard}</Text>
        {experience.routePlan.arrivalPlan && <View style={styles.arrivalPlanCard}><Text style={styles.arrivalPlanLabel}>TER PLAATSE</Text><Text style={styles.arrivalPlanTitle}>{experience.routePlan.arrivalPlan.label}</Text><Text style={styles.arrivalPlanBody}>{experience.routePlan.arrivalPlan.instruction}</Text><Text style={styles.arrivalPlanMeta}>{experience.routePlan.arrivalPlan.durationMinutes} min{experience.routePlan.arrivalPlan.radiusMeters ? ` · tot circa ${experience.routePlan.arrivalPlan.radiusMeters} m rond het anker` : ''}</Text><Text style={styles.arrivalPlanReturn}>{experience.routePlan.arrivalPlan.returnTrigger}</Text></View>}
        {experience.routePlan.recheckLabel && <Text style={styles.routeRecheck}>{experience.routePlan.recheckLabel}</Text>}
      </View>}
      {experience.placeKnowledge && <View style={styles.placeKnowledgeCard}>
        <Text style={styles.placeKnowledgeLabel}>VERHAAL VAN DE PLEK</Text>
        <Text style={styles.placeKnowledgeTitle}>{experience.placeKnowledge.title}</Text>
        <Text style={styles.placeKnowledgeBody}>{experience.placeKnowledge.summary}</Text>
        <Pressable accessibilityRole="link" accessibilityLabel={`Open bron over ${experience.placeKnowledge.title}`} onPress={() => Linking.openURL(experience.placeKnowledge!.sourceUrl).catch(() => undefined)}><Text style={[styles.placeKnowledgeSource, { color: experience.accent }]}>{experience.placeKnowledge.sourceLabel} · Bekijk bron <Ionicons name="open-outline" size={11} color={experience.accent} /></Text></Pressable>
      </View>}
      </>}
    </ScrollView>
    <View style={styles.stickyActionBar}>
      <PrimaryButton label={company === 'solo' ? 'Ik ga nu' : 'Wij gaan beginnen'} onPress={() => onStart(company, guideDepth, shared ? { ...shared, coordination } : undefined)} />
    </View>
    </View>
    </FlowFrame>
  );
}
