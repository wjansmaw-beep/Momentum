import { ed, OpenExperience, ResumeExperience, SaveExperience } from '../editorial';
import { ImageCredit } from '../ImageCredit';
import React, { useState } from 'react';
import { ImageStyle, Pressable, ScrollView, Share, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { byId, experiences } from '../../product/experienceModel';
import { palettes, schemeStyles, typography } from '../../design/theme';
import { CoverImage, ImageShade } from '../CoverImage';
import { QuietCanvas } from '../QuietCanvas';
import { SurfaceFrame } from '../frames';
import { pickMemoryPhotos } from '../memoryPhotos';
import { styles } from '../styles/appStyles';
import { useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';
import { memoryFacts, memoryObservation, memoryStats, monthStrip } from '../now-v2/bookModel';

// Boek-scherm volgens concept v2 (ADR-067, fase R5a — herbouw van het
// Leefboek uit ADR-058/061). Albumpagina per moment: foto met like-hart,
// titel, feitenrij uit echte velden, "Momentum merkt" met een telling over
// echte herinneringen en reflecties (nooit een verzonnen cijfer of datum),
// statistiekentrio van echte getallen, strook met bewaarde momenten en een
// deel-ghost. De fotostrip en het toevoegen van foto's (ADR-061) blijven;
// heropenen van een moment blijft het 'repeat'-signaal naar Prepare.
// Lege staat: eerlijk en uitnodigend, zonder druk.

export function LifeBookScreen() {
  const { memories, personalProfile, applyFeedback, openExperience, addMemoryPhotos } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [featuredId, setFeaturedId] = useState<string | undefined>(memories[0]?.id);
  const featured = memories.find((memory) => memory.id === featuredId) ?? memories[0];
  const experience = featured ? featured.experienceSnapshot ?? experiences.find((item) => item.title === featured.title) : undefined;
  const addPhotosTo = async (memoryId: string) => {
    const picked = await pickMemoryPhotos(4);
    if (picked.length) addMemoryPhotos(memoryId, picked);
  };
  const shareMemory = async () => {
    if (!featured) return;
    const message = `${featured.title}\n${featured.note}\n${memoryFacts(featured, experience).join(' · ')}`;
    await Share.share({ title: featured.title, message }).catch(() => undefined);
  };
  const facts = featured ? memoryFacts(featured, experience) : [];
  const stats = featured ? memoryStats(featured, memories, personalProfile.reflectionMemories) : [];
  const observation = featured ? memoryObservation(featured, memories, personalProfile.reflectionMemories, personalProfile) : undefined;
  const strip = monthStrip(memories);
  const saved = experience ? personalProfile.favoriteExperienceIds.includes(experience.id) : false;
  const onToggleSave = () => {
    if (saved || !experience) return;
    applyFeedback(experience, 'repeat');
  };
  return (
    <SurfaceFrame>
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <View style={bk.head}><Text accessibilityRole="header" style={ed.title}>Boek</Text></View>
      <View style={{ paddingHorizontal: 20 }}><ResumeExperience /></View>
      {memories.length === 0 || !featured ? (
        <>
          <View style={{ padding: 22, gap: 16 }}><Text style={ed.heading}>Hier komen je beleefde momenten samen.</Text><Text style={ed.body}>Je herinneringen blijven alleen op dit apparaat.</Text></View>
        </>
      ) : (
        <>
          {/* Albumpagina: foto met like-hart (echt favoriet-signaal), titel en
              een feitenrij die alleen bestaande velden gebruikt. */}
          <View style={bk.photoWrap}>
            <CoverImage uri={featured.image} style={bk.photo} imageStyle={bk.photoImage}>
              <ImageShade />
            </CoverImage><ImageCredit uri={featured.image} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={saved ? 'Voorkeur: vaker voorstellen' : 'Stel deze ervaring vaker voor (onthouden)'}
              onPress={onToggleSave}
              style={bk.like}
            >
              <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={bk.inkSolid as string} />
            </Pressable>
          </View>
          <View style={bk.titleBlock}>
            <Text style={bk.title}>{featured.title}</Text>
            <View style={bk.factRow}>
              {facts.map((fact, index) => (
                <React.Fragment key={`${fact}-${index}`}>
                  {index > 0 && <View style={bk.factDot} />}
                  <Text style={bk.fact}>{fact}</Text>
                </React.Fragment>
              ))}
            </View>
          </View>
          {/* Momentum merkt: een telling over echte data, of de zachte
              observatie uit het leermodel; anders valt de kaart weg. */}
          {observation && <View style={bk.observ}>
            <Text style={bk.observLabel}>Momentum merkt</Text>
            <Text style={bk.observText}>{observation.text}</Text>
            <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Profile')} style={bk.observAction}>
              <Text style={bk.observActionText}>Bekijk of corrigeer dit</Text>
              <Feather name="arrow-right" size={12} color={bk.accentSolid as string} />
            </Pressable>
          </View>}
          {/* Statistiekentrio: alleen getallen met een bron. */}
          {stats.length > 0 && <View style={bk.stats}>
            {stats.map((stat) => (
              <View key={stat.label} style={bk.stat}>
                <Text style={bk.statValue}>{stat.value}</Text>
                <Text style={bk.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>}
          {/* Strook met bewaarde momenten: tik wisselt de albumpagina. */}
          <View style={bk.month}>
            <View style={bk.monthHead}>
              <Text style={bk.monthTitle}>{strip.title}</Text>
              <Text style={bk.monthCount}>{strip.count}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={bk.monthRow}>
              {strip.thumbs.map((thumb) => (
                <Pressable key={thumb.id} accessibilityRole="button" accessibilityLabel={`Toon ${thumb.title}`} onPress={() => setFeaturedId(thumb.id)} style={[bk.thumb, thumb.id === featured.id && bk.thumbActive]}>
                  <CoverImage uri={thumb.image} style={bk.thumbImageWrap} imageStyle={bk.thumbImage}>
                    <View style={bk.thumbShade} />
                    <Text style={bk.thumbLabel}>{thumb.label}</Text>
                  </CoverImage>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          {/* Fotostrip (ADR-061, punt 3): eigen beelden bij de herinnering.
              Alleen lokale verwijzingen; de systeemkiezer opent op expliciete
              tik, er is geen upload en geen analyse. */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lifePhotoStrip}>
            {(featured.photos ?? []).map((uri) => <View key={uri} style={styles.lifePhotoThumbWrap}><Image source={{ uri }} style={styles.photoThumb} contentFit="cover" transition={0} recyclingKey={uri} /></View>)}
            {(featured.photos?.length ?? 0) < 8 && <Pressable accessibilityRole="button" accessibilityLabel={`Foto's toevoegen aan ${featured.title}`} onPress={() => addPhotosTo(featured.id)} style={styles.lifePhotoAdd}><Ionicons name="images-outline" size={18} color={bk.accentSolid as string} /><Text style={styles.lifePhotoAddText}>FOTO'S</Text></Pressable>}
          </ScrollView>
          {/* Deel-ghost en de rustige heropen-ingang (repeat-signaal). */}
          <Pressable accessibilityRole="button" accessibilityLabel="Deel dit moment" onPress={shareMemory} style={({ pressed }) => [bk.ghost, pressed && bk.pressed]}>
            <Feather name="share" size={15} color={bk.inkSolid as string} />
            <Text style={bk.ghostText}>Deel dit moment</Text>
          </Pressable>
          {experience ? <View style={{ padding: 20, gap: 16 }}><OpenExperience experience={experience} from="lifebook" /><SaveExperience experience={experience} /></View>
            : <Text style={ed.small}>De oorspronkelijke ervaring is niet meer beschikbaar. Je herinnering blijft bewaard.</Text>}
        </>
      )}
    </ScrollView>
    </SurfaceFrame>
  );
}

// Visuele taal (concept v2): zelfde palet als R1–R4 — near-black podium,
// glaspanelen, accentgroen uit de #34c772-familie, serif display voor de
// titel en statistieken. De lichte sibling volgt de dagpalet-tokens
// (ADR-064); alle tekst/achtergrond-paren houden WCAG AA.
const bk = schemeStyles(({ colors: schemeColors }) => {
  const evening = schemeColors === palettes.dark.colors;
  const palette = evening
    ? {
        ink: schemeColors.bone,
        ink2: schemeColors.muted,
        ink3: schemeColors.muted,
        accent: schemeColors.accent,
        glass: schemeColors.panel,
        line: schemeColors.line,
        badgeBg: 'rgba(10,12,18,0.42)',
        likeBorder: 'rgba(245,244,240,0.22)',
      }
    : {
        ink: schemeColors.bone,
        ink2: schemeColors.muted,
        ink3: schemeColors.muted,
        accent: schemeColors.accent,
        glass: schemeColors.panel,
        line: schemeColors.line,
        badgeBg: 'rgba(255,255,255,0.72)',
        likeBorder: 'rgba(255,255,255,0.5)',
      };
  type BookStyles = {
    inkSolid: string;
    accentSolid: string;
    head: ViewStyle;
    headTitle: TextStyle;
    headSub: TextStyle;
    photoWrap: ViewStyle;
    photo: ViewStyle;
    photoImage: ImageStyle;
    like: ViewStyle;
    titleBlock: ViewStyle;
    title: TextStyle;
    factRow: ViewStyle;
    fact: TextStyle;
    factDot: ViewStyle;
    observ: ViewStyle;
    observLabel: TextStyle;
    observText: TextStyle;
    observAction: ViewStyle;
    observActionText: TextStyle;
    stats: ViewStyle;
    stat: ViewStyle;
    statValue: TextStyle;
    statLabel: TextStyle;
    month: ViewStyle;
    monthHead: ViewStyle;
    monthTitle: TextStyle;
    monthCount: TextStyle;
    monthRow: ViewStyle;
    thumb: ViewStyle;
    thumbActive: ViewStyle;
    thumbImageWrap: ViewStyle;
    thumbImage: ImageStyle;
    thumbShade: ViewStyle;
    thumbLabel: TextStyle;
    ghost: ViewStyle;
    ghostText: TextStyle;
    reopen: ViewStyle;
    reopenText: TextStyle;
    pressed: ViewStyle;
  };
  const stylesDef: BookStyles = {
    inkSolid: palette.ink,
    accentSolid: palette.accent,
    head: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 4 },
    headTitle: { fontSize: 14.5, fontWeight: '600', color: palette.ink },
    headSub: { fontSize: 11.5, color: palette.ink2, marginTop: 1 },
    photoWrap: { marginHorizontal: 12, marginTop: 12, borderRadius: 26, overflow: 'hidden', position: 'relative' },
    photo: { height: 300 },
    photoImage: { borderRadius: 26 },
    like: {
      position: 'absolute', top: 14, right: 14, width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: palette.glass, borderWidth: 1, borderColor: palette.line,
    },
    titleBlock: { marginTop: 14, marginHorizontal: 22 },
    title: { fontFamily: typography.displayFamilyMedium, fontWeight: '400', fontSize: 26, letterSpacing: -0.3, color: palette.ink },
    factRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 9 },
    fact: { fontSize: 12, color: palette.ink2, fontWeight: '500' },
    factDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: palette.ink3 },
    observ: {
      marginTop: 24, marginHorizontal: 20, paddingVertical: 16,
      borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: palette.line,
    },
    observLabel: { fontSize: 10, letterSpacing: 1.8, fontWeight: '700', color: palette.accent, textTransform: 'uppercase' },
    observText: { marginTop: 7, fontSize: 17, lineHeight: 26, color: palette.ink },
    observAction: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9, minHeight: 44, alignSelf: 'flex-start' },
    observActionText: { fontSize: 12, fontWeight: '600', color: palette.accent },
    stats: { flexDirection: 'row', gap: 8, marginTop: 12, marginHorizontal: 12 },
    stat: {
      flex: 1, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center',
    },
    statValue: { fontFamily: typography.displayFamilyMedium, fontWeight: '400', fontSize: 19, color: palette.ink },
    statLabel: { fontSize: 13, color: palette.ink2, marginTop: 4, textAlign: 'center' },
    month: { marginTop: 16, marginHorizontal: 12 },
    monthHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 10 },
    monthTitle: { fontSize: 10.5, letterSpacing: 2, fontWeight: '700', color: palette.ink2, textTransform: 'uppercase' },
    monthCount: { fontSize: 11, fontWeight: '600', color: palette.ink3 },
    monthRow: { gap: 8, marginTop: 10, paddingHorizontal: 2 },
    thumb: { width: 84, height: 74, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
    thumbActive: { borderColor: palette.accent },
    thumbImageWrap: { flex: 1 },
    thumbImage: { borderRadius: 14 },
    thumbShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 30, backgroundColor: 'rgba(11,13,19,0.45)' },
    thumbLabel: { position: 'absolute', left: 8, bottom: 7, fontSize: 8.5, fontWeight: '700', letterSpacing: 0.8, color: '#F5F4F0' },
    ghost: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      marginHorizontal: 12, marginTop: 16, borderRadius: 999, paddingVertical: 13,
      backgroundColor: palette.glass, borderWidth: 1, borderColor: palette.line,
    },
    ghostText: { fontSize: 13.5, fontWeight: '600', color: palette.ink },
    reopen: { alignSelf: 'center', marginTop: 12, paddingVertical: 6, paddingHorizontal: 12 },
    reopenText: { fontSize: 11.5, color: palette.ink3, fontWeight: '500' },
    pressed: { opacity: 0.92 },
  };
  return stylesDef;
});
