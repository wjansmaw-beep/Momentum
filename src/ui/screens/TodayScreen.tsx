import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Experience } from '../../product/experienceModel';
import { formatWindow } from '../../context/calendarContext';
import { evidenceSummary } from '../../guidance/experienceGuide';
import { colors } from '../../design/theme';
import { CoverImage, ImageShade } from '../CoverImage';
import { QuietCanvas } from '../QuietCanvas';
import { ScreenHeader } from '../primitives';
import { SurfaceFrame } from '../frames';
import { styles } from '../styles/appStyles';
import { useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';

// Vandaag-scherm (ADR-058): verhuisd uit App.tsx. Opent een moment via de
// navigator (push 'Prepare' — voorheen setFlowStage('prepare')).

export function TodayScreen() {
  const { dayDecisions, calendarContext, openExperience } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const decisions = dayDecisions;
  const calendar = calendarContext;
  const onOpen = (item: Experience) => {
    openExperience(item, 'today');
    navigation.navigate('Prepare');
  };
  const localDate = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toLocaleUpperCase('nl-NL');
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const startMinutes = (value: string) => {
    const match = value.match(/(\d{1,2}):(\d{2})/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : Number.MAX_SAFE_INTEGER;
  };
  const foundNextIndex = decisions.findIndex((moment) => startMinutes(moment.time) >= nowMinutes - 20);
  const nextIndex = foundNextIndex < 0 ? Math.max(0, decisions.length - 1) : foundNextIndex;
  return (
    <SurfaceFrame>
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow={localDate} title="Ruimte in je dag." subtitle="Niet om alles te vullen. Alleen om kansen te zien." />
      {calendar.state === 'live' && <View style={styles.calendarWindows}><Text style={styles.liveEvidenceTitle}>VRIJE VENSTERS UIT AGENDA</Text>{calendar.freeWindows.slice(0, 3).map((window) => <View key={window.start} style={styles.calendarWindowRow}><Ionicons name="time-outline" size={13} color={colors.bone} /><Text style={styles.calendarWindowText}>{formatWindow(window)}</Text></View>)}</View>}
      <View style={styles.daySummary}><Text style={styles.daySummaryEyebrow}>{decisions.length} MOMENTEN DIE KUNNEN PASSEN</Text><Text style={styles.daySummaryBody}>Het eerstvolgende moment krijgt de meeste ruimte. Later vandaag blijft rustig op de achtergrond.</Text></View>
      <View style={styles.timeline}>
        {decisions.map((moment, index) => {
          const item = moment.result.experience;
          const directionReason = moment.result.reasons.find((reason) => reason.text.includes('richting'));
          const isLead = index === nextIndex;
          const isPast = startMinutes(moment.time) < nowMinutes - 20;
          return (
            <Pressable key={item.id} onPress={() => onOpen(item)} style={[styles.timelineRow, isPast && styles.timelineRowPast]}>
              <View style={styles.timelineContent}>
                <View style={styles.dayMomentHeader}><View style={[styles.dayMomentMark, { backgroundColor: item.accent }]} /><Text style={styles.timelineTime}>{isLead ? 'EERSTVOLGENDE · ' : ''}{moment.label} · {moment.time}</Text></View>
                <CoverImage uri={item.image} style={[styles.dayCardImage, isLead ? styles.dayCardImagePrimary : styles.dayCardImageSecondary]} imageStyle={styles.dayCardImageStyle}>
                  <ImageShade />
                  <View style={styles.dayCardCopy}>
                    <Text style={styles.dayCardTitle}>{item.title}</Text>
                    <Text style={styles.dayCardPromise}>{item.promise}</Text>
                    <View style={[styles.iconMetaRow, { marginTop: 12 }]}><Text style={styles.dayCardMeta}>{item.duration} min · {item.effort}</Text><Ionicons name="arrow-forward" size={13} color={colors.onImage} /></View>
                    {item.generation || item.liveEvidence?.length ? <Text style={[styles.directionMatch, styles.onImageAccentText]}>{item.generation ? 'Nieuw samengesteld' : 'Contextueel gekozen'} · {evidenceSummary(item).label}</Text> : directionReason && <Text style={[styles.directionMatch, styles.onImageAccentText]}>Past bij een richting die jij zelf benoemde</Text>}
                  </View>
                </CoverImage>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.quietDay}><Text style={styles.quietDayTitle}>Een volle dag is ook compleet.</Text><Text style={styles.quietDayBody}>Momentum voegt niets toe wanneer er geen echte ruimte is.</Text></View>
    </ScrollView>
    </SurfaceFrame>
  );
}
