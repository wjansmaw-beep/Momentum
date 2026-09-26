import React, { useEffect, useState } from 'react';
import {
  Animated,
  ImageStyle,
  Linking,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { CommonActions, StackActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Experience } from '../../product/experienceModel';
import { Company } from '../../product/localIntelligence';
import { palettes, schemeStyles, typography } from '../../design/theme';
import { impactLight, impactMedium } from '../../design/haptics';
import { useKenBurns, useStaggeredEntrance } from '../../design/motion';
import { CoverImage } from '../CoverImage';
import { SurfaceFrame } from '../frames';
import { nowInvitation } from '../now-v2/nowInvitation';
import {
  formatLongDate,
  freshCard,
  freshExcludingSuggestions,
  greetingForHour,
} from '../now-v2/nowModel';
import { useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';

// ADR-070 preserves ADR-067's crafted materials and finite alternatives,
// but leads with the experience instead of a score or invented departure.
// nowInvitation keeps unconfirmed place/weather out of the presentation.

const COMPANY_OPTIONS: Array<{ id: Company; label: string }> = [
  { id: 'solo', label: 'Alleen' },
  { id: 'together', label: 'Samen' },
  { id: 'family', label: 'Gezin' },
];

export function NowScreen() {
  const {
    personalProfile,
    nowSuggestions,
    contextualPrepared,
    prototypeContext,
    setPrototypeContext,
    liveWorld,
    selectionLocationConfirmed,
    pendingContextual,
    showPendingContextual,
    openExperience,
    applyFeedback,
    activeSession,
    resumableExperience,
    resumeSession,
  } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const firstName = personalProfile.firstName.trim();
  const [leadIndex, setLeadIndex] = useState(0);
  const [now, setNow] = useState(() => new Date());

  // Only greeting/date and source expiry follow the clock; no network polling.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Bij een nieuwe suggestieset (andere context, ander gezelschap, correctie)
  // begint de lead weer vooraan.
  const suggestionIds = nowSuggestions.map((item) => item.experience.id).join('|');
  useEffect(() => { setLeadIndex(0); }, [suggestionIds]);

  const lead = nowSuggestions[Math.min(leadIndex, nowSuggestions.length - 1)] ?? nowSuggestions[0];
  const experience: Experience = lead.experience;
  const invitation = nowInvitation(experience, personalProfile.preferredKinds, selectionLocationConfirmed, liveWorld, now);
  const facts: Array<{ icon: 'clock' | 'activity'; text: string }> = [
    { icon: 'clock', text: `ca. ${experience.duration} min` },
    { icon: 'activity', text: experience.effort.toLowerCase() },
  ];
  const saved = personalProfile.favoriteExperienceIds.includes(experience.id);
  const others = nowSuggestions.filter((_, index) => index !== leadIndex).slice(0, 4);
  const thumbs = others.slice(0, 3);
  const hiddenCount = others.length - thumbs.length;
  // Vers samengestelde voorstellen (contextuele generator-set van dit dagdeel):
  // zichtbaar als eigen rustige sectie, minus wat de carrousel al toont.
  const freshExperiences = freshExcludingSuggestions(contextualPrepared, nowSuggestions.map((item) => item.experience));
  const freshCards = freshExperiences.map((item) => ({ experience: item, model: freshCard(item) }));

  // Entree volgens ADR-057: de lagen verschijnen verspringend (stil bij
  // reduced-motion); Ken Burns op de hero blijft sub-perceptueel (≤4%, ≥8s).
  const entrance = useStaggeredEntrance(6);
  const kenBurns = useKenBurns();

  const onStart = () => {
    impactMedium();
    openExperience(experience, 'now');
    navigation.navigate('Prepare');
  };
  const onSave = () => {
    if (saved) return;
    impactLight();
    applyFeedback(experience, 'repeat');
  };
  const onNotForMe = () => {
    impactLight();
    applyFeedback(experience, 'not-for-me');
  };
  const onBell = () => {
    if (!pendingContextual?.length) return;
    impactLight();
    showPendingContextual();
  };
  const onGuide = () => {
    impactLight();
    // Zelfde logica als de GIDS-tab: hervat waar je was (onderweg → Gids,
    // anders → Voorpret). Reset ipv replace zodat er geen stale routes
    // onder de stack blijven hangen.
    const stage = resumeSession();
    const target = stage === 'presence' ? 'Guide' : 'Prepare';
    navigation.dispatch(
      CommonActions.reset({ index: 1, routes: [{ name: 'Now' }, { name: target }] }),
    );
  };
  const onOpenFresh = (item: Experience) => {
    impactLight();
    openExperience(item, 'now');
    navigation.navigate('Prepare');
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
            <Text style={s.hi}>{greetingForHour(now.getHours())}{firstName ? `, ${firstName}` : ''}</Text>
            <Text style={s.date}>{formatLongDate(now)} · {invitation.region}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={pendingContextual?.length ? `${pendingContextual.length} nieuwe blikken liggen klaar` : 'Geen nieuwe blikken'}
            onPress={onBell}
            style={s.iconbtn}
          >
            <Feather name="bell" size={17} color={s.ink2Solid as string} />
            {pendingContextual?.length ? <View style={s.bellDot} /> : null}
          </Pressable>
        </Animated.View>

        {/* ——— Hero ——— */}
        <Animated.View style={entrance[1]}>
          <View style={s.hero}>
            <CoverImage uri={experience.image} style={StyleSheet.absoluteFill} imageContainerStyle={kenBurns as StyleProp<ViewStyle>} />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(8,10,14,0.42)', 'rgba(8,10,14,0)', 'rgba(8,10,14,0.10)', 'rgba(8,10,14,0.82)']}
              locations={[0, 0.3, 0.55, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={s.heroTop}>
              <View style={s.livePill}>
                <View style={s.liveStill} />
                <Text style={s.liveText}>{invitation.badge}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={saved ? 'Bewaard als de moeite waard' : 'Bewaar dit moment'}
                accessibilityState={{ selected: saved }}
                onPress={onSave}
                style={s.saveBtn}
              >
                <Feather name="bookmark" size={15} color={saved ? (s.accent as string) : '#F5F4F0'} />
              </Pressable>
            </View>
            <View style={s.onphoto}>
              <View style={s.placeRow}>
                <Feather name="map-pin" size={12} color="rgba(245,244,240,0.85)" />
                <Text style={s.place}>{invitation.place}</Text>
              </View>
              <Text style={s.heroTitle}>{experience.title}</Text>
              <View style={s.metaRow}>
                {facts.map((fact) => (
                  <View key={`${fact.icon}-${fact.text}`} style={s.metaItem}>
                    <Feather name={fact.icon} size={13} color="rgba(245,244,240,0.8)" />
                    <Text style={s.metaText}>{fact.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ——— Glaspaneel "Waarom nu" ——— */}
        <Animated.View style={entrance[2]}>
          <View style={s.panelWrap}>
            <BlurView intensity={22} tint={s.blurTint} style={[s.panelBlur, { backgroundColor: s.glassPanel as string }]}>
              <View style={s.whyhead}>
                <View style={s.whyCopy}>
                  <Text style={s.seclbl}>Dit kun je beleven</Text>
                  <Text style={s.headline}>{invitation.promise}</Text>
                </View>
              </View>

              <View style={s.reasons}>
                {invitation.tiles.map((tile) => (
                  <View key={`${tile.icon}-${tile.title}`} style={s.reason}>
                    <Feather name={tile.icon} size={15} color={s.accent as string} />
                    <Text style={s.reasonTitle}>{tile.title}</Text>
                    <Text style={s.reasonSub}>{tile.sub}</Text>
                  </View>
                ))}
              </View>

              {invitation.weather && <View style={s.light}>
                <Text style={s.lightTitle}>Buitencontext · geen garantie voor je hele ervaring</Text>
                <Text style={s.reasonTitle}>{invitation.weather.text}</Text>
                <Pressable accessibilityRole="link" accessibilityLabel="Bekijk de weerbron Open-Meteo" onPress={() => Linking.openURL('https://open-meteo.com/').catch(() => undefined)}>
                  <Text style={s.reasonSub}>{invitation.weather.source} · Bekijk bron</Text>
                </Pressable>
              </View>}
              {invitation.contextNote && <Text style={[s.reasonSub, { marginTop: 12 }]}>{invitation.contextNote}</Text>}

              <View style={s.whoSeg}>
                <Text style={s.seclbl}>Met wie</Text>
                <View style={s.seg}>
                  {COMPANY_OPTIONS.map((option) => {
                    const selected = prototypeContext.company === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        accessibilityRole="button"
                        accessibilityLabel={option.label}
                        accessibilityState={{ selected }}
                        onPress={() => { impactLight(); if (!selected) setPrototypeContext({ ...prototypeContext, company: option.id }); }}
                        style={[s.segItem, selected && s.segItemSel]}
                      >
                        <Text style={[s.segText, selected && s.segTextSel]}>{option.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </BlurView>
          </View>
        </Animated.View>

        {/* ——— CTA-rij ——— */}
        <Animated.View style={entrance[3]}>
          <View style={s.ctarow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={invitation.cta}
              onPress={onStart}
              style={({ pressed }) => [s.cta, pressed && s.pressed]}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.ctaTitle}>{invitation.cta}</Text>
                <Text style={s.ctaSub}>Jij kiest wanneer je begint</Text>
              </View>
              <Feather name="arrow-right" size={18} color={s.accentInk as string} />
            </Pressable>
            {activeSession && resumableExperience ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Open de gids" onPress={onGuide} style={({ pressed }) => [s.guidebtn, pressed && s.pressed]}>
                <Feather name="compass" size={17} color={s.inkSolid as string} />
                <Text style={s.guidebtnText}>GIDS</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>

        {/* ——— Ook mooi ——— */}
        {others.length ? (
          <Animated.View style={entrance[4]}>
            <View style={s.alts}>
              <Text style={s.altsTitle}>Liever iets anders</Text>
              <View style={s.thumbs}>
                {thumbs.map((item, thumbIndex) => {
                  const originalIndex = nowSuggestions.indexOf(item);
                  return (
                    <Pressable
                      key={item.experience.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Toon ${item.experience.title}`}
                      onPress={() => { impactLight(); setLeadIndex(originalIndex); }}
                      style={[s.thumbPress, thumbIndex === 0 && s.thumbFirst]}
                    >
                      <CoverImage uri={item.experience.image} style={s.thumb} imageStyle={s.thumbRound} />
                    </Pressable>
                  );
                })}
              </View>
              {hiddenCount > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Nog ${hiddenCount} meer`}
                  onPress={() => { impactLight(); setLeadIndex((leadIndex + 1) % nowSuggestions.length); }}
                  style={s.altsMore}
                >
                  <Text style={s.altsMoreText}>{hiddenCount} meer</Text>
                  <Feather name="chevron-right" size={12} color={s.ink2Solid as string} />
                </Pressable>
              ) : null}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Dit past niet bij mij" onPress={onNotForMe} style={s.correction}>
              <Text style={s.correctionText}>Past niet bij mij</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Pressable accessibilityRole="button" accessibilityLabel="Dit past niet bij mij" onPress={onNotForMe} style={s.correction}>
            <Text style={s.correctionText}>Past niet bij mij</Text>
          </Pressable>
        )}

        {/* ——— Vers voor jou samengesteld (contextuele generator, ADR-056/059) ——— */}
        {freshCards.length ? (
          <Animated.View style={entrance[5]}>
            <View style={s.fresh}>
              <Text style={s.seclbl}>Vers voor jou samengesteld</Text>
              {freshCards.map(({ experience: item, model }) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${model.eyebrow}: ${item.title}. ${model.facts}`}
                  onPress={() => onOpenFresh(item)}
                  style={({ pressed }) => [s.freshCard, pressed && s.pressed]}
                >
                  <CoverImage uri={item.image} style={s.freshThumb} imageStyle={s.freshThumbRound} />
                  <View style={s.freshCopy}>
                    <Text style={s.freshEyebrow}>{model.eyebrow}</Text>
                    <Text numberOfLines={2} style={s.freshTitle}>{item.title}</Text>
                    <Text numberOfLines={1} style={s.freshMeta}>{model.facts}</Text>
                  </View>
                  <Feather name="arrow-right" size={15} color={s.ink2Solid as string} />
                </Pressable>
              ))}
              <Text style={s.freshDisclosure}>{freshCards[0].model.disclosure}</Text>
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
    </SurfaceFrame>
  );
}

// Visuele taal (concept v2): donker podium als primaire toon — near-black app,
// glaspanelen, accentgroen uit de #34c772-familie, serif display voor titels.
// De lichte sibling volgt de bestaande dagpalet-tokens (ADR-064); alle
// tekst/achtergrond-paren houden WCAG AA (zie faseverslag R1). Detectie van
// het schema gebeurt via palet-identiteit, zoals schemeStyles het aanlevert.
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
        track: 'rgba(245,244,240,0.12)',
        segSelText: '#10131A',
        glow: 'rgba(52,199,114,0.5)',
        curveFill: 'rgba(52,199,114,0.14)',
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
        track: 'rgba(34,37,45,0.14)',
        segSelText: '#FFFFFF',
        glow: 'rgba(32,128,73,0.35)',
        curveFill: 'rgba(32,128,73,0.10)',
      };
  type NowStyles = {
    blurTint: 'dark' | 'light';
    accent: string;
    accentInk: string;
    inkSolid: string;
    ink2Solid: string;
    glassPanel: string;
    ringTrack: string;
    curveFill: string;
    scroll: ViewStyle;
    appbar: ViewStyle;
    avatarPress: ViewStyle;
    avatar: ViewStyle;
    avatarInitial: TextStyle;
    who: ViewStyle;
    hi: TextStyle;
    date: TextStyle;
    iconbtn: ViewStyle;
    bellDot: ViewStyle;
    hero: ViewStyle;
    heroTop: ViewStyle;
    livePill: ViewStyle;
    liveStill: ViewStyle;
    liveText: TextStyle;
    saveBtn: ViewStyle;
    onphoto: ViewStyle;
    placeRow: ViewStyle;
    place: TextStyle;
    heroTitle: TextStyle;
    metaRow: ViewStyle;
    metaItem: ViewStyle;
    metaText: TextStyle;
    panelWrap: ViewStyle;
    panelBlur: ViewStyle;
    whyhead: ViewStyle;
    whyCopy: ViewStyle;
    seclbl: TextStyle;
    headline: TextStyle;
    headlineAccent: TextStyle;
    ringValue: TextStyle;
    ringLabel: TextStyle;
    reasons: ViewStyle;
    reason: ViewStyle;
    reasonTitle: TextStyle;
    reasonSub: TextStyle;
    light: ViewStyle;
    lightHead: ViewStyle;
    lightTitle: TextStyle;
    lightNow: TextStyle;
    hours: ViewStyle;
    hour: TextStyle;
    whoSeg: ViewStyle;
    seg: ViewStyle;
    segItem: ViewStyle;
    segItemSel: ViewStyle;
    segText: TextStyle;
    segTextSel: TextStyle;
    ctarow: ViewStyle;
    cta: ViewStyle;
    ctaTitle: TextStyle;
    ctaSub: TextStyle;
    guidebtn: ViewStyle;
    guidebtnText: TextStyle;
    alts: ViewStyle;
    altsTitle: TextStyle;
    thumbs: ViewStyle;
    thumbPress: ViewStyle;
    thumbFirst: ViewStyle;
    thumb: ViewStyle;
    thumbRound: ImageStyle;
    altsMore: ViewStyle;
    altsMoreText: TextStyle;
    correction: ViewStyle;
    correctionText: TextStyle;
    fresh: ViewStyle;
    freshCard: ViewStyle;
    freshThumb: ViewStyle;
    freshThumbRound: ImageStyle;
    freshCopy: ViewStyle;
    freshEyebrow: TextStyle;
    freshTitle: TextStyle;
    freshMeta: TextStyle;
    freshDisclosure: TextStyle;
    pressed: ViewStyle;
  };
  const stylesDef: NowStyles = {
    blurTint: evening ? 'dark' : 'light',
    accent: palette.accent,
    accentInk: palette.accentInk,
    inkSolid: palette.ink,
    ink2Solid: palette.ink2,
    glassPanel: palette.glassPanel,
    ringTrack: palette.track,
    curveFill: palette.curveFill,
    scroll: { paddingBottom: 132 },
    appbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 10 },
    avatarPress: { borderRadius: 18 },
    avatar: {
      width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: 'rgba(245,244,240,0.18)',
    },
    avatarInitial: { fontFamily: typography.displayFamilyMedium, fontSize: 16, color: '#E8F5EC' },
    who: { flex: 1 },
    hi: { fontSize: 14.5, fontWeight: '600', color: palette.ink },
    date: { fontSize: 11.5, color: palette.ink2, marginTop: 1 },
    iconbtn: {
      width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
      backgroundColor: palette.glass, borderWidth: 1, borderColor: palette.line,
    },
    bellDot: {
      position: 'absolute', top: 9, right: 10, width: 7, height: 7, borderRadius: 3.5,
      backgroundColor: palette.accent, shadowColor: palette.accent, shadowOpacity: 0.9, shadowRadius: 5, shadowOffset: { width: 0, height: 0 },
    },
    hero: {
      height: 296, marginHorizontal: 12, borderRadius: 30, overflow: 'hidden',
      shadowColor: '#000000', shadowOpacity: 0.45, shadowRadius: 34, shadowOffset: { width: 0, height: 18 }, elevation: 8,
    },
    heroTop: { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    livePill: {
      flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999,
      backgroundColor: 'rgba(10,12,18,0.42)', borderWidth: 1, borderColor: 'rgba(245,244,240,0.22)',
    },
    liveStill: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(245,244,240,0.5)' },
    liveText: { fontSize: 10, letterSpacing: 1.4, fontWeight: '700', color: '#F5F4F0' },
    saveBtn: {
      width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(10,12,18,0.42)', borderWidth: 1, borderColor: 'rgba(245,244,240,0.22)',
    },
    onphoto: { position: 'absolute', left: 18, right: 18, bottom: 16 },
    placeRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    place: { fontSize: 10.5, letterSpacing: 2.1, fontWeight: '600', color: 'rgba(245,244,240,0.85)', textTransform: 'uppercase', flexShrink: 1 },
    heroTitle: {
      fontFamily: typography.displayFamilyMedium, fontWeight: '400', fontSize: 33, lineHeight: 36,
      letterSpacing: -0.3, color: '#F5F4F0', marginTop: 9,
    },
    metaRow: { marginTop: 11, flexDirection: 'row', gap: 14 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 12.5, color: 'rgba(245,244,240,0.88)', fontWeight: '500' },
    panelWrap: {
      marginTop: -14, marginHorizontal: 12, borderRadius: 26, overflow: 'hidden',
      borderWidth: 1, borderColor: palette.line,
      shadowColor: '#000000', shadowOpacity: 0.4, shadowRadius: 28, shadowOffset: { width: 0, height: 14 }, elevation: 6,
    },
    panelBlur: { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 14 },
    whyhead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    whyCopy: { flex: 1, gap: 3 },
    seclbl: { fontSize: 10.5, letterSpacing: 2.1, fontWeight: '700', color: palette.ink2, textTransform: 'uppercase' },
    headline: { fontSize: 13, lineHeight: 19, color: palette.ink, fontWeight: '500' },
    headlineAccent: { color: palette.accent, fontWeight: '700' },
    ringValue: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3, color: palette.ink },
    ringLabel: { fontSize: 7.5, letterSpacing: 0.9, color: palette.ink3, textTransform: 'uppercase', fontWeight: '600', marginTop: 1 },
    reasons: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    reason: {
      flexGrow: 1, flexBasis: 110, backgroundColor: palette.tile, borderWidth: 1, borderColor: palette.line, borderRadius: 16,
      paddingHorizontal: 9, paddingTop: 9, paddingBottom: 8, gap: 5, minHeight: 86,
    },
    reasonTitle: { fontSize: 12, fontWeight: '600', letterSpacing: -0.1, color: palette.ink },
    reasonSub: { fontSize: 9.5, lineHeight: 13, color: palette.ink2 },
    light: {
      marginTop: 12, backgroundColor: palette.tile, borderWidth: 1, borderColor: palette.line,
      borderRadius: 16, paddingHorizontal: 14, paddingTop: 11, paddingBottom: 8,
    },
    lightHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    lightTitle: { fontSize: 11, fontWeight: '600', color: palette.ink2, letterSpacing: 0.4 },
    lightNow: { fontSize: 11, fontWeight: '700', color: palette.accent },
    hours: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
    hour: { fontSize: 9, color: palette.ink3, fontWeight: '500' },
    whoSeg: { marginTop: 13, gap: 8 },
    seg: {
      flexDirection: 'row', backgroundColor: palette.tile, borderWidth: 1, borderColor: palette.line,
      borderRadius: 999, padding: 4, gap: 4,
    },
    segItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 999 },
    segItemSel: { backgroundColor: palette.ink },
    segText: { fontSize: 12.5, fontWeight: '600', color: palette.ink2 },
    segTextSel: { color: palette.segSelText },
    ctarow: { flexDirection: 'row', gap: 10, marginHorizontal: 12, marginTop: 12, alignItems: 'stretch' },
    cta: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: palette.accent, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 20,
      shadowColor: palette.glow, shadowOpacity: 0.9, shadowRadius: 26, shadowOffset: { width: 0, height: 10 }, elevation: 10,
    },
    ctaTitle: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.1, color: palette.accentInk },
    ctaSub: { fontSize: 10.5, fontWeight: '600', color: palette.accentInk, opacity: 0.7, marginTop: 1 },
    guidebtn: {
      width: 56, borderRadius: 999, backgroundColor: palette.glass, borderWidth: 1, borderColor: palette.line,
      alignItems: 'center', justifyContent: 'center', gap: 2,
    },
    guidebtnText: { fontSize: 8.5, fontWeight: '600', color: palette.ink2, letterSpacing: 0.5 },
    alts: { marginTop: 12, marginHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 10 },
    altsTitle: { fontSize: 11, color: palette.ink3, fontWeight: '500' },
    thumbs: { flexDirection: 'row' },
    thumbPress: { marginLeft: -8 },
    thumbFirst: { marginLeft: 0 },
    thumb: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: palette.app },
    thumbRound: { borderRadius: 13 },
    altsMore: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 3 },
    altsMoreText: { fontSize: 11, color: palette.ink2, fontWeight: '600' },
    correction: { alignSelf: 'center', marginTop: 14, paddingVertical: 6, paddingHorizontal: 12 },
    correctionText: { fontSize: 11, color: palette.ink3, fontWeight: '500' },
    fresh: { marginTop: 22, marginHorizontal: 12, gap: 8 },
    freshCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: palette.glassPanel, borderWidth: 1, borderColor: palette.line, borderRadius: 22,
      padding: 10, paddingRight: 14,
    },
    freshThumb: { width: 74, height: 74 },
    freshThumbRound: { borderRadius: 15 },
    freshCopy: { flex: 1, gap: 2 },
    freshEyebrow: { fontSize: 9, letterSpacing: 1.6, fontWeight: '700', color: palette.accent, textTransform: 'uppercase' },
    freshTitle: {
      fontFamily: typography.displayFamilyMedium, fontWeight: '400', fontSize: 17, lineHeight: 21,
      letterSpacing: -0.2, color: palette.ink,
    },
    freshMeta: { fontSize: 10.5, color: palette.ink2, fontWeight: '500', marginTop: 1 },
    freshDisclosure: { fontSize: 9.5, lineHeight: 13.5, color: palette.ink3, marginTop: 4, marginHorizontal: 4 },
    pressed: { opacity: 0.92 },
  };
  return stylesDef;
});
