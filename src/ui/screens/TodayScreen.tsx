import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  ImageStyle,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StackActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Experience } from '../../product/experienceModel';
import { EnergyLevel, energyLabels } from '../../product/localIntelligence';
import { composeTravelGuide } from '../../product/travelGuide';
import { palettes, schemeStyles, typography } from '../../design/theme';
import { impactLight, impactMedium } from '../../design/haptics';
import { useStaggeredEntrance } from '../../design/motion';
import { CoverImage } from '../CoverImage';
import { QuietCanvas } from '../QuietCanvas';
import { SurfaceFrame } from '../frames';
import {
  NIGHT_ITEM,
  dayStripChips,
  dayTimeline,
  discoveryCard,
} from '../now-v2/dayModel';
import { formatClock, formatLongDate, resolveSunTimes } from '../now-v2/nowModel';
import { defaultRegion, useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';

// Dag-scherm volgens concept v2 (ADR-067, fase R2 — herbouw van de vroegere
// redactionele tijdlijn uit ADR-058/060). Opbouw van boven naar onder:
// app-balk ("Je dag, Wido"), weerstrip met drie concrete chips, de verticale
// daglijn met rail en dots (verleden gedimd, vrije ruimte uit een live agenda
// gehonoreerd, NU gemarkeerd met fit-uitleg en go-actie naar de bestaande
// Prepare-flow, nacht rustig), de energie-check-in (ADR-060) als kaart op de
// nu-grens, en één ontdekkaart voor de komende dag uit de bestaande
// reisgids-compositie (eindig, gecureerd — nooit een feed).
//
// Concrete-copy doctrine: elke regel is een feit (tijd, duur, wind, meettijd)
// of een concrete handeling. Waar geen live bron is, rekent het scherm
// deterministisch uit zonverloop; waar geen agenda is, ontbreken de vrije
// vensters eerlijk in plaats van verzonnen.

const ENERGY_OPTIONS: EnergyLevel[] = ['low', 'steady', 'full'];

export function TodayScreen() {
  const {
    personalProfile,
    dayDecisions,
    calendarContext,
    calendarLoading,
    connectCalendar,
    liveWorld,
    selectionLocationConfirmed,
    candidatePool,
    openExperience,
    energyLevel,
    setEnergyCheckin,
  } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const firstName = personalProfile.firstName.trim();
  const [now, setNow] = useState(() => new Date());

  // Strip, daglijn-states en check-in klok lopen mee met de tijd (rustige tick).
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const weather = liveWorld?.weather;
  const sun = useMemo(
    () => resolveSunTimes(weather, liveWorld?.coordinates ?? defaultRegion.coordinates, now),
    // Zontijden veranderen per dag, niet per klok-tick — memo op datum + bron.
    [weather?.sunrise, weather?.sunset, liveWorld?.coordinates, now.toDateString()],
  );

  const chips = useMemo(() => dayStripChips(now, sun, weather), [now, sun, weather]);
  const items = useMemo(
    () => dayTimeline(now, sun, dayDecisions, calendarContext.state === 'live' ? calendarContext.freeWindows : [], personalProfile),
    [now, sun, dayDecisions, calendarContext, personalProfile],
  );
  const guide = useMemo(() => composeTravelGuide({
    candidatePool,
    liveWorld,
    locationLinked: selectionLocationConfirmed,
  }), [candidatePool, liveWorld, selectionLocationConfirmed]);
  const discovery = useMemo(() => discoveryCard(
    now,
    sun,
    guide,
    new Set(dayDecisions.map((moment) => moment.result.experience.id)),
  ), [now, sun, guide, dayDecisions]);

  const hasMoments = items.some((item) => item.kind === 'moment');
  const entrance = useStaggeredEntrance(4);

  const onOpen = (experience: Experience) => {
    openExperience(experience, 'today');
    navigation.navigate('Prepare');
  };
  const onCalendar = () => {
    impactLight();
    connectCalendar().catch(() => undefined);
  };

  return (
    <SurfaceFrame>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ——— App-balk ——— */}
        <Animated.View style={[s.appbar, entrance[0]]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Jij"
            onPress={() => { impactLight(); navigation.dispatch(StackActions.replace('Profile')); }}
            style={s.avatarPress}
          >
            <LinearGradient colors={['#2b6e4c', '#123826']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatar}>
              <Text style={s.avatarInitial}>{(firstName.slice(0, 1) || 'M').toUpperCase()}</Text>
            </LinearGradient>
          </Pressable>
          <View style={s.who}>
            <Text style={s.hi}>Je dag{firstName ? `, ${firstName}` : ''}</Text>
            <Text style={s.date}>{formatLongDate(now)} · één overzicht</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={calendarContext.state === 'live'
              ? `Agenda gekoppeld · ${calendarContext.detail}`
              : calendarContext.state === 'unavailable'
                ? 'Agenda werkt niet in de webpreview'
                : 'Koppel mijn agenda'}
            accessibilityState={{ busy: calendarLoading }}
            onPress={onCalendar}
            style={s.iconbtn}
          >
            <Feather name="calendar" size={16} color={s.ink2Solid as string} />
            {calendarContext.state === 'live' ? <View style={s.liveDot} /> : null}
          </Pressable>
        </Animated.View>

        {/* ——— Weerstrip ——— */}
        <Animated.View style={entrance[1]}>
          <View style={s.strip}>
            {chips.map((chip) => (
              <View key={`${chip.icon}-${chip.text}`} style={s.chip}>
                <Feather name={chip.icon} size={13} color={s.accent as string} />
                <Text style={s.chipText} numberOfLines={1}>{chip.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ——— Redactionele daglijn ——— */}
        <Animated.View style={entrance[2]}>
          {!hasMoments && (
            <QuietCanvas eyebrow="EEN OPEN DAG" title="Vandaag vraagt niets van je.">
              <Text style={s.quietBody}>Momentum vond geen passend moment voor vandaag. De weerstrip hierboven en de ontdekkaart hieronder blijven actueel.</Text>
            </QuietCanvas>
          )}
          <View style={s.timeline}>
            <LinearGradient pointerEvents="none" colors={s.railColors as [string, string, string]} locations={[0, 0.6, 1]} style={s.tlLine} />
            {items.map((item) => {
              if (item.kind === 'energy') {
                return (
                  <View key="energy" style={s.tlItem}>
                    <View style={[s.tlDot, energyLevel ? s.tlDotNow : null]} />
                    <View style={[s.tlCard, s.energyCard]}>
                      <Text style={s.tlWhen}>{`${formatClock(now)} · check-in`}</Text>
                      <Text style={s.tlWhat}>Hoe voel je je?</Text>
                      <Text style={s.energyBody}>Alleen ‘Laag’ stuurt de voorstellen zachtjes bij — dichterbij en rustiger. Sla gerust over.</Text>
                      <View style={s.seg}>
                        {ENERGY_OPTIONS.map((level) => {
                          const selected = energyLevel === level;
                          return (
                            <Pressable
                              key={level}
                              accessibilityRole="button"
                              accessibilityLabel={energyLabels[level]}
                              accessibilityState={{ selected }}
                              onPress={() => { impactLight(); setEnergyCheckin(selected ? null : level); }}
                              style={[s.segItem, selected && s.segItemSel]}
                            >
                              <Text style={[s.segText, selected && s.segTextSel]}>{energyLabels[level]}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                      {energyLevel ? <Text style={s.energyNote}>Alleen voor vandaag · tik opnieuw om te wissen · blijft op dit apparaat</Text> : null}
                    </View>
                  </View>
                );
              }
              if (item.kind === 'night') {
                return (
                  <View key="night" style={[s.tlItem, s.tlDone]}>
                    <View style={[s.tlDot, s.tlDotDone]} />
                    <View style={s.tlCard}>
                      <View style={s.tlCopy}>
                        <Text style={s.tlWhen}>{NIGHT_ITEM.when}</Text>
                        <Text style={s.tlWhat}>{NIGHT_ITEM.title}</Text>
                        <Text style={s.tlWhy}>{NIGHT_ITEM.sub}</Text>
                      </View>
                    </View>
                  </View>
                );
              }
              if (item.kind === 'free') {
                return (
                  <View key={item.id} style={[s.tlItem, item.state === 'past' && s.tlDone]}>
                    <View style={[s.tlDot, item.state === 'past' ? s.tlDotDone : null]} />
                    <View style={s.tlCard}>
                      <View style={s.tlCopy}>
                        <Text style={s.tlWhen}>{item.when}</Text>
                        <Text style={s.tlWhat}>{item.title}</Text>
                        <Text style={s.tlWhy}>{item.sub}</Text>
                      </View>
                    </View>
                  </View>
                );
              }
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.when} — ${item.title}. ${item.sub}`}
                  accessibilityState={{ disabled: item.state === 'past' }}
                  disabled={item.state === 'past'}
                  onPress={() => { impactLight(); onOpen(item.experience); }}
                  style={[s.tlItem, item.state === 'past' && s.tlDone]}
                >
                  <View style={[s.tlDot, item.state === 'past' ? s.tlDotDone : item.state === 'now' ? s.tlDotNow : null]} />
                  <View style={[s.tlCard, item.state === 'now' && s.tlCardNow]}>
                    <CoverImage uri={item.image} style={s.tlThumb} imageStyle={s.tlThumbRound} />
                    <View style={s.tlCopy}>
                      <View style={s.tlWhenRow}>
                        <Text style={s.tlWhen}>{item.when}</Text>
                        {item.state === 'now' ? <View style={s.nowTag}><Text style={s.nowTagText}>NU</Text></View> : null}
                      </View>
                      <Text style={s.tlWhat}>{item.title}</Text>
                      <Text style={s.tlWhy}>{item.sub}</Text>
                    </View>
                    {item.state === 'now' ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Ga: ${item.title}`}
                        onPress={() => { impactMedium(); onOpen(item.experience); }}
                        style={s.go}
                      >
                        <Feather name="arrow-right" size={15} color={s.accentInk as string} />
                      </Pressable>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* ——— Ontdekkaart ——— */}
        {discovery ? (
          <Animated.View style={entrance[3]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${discovery.kicker} — ${discovery.title}. ${discovery.detail}`}
              onPress={() => { impactLight(); onOpen(discovery.experience); }}
              style={({ pressed }) => [s.discover, pressed && s.pressed]}
            >
              <CoverImage uri={discovery.image} style={StyleSheet.absoluteFill} />
              <LinearGradient
                pointerEvents="none"
                colors={['rgba(8,10,14,0.85)', 'rgba(8,10,14,0.25)', 'rgba(8,10,14,0.05)']}
                locations={[0.2, 0.75, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={s.discoverIn}>
                <Text style={s.discoverKicker}>{discovery.kicker}</Text>
                <Text style={s.discoverTitle}>{discovery.title}</Text>
                <Text style={s.discoverDetail}>{discovery.detail}</Text>
              </View>
            </Pressable>
          </Animated.View>
        ) : null}
      </ScrollView>
    </SurfaceFrame>
  );
}

// Visuele taal (concept v2): hetzelfde donkere podium-palet als het Nu-scherm
// (ADR-067 §4) — near-black app, glaspanelen, accentgroen uit de #34c772-
// familie, serif display voor titels. De lichte sibling volgt de dagpalet-
// tokens (ADR-064); tekst/achtergrond-paren houden WCAG AA (zie R1). Gedimde
// items zijn bewust uitgedempte historie, geen primaire informatie.
const s = schemeStyles(({ colors }) => {
  const evening = colors === palettes.dark.colors;
  const palette = evening
    ? {
        app: '#0B0D13',
        ink: '#F5F4F0',
        ink2: 'rgba(245,244,240,0.62)',
        ink3: 'rgba(245,244,240,0.55)',
        accent: '#34C772',
        accentInk: '#06130C',
        glass: 'rgba(245,244,240,0.07)',
        glassPanel: 'rgba(16,19,26,0.72)',
        line: 'rgba(245,244,240,0.12)',
        tile: 'rgba(245,244,240,0.05)',
        segSelText: '#10131A',
        glow: 'rgba(52,199,114,0.5)',
        dotBase: 'rgba(245,244,240,0.25)',
        dotDone: 'rgba(245,244,240,0.15)',
        rail: ['rgba(245,244,240,0.08)', 'rgba(245,244,240,0.25)', '#34C772'],
      }
    : {
        app: colors.ink,
        ink: colors.bone,
        ink2: 'rgba(34,37,45,0.66)',
        ink3: 'rgba(34,37,45,0.68)',
        accent: colors.accent,
        accentInk: colors.onAccent,
        glass: 'rgba(34,37,45,0.05)',
        glassPanel: 'rgba(255,255,255,0.86)',
        line: 'rgba(34,37,45,0.12)',
        tile: 'rgba(34,37,45,0.045)',
        segSelText: '#FFFFFF',
        glow: 'rgba(32,128,73,0.35)',
        dotBase: 'rgba(34,37,45,0.25)',
        dotDone: 'rgba(34,37,45,0.15)',
        rail: ['rgba(34,37,45,0.08)', 'rgba(34,37,45,0.25)', colors.accent],
      };
  return {
    accent: palette.accent,
    accentInk: palette.accentInk,
    ink2Solid: palette.ink2,
    railColors: palette.rail,
    scroll: { paddingBottom: 132 } as ViewStyle,
    appbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 10 } as ViewStyle,
    avatarPress: { borderRadius: 18 } as ViewStyle,
    avatar: {
      width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: 'rgba(245,244,240,0.18)',
    } as ViewStyle,
    avatarInitial: { fontFamily: typography.displayFamilyMedium, fontSize: 16, color: '#E8F5EC' } as TextStyle,
    who: { flex: 1 } as ViewStyle,
    hi: { fontSize: 14.5, fontWeight: '600', color: palette.ink } as TextStyle,
    date: { fontSize: 11.5, color: palette.ink2, marginTop: 1 } as TextStyle,
    iconbtn: {
      width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
      backgroundColor: palette.glass, borderWidth: 1, borderColor: palette.line,
    } as ViewStyle,
    liveDot: {
      position: 'absolute', top: 9, right: 10, width: 7, height: 7, borderRadius: 3.5,
      backgroundColor: palette.accent,
    } as ViewStyle,
    strip: { flexDirection: 'row', gap: 8, marginHorizontal: 12, marginTop: 2, marginBottom: 12 } as ViewStyle,
    chip: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      backgroundColor: palette.glass, borderWidth: 1, borderColor: palette.line, borderRadius: 999,
      paddingVertical: 8, paddingHorizontal: 4,
    } as ViewStyle,
    chipText: { fontSize: 11, fontWeight: '600', color: palette.ink2 } as TextStyle,
    quietBody: { fontSize: 13, lineHeight: 20, color: palette.ink2, marginTop: 10 } as TextStyle,
    timeline: { marginHorizontal: 12, paddingLeft: 26 } as ViewStyle,
    tlLine: { position: 'absolute', left: 8, top: 8, bottom: 8, width: 1.5, borderRadius: 2 } as ViewStyle,
    tlItem: { position: 'relative', marginBottom: 12 } as ViewStyle,
    tlDone: { opacity: 0.45 } as ViewStyle,
    tlDot: {
      position: 'absolute', left: -23, top: 18, width: 11, height: 11, borderRadius: 5.5,
      backgroundColor: palette.app, borderWidth: 2, borderColor: palette.dotBase,
    } as ViewStyle,
    tlDotDone: { borderColor: palette.dotDone, backgroundColor: palette.dotDone } as ViewStyle,
    tlDotNow: {
      borderColor: palette.accent, backgroundColor: palette.accent,
      shadowColor: palette.accent, shadowOpacity: 0.9, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 4,
    } as ViewStyle,
    tlCard: {
      backgroundColor: palette.glass, borderWidth: 1, borderColor: palette.line, borderRadius: 22,
      paddingVertical: 13, paddingHorizontal: 14, flexDirection: 'row', gap: 12, alignItems: 'center',
    } as ViewStyle,
    tlCardNow: {
      backgroundColor: palette.glassPanel, borderColor: evening ? 'rgba(52,199,114,0.4)' : palette.accent,
      shadowColor: palette.glow, shadowOpacity: 0.35, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 6,
    } as ViewStyle,
    tlThumb: { width: 54, height: 68, borderRadius: 16 } as ViewStyle,
    tlThumbRound: { borderRadius: 16 } as ImageStyle,
    tlCopy: { flex: 1, minWidth: 0 } as ViewStyle,
    tlWhenRow: { flexDirection: 'row', alignItems: 'center', gap: 6 } as ViewStyle,
    tlWhen: { fontSize: 10, letterSpacing: 1.6, fontWeight: '700', color: palette.ink3, textTransform: 'uppercase' } as TextStyle,
    nowTag: { backgroundColor: palette.accent, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2.5 } as ViewStyle,
    nowTagText: { fontSize: 8.5, letterSpacing: 1.2, fontWeight: '700', color: '#FFFFFF' } as TextStyle,
    tlWhat: { fontFamily: typography.displayFamilyMedium, fontWeight: '400', fontSize: 16.5, lineHeight: 21, color: palette.ink, marginTop: 3 } as TextStyle,
    tlWhy: { fontSize: 11, color: palette.ink2, marginTop: 3 } as TextStyle,
    go: {
      width: 34, height: 34, borderRadius: 17, backgroundColor: palette.accent,
      alignItems: 'center', justifyContent: 'center',
    } as ViewStyle,
    energyCard: { flexDirection: 'column', alignItems: 'stretch', gap: 0 } as ViewStyle,
    energyBody: { fontSize: 11.5, lineHeight: 17, color: palette.ink2, marginTop: 4 } as TextStyle,
    seg: {
      marginTop: 10, flexDirection: 'row', backgroundColor: palette.tile, borderWidth: 1, borderColor: palette.line,
      borderRadius: 999, padding: 4, gap: 4,
    } as ViewStyle,
    segItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 999 } as ViewStyle,
    segItemSel: { backgroundColor: palette.ink } as ViewStyle,
    segText: { fontSize: 12.5, fontWeight: '600', color: palette.ink2 } as TextStyle,
    segTextSel: { color: palette.segSelText } as TextStyle,
    energyNote: { fontSize: 10.5, color: palette.ink3, marginTop: 9 } as TextStyle,
    discover: {
      marginHorizontal: 12, marginTop: 4, borderRadius: 24, overflow: 'hidden', height: 108,
      shadowColor: '#000000', shadowOpacity: 0.45, shadowRadius: 30, shadowOffset: { width: 0, height: 16 }, elevation: 7,
    } as ViewStyle,
    discoverIn: { paddingHorizontal: 18, paddingVertical: 16, maxWidth: '75%' } as ViewStyle,
    discoverKicker: { fontSize: 9.5, letterSpacing: 2, fontWeight: '700', color: palette.accent, textTransform: 'uppercase' } as TextStyle,
    discoverTitle: { fontFamily: typography.displayFamilyMedium, fontWeight: '400', fontSize: 17.5, lineHeight: 22, color: '#F5F4F0', marginTop: 4 } as TextStyle,
    discoverDetail: { fontSize: 11, color: 'rgba(245,244,240,0.62)', marginTop: 4 } as TextStyle,
    pressed: { opacity: 0.92 } as ViewStyle,
  };
});
