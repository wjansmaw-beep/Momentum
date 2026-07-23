import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

// Echt glas (ADR-057, Horizon B): expo-blur BlurView onder drijvende chrome
// (bottomNav, gids-sheet). expo-blur ondersteunt web via CSS backdrop-filter;
// de meegegeven `fallbackColor` blijft als achtergrondlaag aanwezig zodat een
// browser zonder backdrop-filter precies het vroegere rustige vlak toont —
// geen visuele regressie op web.

type GlassProps = {
  intensity?: number;
  /** Achtergrondtint die ook zonder werkende blur zichtbaar blijft. */
  fallbackColor: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export function Glass({ intensity = 44, fallbackColor, style, children }: GlassProps) {
  return (
    <BlurView intensity={intensity} tint="light" style={[styles.glass, { backgroundColor: fallbackColor }, style]}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  glass: { overflow: 'hidden' },
});
