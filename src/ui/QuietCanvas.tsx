import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated from 'react-native-reanimated';
import { colors, typography } from '../design/theme';
import { useBreathing } from '../design/motion';

// Lege en rustige states als redactionele momenten (ADR-057, Horizon B):
// een warme gradient-achtergrond, grote serif-titel en één subtiel ademend
// element. De ademhaling valt volledig stil bij reduced-motion (centraal
// gehandhaafd in useBreathing). Copy en toon blijven ongewijzigd van de
// beller; dit component levert uitsluitend de vorm.

type QuietCanvasProps = {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
};

export function QuietCanvas({ eyebrow, title, children }: QuietCanvasProps) {
  const breathing = useBreathing({ period: 13000, scaleTo: 1.09, opacityTo: 0.66 });
  return (
    <View style={styles.frame}>
      <LinearGradient
        pointerEvents="none"
        colors={['#FFFFFF', '#F7F6FA', '#EFEDF6']}
        locations={[0, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Reanimated.View pointerEvents="none" style={[styles.orb, breathing]} />
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    minHeight: 520,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    backgroundColor: colors.panel,
    justifyContent: 'center',
  },
  orb: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    top: -120,
    right: -110,
    backgroundColor: 'rgba(32,128,73,0.10)',
  },
  copy: { padding: 26, gap: 13 },
  eyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 1.45, fontWeight: '700' },
  title: {
    color: colors.bone,
    fontSize: 36,
    lineHeight: 42,
    fontFamily: typography.displayFamilyMedium,
    letterSpacing: -0.6,
    maxWidth: 400,
  },
});
