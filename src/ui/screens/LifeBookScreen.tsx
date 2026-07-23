import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { byId, Experience, experiences } from '../../product/experienceModel';
import { colors } from '../../design/theme';
import { CoverImage, ImageShade } from '../CoverImage';
import { QuietCanvas } from '../QuietCanvas';
import { ScreenHeader } from '../primitives';
import { SurfaceFrame } from '../frames';
import { styles } from '../styles/appStyles';
import { dutchMonthNames, useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';

// Leefboek-scherm (ADR-058): verhuisd uit App.tsx. Heropenen van een herinnering
// telt als 'repeat'-leersignaal en pusht 'Prepare' (voorheen setFlowStage);
// de profielknop pusht 'Profile'.

export function LifeBookScreen() {
  const { memories, personalProfile, applyFeedback, openExperience } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const personal = personalProfile;
  const onOpen = (item: Experience) => {
    applyFeedback(item, 'repeat');
    openExperience(item, 'lifebook');
    navigation.navigate('Prepare');
  };
  const onProfile = () => navigation.navigate('Profile');
  const themes = Array.from(new Set(memories.flatMap((memory) => memory.meaning ? [memory.meaning] : []).filter(Boolean))).slice(0, 3);
  const memoryMonths = Array.from(new Set(memories.map((memory) => dutchMonthNames.find((month) => memory.date.toLowerCase().includes(month))).filter((month): month is string => Boolean(month))));
  const periodLabel = memoryMonths.length === 1 ? memoryMonths[0].toUpperCase() : 'BEWAARDE MOMENTEN';
  const learningSignal = personal.reflectionMemories[0]?.explanation ?? personal.learningEvents[0]?.explanation;
  return (
    <SurfaceFrame>
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow="JOUW ERVARINGEN" title="Leefboek" subtitle="Niet wat je volhield, maar wat de moeite waard was." />
      <View style={styles.lifeLandscape}><View><Text style={styles.lifeSummaryEyebrow}>JOUW LANDSCHAP</Text><Text style={styles.lifeSummaryHeadline}>{memories.length ? 'Hier krijgt je leven langzaam vorm.' : 'Hier komen je beleefde momenten samen.'}</Text></View><Text style={styles.lifeSummaryTitle}>{memories.length} bewaarde momenten · alleen op dit apparaat</Text>{themes.length > 0 && <View style={styles.lifeThemeRow}>{themes.map((theme) => <View key={theme} style={styles.lifeTheme}><Text style={styles.lifeThemeText}>{theme}</Text></View>)}</View>}</View>
      {memories.length > 0 && <Text style={styles.sectionLabel}>{periodLabel}</Text>}
      {memories.length === 0 && <QuietCanvas eyebrow="NOG GEEN BEWAARDE MOMENTEN" title="Hier komen je beleefde momenten samen.">
        <Text style={styles.screenSubtitle}>Bewaar straks wat de moeite waard was. Je herinneringen blijven alleen op dit apparaat.</Text>
      </QuietCanvas>}
      <View style={styles.memoryGrid}>
        {memories.map((memory, index) => {
          const experience = memory.experienceSnapshot ?? experiences.find((item) => item.title === memory.title) ?? byId('wadden-light');
          return <Pressable key={memory.id} onPress={() => onOpen(experience)} style={[styles.memoryCard, index > 0 && styles.memoryCardCompact]}><CoverImage uri={memory.image} style={[styles.memoryImage, index > 0 && styles.memoryImageCompact]} imageStyle={styles.memoryImageStyle}><ImageShade /><View style={styles.memoryCopy}><Text style={[styles.memoryDate, styles.onImageAccentText]}>{memory.date}</Text><Text style={[styles.memoryTitle, index > 0 && styles.memoryTitleCompact, styles.onImageText]}>{memory.title}</Text><Text style={[styles.memoryNote, styles.onImageMutedText]}>{memory.note}</Text>{memory.meaning ? <Text style={[styles.memoryMeaning, styles.onImageAccentText]}>Raakte aan: {memory.meaning}</Text> : null}{memory.sharedWith?.length ? <Text style={[styles.memoryShared, styles.onImageAccentText]}>Samen met {memory.sharedWith.join(', ')}</Text> : null}</View></CoverImage></Pressable>;
        })}
      </View>
      {learningSignal ? <View style={styles.learningCard}><Text style={styles.learningTitle}>Een voorzichtig patroon</Text><Text style={styles.learningBody}>{learningSignal} Jij houdt de regie over wat Momentum hiervan onthoudt.</Text><Pressable onPress={onProfile} style={styles.learningAction}><View style={styles.iconMetaRow}><Text style={styles.learningActionText}>Bekijk of corrigeer dit</Text><Ionicons name="arrow-forward" size={13} color={colors.accent} /></View></Pressable></View> : null}
    </ScrollView>
    </SurfaceFrame>
  );
}
