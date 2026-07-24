import React, { useEffect, useRef, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Reanimated from 'react-native-reanimated';
import { Experience } from '../../product/experienceModel';
import { SharedCapsuleState } from '../../sharing/sharedCapsule';
import { ExperienceGuidePanel } from '../../guidance/ExperienceGuidePanel';
import { buildExperienceGuide } from '../../guidance/experienceGuide';
import { verifyRouteBeforeHandoff } from '../../routing/routeIntelligence';
import { colors, phase } from '../../design/theme';
import { impactLight } from '../../design/haptics';
import { useBreathing, useImageContinuity } from '../../design/motion';
import { CoverImage, DimShade } from '../CoverImage';
import { BackButton, PrimaryButton, SecondaryButton } from '../primitives';
import { FlowFrame } from '../frames';
import { styles } from '../styles/appStyles';
import { useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';

// Presence-scherm (ADR-058): verhuisd uit App.tsx. Android-back loopt nu via de
// navigator (beforeRemove): eerst gids-sheet of Phone Away sluiten, anders
// rustig terug naar Prepare — exact het gedrag van de vroegere handmatige
// BackHandler. De swipe-pop op dit scherm staat uit zodat die logica altijd loopt.

export function PresenceScreen() {
  const { selected: experience, personalProfile: personal, activeSession, updatePresenceStep, presenceBack, finishPresence } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const company = activeSession?.company ?? personal.defaultCompany;
  const guideDepth = activeSession?.guideDepth ?? 'guide';
  const shared = activeSession?.shared;
  const initialStep = activeSession?.experienceId === experience.id ? activeSession.stepIndex : 0;
  const onStepChange = (stepIndex: number) => updatePresenceStep(stepIndex);
  const onFinish = () => {
    finishPresence();
    navigation.navigate('Remember');
  };
  const [stepIndex, setStepIndex] = useState(Math.min(initialStep, Math.max(0, experience.steps.length - 1)));
  const [remaining, setRemaining] = useState(experience.steps[Math.min(initialStep, Math.max(0, experience.steps.length - 1))]?.seconds ?? 0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [phoneAway, setPhoneAway] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [handoffStatus, setHandoffStatus] = useState('');
  // Beeldcontinuïteit (Horizon B, punt 6): dezelfde beeld-uri als Nu en Prepare;
  // de backdrop legt het beeld met dezelfde rustige neerleg-beweging neer.
  const imageContinuity = useImageContinuity();
  const current = experience.steps[stepIndex] ?? { title: experience.presenceTitle, instruction: experience.presenceCue };
  const insightVisible = guideDepth !== 'quiet' && current.insight && (guideDepth === 'deep' || personal.guidanceBalance > -0.2) && !personal.mutedInsightTopics.includes(current.insight.topic) && !personal.mutedInsightExperienceIds.includes(experience.id);
  const isLast = stepIndex >= experience.steps.length - 1;
  const timedStepInProgress = Boolean(current.seconds && remaining > 0);
  const unfilteredGuide = buildExperienceGuide(experience, stepIndex);
  const insightAllowed = (insight: NonNullable<typeof current.insight>) => !personal.mutedInsightTopics.includes(insight.topic) && !personal.mutedInsightExperienceIds.includes(experience.id);
  const guide = { ...unfilteredGuide, currentInsight: unfilteredGuide.currentInsight && insightAllowed(unfilteredGuide.currentInsight) ? unfilteredGuide.currentInsight : undefined, furtherInsights: unfilteredGuide.furtherInsights.filter(insightAllowed), moments: unfilteredGuide.moments.filter((moment) => insightAllowed(moment.insight)) };

  useEffect(() => {
    setRemaining(current.seconds ?? 0);
    setTimerRunning(false);
    onStepChange(stepIndex);
  }, [current.seconds, stepIndex]);

  useEffect(() => {
    if (!timerRunning || remaining <= 0) return;
    const timer = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [remaining, timerRunning]);

  const leavingRef = useRef(false);
  const onBack = () => {
    leavingRef.current = true;
    presenceBack();
    navigation.dispatch(StackActions.replace('Prepare'));
  };
  useEffect(() => navigation.addListener('beforeRemove', (event) => {
    if (leavingRef.current) return;
    event.preventDefault();
    if (guideOpen) { setGuideOpen(false); return; }
    if (phoneAway) { setPhoneAway(false); return; }
    onBack();
  }), [navigation, guideOpen, phoneAway]);

  const openHandoff = async () => {
    const plan = experience.routePlan;
    if (plan?.expiresAt && Date.parse(plan.expiresAt) <= Date.now()) {
      setHandoffStatus('Deze actuele kans is verlopen. Ga terug en vernieuw de Living World-bronnen voordat je vertrekt.');
      return;
    }
    if (plan) {
      setHandoffStatus('Route en tijdsbudget worden gecontroleerd…');
      const check = await verifyRouteBeforeHandoff(plan);
      if (check.state === 'over-budget') {
        setHandoffStatus(check.detail);
        return;
      }
      setHandoffStatus(check.detail);
    }
    const source = plan?.source ? `${plan.source.latitude},${plan.source.longitude}` : undefined;
    const destination = plan?.destination ? `${plan.destination.latitude},${plan.destination.longitude}` : plan?.destinationName ?? experience.title;
    const params = new URLSearchParams({ destination, mode: plan?.mode ?? 'walking' });
    if (source) params.set('source', source);
    const url = `https://maps.apple.com/directions?${params.toString()}`;
    await Linking.openURL(url).catch(() => setHandoffStatus('Kaarten kon niet worden geopend. Controleer de bestemming handmatig.'));
  };
  const next = () => {
    if (isLast) onFinish();
    else { impactLight(); setStepIndex((value) => value + 1); }
  };
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  if (phoneAway) return <FlowFrame statusBar="light"><PhoneAwayView experience={experience} cue={current.title} seconds={current.seconds} remaining={remaining} formatTime={formatTime} shared={shared} onReopen={() => { setPhoneAway(false); setGuideOpen(true); }} /></FlowFrame>;
  return (
    <FlowFrame statusBar="light">
    <CoverImage uri={experience.image} style={styles.presenceScreen} imageStyle={styles.presenceBackdrop} imageContainerStyle={imageContinuity as StyleProp<ViewStyle>}>
      <DimShade opacity={0.74} />
      <View style={styles.presenceTopRow}><BackButton label="Voorbereiding" onPress={onBack} /><View style={styles.presenceActions}><Pressable accessibilityRole="button" accessibilityLabel="Open de ervaringsgids" onPress={() => setGuideOpen(true)} style={styles.guideButton}><Text style={styles.guideButtonText}>Gids</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Leg de telefoon weg" onPress={() => setPhoneAway(true)} style={styles.phoneAwayButton}><Text style={styles.phoneAwayButtonText}>Telefoon weg</Text></Pressable></View></View>
      <View style={styles.capsuleProgress}>
        {experience.steps.map((_, index) => <View key={index} style={[styles.capsuleProgressPart, index <= stepIndex && { backgroundColor: phase.presence.accent }]} />)}
      </View>
      <ScrollView contentContainerStyle={styles.capsuleStep} showsVerticalScrollIndicator={false}>
        <View style={styles.presenceStage}>
        <Text style={[styles.eyebrow, { color: phase.presence.accent }]}>{experience.presenceMode === 'handoff' ? 'ONDERWEG' : experience.presenceMode === 'quiet' ? 'RUSTIGE BEGELEIDING' : 'HUIDIGE STAP'}</Text>
        <Text style={[styles.capsuleStepCount, { color: phase.presence.mutedOnSurface }]}>{stepIndex + 1} van {experience.steps.length} · {company === 'solo' ? 'alleen' : company === 'family' ? 'met gezin' : 'samen'}</Text>
        {shared && <View style={styles.presenceTogetherCard}><View style={styles.presenceTogetherAvatars}>{shared.participants.filter((participant) => participant.status === 'ready').map((participant) => <View key={participant.id} style={styles.presenceTogetherAvatar}><Text style={styles.participantAvatarText}>{participant.name.slice(0, 1).toUpperCase()}</Text></View>)}</View><View style={styles.flex}><Text style={styles.presenceTogetherTitle}>Eén gedeelde ervaring</Text><Text style={styles.presenceTogetherBody}>{shared.coordination === 'meet-there' ? 'Jullie ontmoetten elkaar bij het begin.' : 'Jullie begonnen samen.'} Deze gids loopt alleen op dit toestel.</Text></View></View>}
        <Text style={[styles.presenceTitle, { color: phase.presence.onSurface }]}>{current.title}</Text>
        {current.meta && <View style={[styles.stepMetaPill, { borderColor: phase.presence.accent }]}><Text style={[styles.stepMetaText, { color: phase.presence.onSurface }]}>{current.meta}</Text></View>}
        <Text style={[styles.presenceCue, { color: phase.presence.mutedOnSurface }]}>{current.instruction}</Text>
        {insightVisible && <View style={styles.insightCard}>
          <Text style={styles.insightEyebrow}>KLEIN INZICHT · ALLEEN ALS HET HELPT</Text>
          <Text style={styles.insightTitle}>{current.insight?.title}</Text>
          <Text style={styles.insightBody}>{current.insight?.body}</Text>
          {current.insight?.sourceUrl ? <Pressable accessibilityRole="link" onPress={() => Linking.openURL(current.insight!.sourceUrl!).catch(() => undefined)}><Text style={[styles.insightSource, { color: colors.accentText }]}>{current.insight.sourceLabel} · Bekijk bron <Ionicons name="open-outline" size={11} color={colors.accentText} /></Text></Pressable> : <Text style={styles.insightSource}>{current.insight?.sourceKind === 'live' ? 'Actuele bron' : current.insight?.sourceKind === 'curator' ? 'Plaatskennis' : 'Redactioneel'} · {current.insight?.sourceLabel}</Text>}
        </View>}
        {current.seconds ? (
          <View style={[styles.stepTimer, { borderColor: phase.presence.accent }]}>
            <Text style={[styles.stepTimerValue, { color: phase.presence.onSurface }]}>{formatTime(remaining)}</Text>
            <Text style={[styles.presenceUnit, { color: phase.presence.mutedOnSurface }]}>{remaining === 0 ? 'KLAAR' : timerRunning ? 'LOOPT' : 'KLAAR OM TE STARTEN'}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={remaining === 0 ? 'Timer afgerond' : timerRunning ? 'Pauzeer timer' : 'Start timer'} accessibilityState={{ disabled: remaining === 0 }} onPress={() => remaining > 0 && setTimerRunning((value) => !value)} style={[styles.timerControl, { borderColor: phase.presence.line }]}>
              {remaining === 0 ? <Ionicons name="checkmark" size={14} color={phase.presence.onSurface} /> : <Text style={[styles.timerControlText, { color: phase.presence.onSurface }]}>{timerRunning ? 'Pauze' : 'Start timer'}</Text>}
            </Pressable>
          </View>
        ) : (
          <View style={[styles.quietStepOrb, { borderColor: phase.presence.accent }]}><Ionicons name={experience.presenceMode === 'quiet' ? 'leaf-outline' : experience.presenceMode === 'handoff' ? 'navigate-outline' : 'ellipse-outline'} size={38} color={phase.presence.accent} /></View>
        )}
        {experience.presenceMode === 'handoff' && stepIndex === 0 && <SecondaryButton label="Open route in Kaarten" onPress={openHandoff} />}
        {handoffStatus ? <Text style={[styles.handoffStatus, { color: phase.presence.accent }]}>{handoffStatus}</Text> : null}
        </View>
      </ScrollView>
      <View style={styles.presenceFooterPanel}>
        <PrimaryButton disabled={timedStepInProgress} label={isLast ? 'Ervaring afronden' : timedStepInProgress ? 'Rond eerst deze timer af' : 'Volgende stap'} onPress={next} />
        {timedStepInProgress && <SecondaryButton label="Sla deze timer over" onPress={next} />}
        {stepIndex > 0 && <SecondaryButton label="Vorige stap" onPress={() => setStepIndex((value) => Math.max(0, value - 1))} />}
        <Text style={styles.presenceFooter}>{experience.presenceMode === 'quiet' ? 'Gebruik alleen de aanwijzing die helpt. Leg daarna je telefoon weg.' : 'Alleen de huidige stap vraagt aandacht.'}</Text>
      </View>
      {guideOpen && <ExperienceGuidePanel guide={guide} depth={guideDepth} accent={experience.accent} image={experience.image} onClose={() => setGuideOpen(false)} />}
    </CoverImage>
    </FlowFrame>
  );
}

// Phone Away (Horizon B): echt OLED-zwart met één zacht gloeiend, ademend
// element (Reanimated; geen Skia). Bij reduced-motion staat de gloed stil.
function PhoneAwayView({ experience, cue, seconds, remaining, formatTime, shared, onReopen }: { experience: Experience; cue: string; seconds?: number; remaining: number; formatTime: (seconds: number) => string; shared?: SharedCapsuleState; onReopen: () => void }) {
  const breath = useBreathing({ period: 6400, scaleTo: 1.055, opacityTo: 0.72 });
  return <View style={styles.phoneAwayScreen}>
    <Text style={styles.phoneAwayEyebrow}>PRESENCE</Text><Text style={styles.phoneAwayTitle}>{experience.title}</Text><Text style={styles.phoneAwayCue}>{cue}</Text>
    <Reanimated.View style={[styles.phoneAwayGlow, { borderColor: phase.presence.accent, shadowColor: phase.presence.accent }, breath]}>
      {seconds ? <Text style={styles.phoneAwayTimer}>{formatTime(remaining)}</Text> : <Ionicons name="ellipse" size={10} color={phase.presence.accent} />}
    </Reanimated.View>
    {shared && <Text style={styles.phoneAwayTogether}>{shared.participants.filter((participant) => participant.status === 'ready').map((participant) => participant.name).join(' + ')} · samen aanwezig</Text>}
    <Text style={styles.phoneAwayBody}>Je hoeft nu niets te bedienen. De gids blijft met één tik beschikbaar.</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Raadpleeg de gids" onPress={onReopen} style={styles.reopenGuide}><Text style={styles.reopenGuideText}>Raadpleeg de gids</Text></Pressable>
  </View>;
}
