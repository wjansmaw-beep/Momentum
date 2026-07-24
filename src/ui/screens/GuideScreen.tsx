import React from 'react';
import { Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StackActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../design/theme';
import { impactLight } from '../../design/haptics';
import { CoverImage, ImageShade } from '../CoverImage';
import { QuietCanvas } from '../QuietCanvas';
import { PrimaryButton, SecondaryButton } from '../primitives';
import { SurfaceFrame } from '../frames';
import { styles } from '../styles/appStyles';
import { useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';

// GIDS-tab (ADR-067, fase R1): de rustige thuisroute van de gids. Loopt er een
// ervaring, dan staat hier de concrete onderweg-staat met hervat-knoppen naar
// de bestaande Presence- of Prepare-stage (de gids zelf is in R1 ongemoeid).
// Zonder actieve ervaring toont de tab de bestaande rustige staat — geen
// verzonnen begeleiding.

export function GuideScreen() {
  const { activeSession, resumableExperience, resumeSession, discardSession } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const onResume = () => {
    const stage = resumeSession();
    if (stage === 'presence') navigation.navigate('Presence');
    else if (stage === 'prepare') navigation.navigate('Prepare');
  };
  const onDiscard = () => {
    impactLight();
    discardSession();
  };
  const underway = activeSession && resumableExperience ? resumableExperience : undefined;

  return (
    <SurfaceFrame>
      <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
        {underway ? (
          <>
            <Text style={styles.eyebrow}>GIDS</Text>
            <Text style={styles.screenTitle}>Je bent onderweg.</Text>
            <Text style={styles.screenSubtitle}>
              {activeSession?.stage === 'presence'
                ? 'De ervaring loopt. De gids gaat verder waar je was gebleven.'
                : 'De voorbereiding ligt klaar. Ga verder wanneer jij vertrekt.'}
            </Text>
            <CoverImage uri={underway.image} style={guideStyles.image} imageStyle={guideStyles.imageRound}>
              <ImageShade />
              <View style={guideStyles.imageCopy}>
                <Text style={[guideStyles.imageKicker, styles.onImageAccentText]}>
                  {activeSession?.stage === 'presence' ? 'NU BEZIG' : 'VOORBEREIDING KLAAR'}
                </Text>
                <Text style={[guideStyles.imageTitle, styles.onImageText]}>{underway.title}</Text>
                <Text style={[guideStyles.imageMeta, styles.onImageMutedText]}>{underway.duration} min</Text>
              </View>
            </CoverImage>
            <PrimaryButton label={activeSession?.stage === 'presence' ? 'Ga verder onderweg' : 'Ga verder met de voorbereiding'} onPress={onResume} />
            <SecondaryButton label="Sluit deze ervaring rustig af" onPress={onDiscard} />
          </>
        ) : (
          <QuietCanvas eyebrow="GIDS" title="Er loopt nu geen ervaring.">
            <Text style={styles.screenSubtitle}>
              Start een moment vanaf Nu. Zodra je vertrekt, verschijnt de begeleiding hier — rustig, en alleen als het helpt.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bekijk wat er nu kan"
              onPress={() => { impactLight(); navigation.dispatch(StackActions.replace('Now')); }}
              style={guideStyles.quietAction}
            >
              <Feather name="arrow-right" size={15} color={colors.accent} />
              <Text style={guideStyles.quietActionText}>Bekijk wat er nu kan</Text>
            </Pressable>
          </QuietCanvas>
        )}
      </ScrollView>
    </SurfaceFrame>
  );
}

const guideStyles = {
  image: { minHeight: 300, marginTop: 22, marginBottom: 22, justifyContent: 'flex-end' } as StyleProp<ViewStyle>,
  imageRound: { borderRadius: 26 },
  imageCopy: { padding: 18, gap: 4 },
  imageKicker: { fontSize: 10, letterSpacing: 1.6, fontWeight: '700' as const },
  imageTitle: { fontSize: 24, lineHeight: 29, fontWeight: '600' as const },
  imageMeta: { fontSize: 13, fontWeight: '500' as const },
  quietAction: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginTop: 18, alignSelf: 'flex-start' as const },
  quietActionText: { color: colors.accent, fontSize: 14, fontWeight: '600' as const },
};
