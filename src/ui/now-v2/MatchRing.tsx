import React from 'react';
import { StyleSheet, View } from 'react-native';

// Match-ring (concept v2, ADR-067): uitleg van fit — nooit een score, ranking
// of prestatie. react-native-svg is bewust géén dependency van dit project;
// de ring is daarom opgebouwd uit twee geclipde halve cirkels (de klassieke
// View-techniek), zodat hij identiek rendert op web én native.

type MatchRingProps = {
  /** 0–100 */
  percent: number;
  size?: number;
  stroke?: number;
  trackColor: string;
  accentColor: string;
  children?: React.ReactNode;
};

export function MatchRing({ percent, size = 52, stroke = 4.5, trackColor, accentColor, children }: MatchRingProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const totalDegrees = clamped * 3.6;
  const rightRotation = Math.min(totalDegrees, 180);
  const leftRotation = Math.max(0, totalDegrees - 180);
  const radius = size / 2;
  const full = {
    position: 'absolute' as const,
    top: 0,
    width: size,
    height: size,
    borderRadius: radius,
    borderWidth: stroke,
    borderColor: accentColor,
  };
  return (
    <View style={{ width: size, height: size }}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: stroke, borderColor: trackColor }]} />
      {/* Rechter helft: veegt 0°→180° vanaf de top (met de klok mee). */}
      <View style={{ position: 'absolute', top: 0, left: radius, width: radius, height: size, overflow: 'hidden' }}>
        <View
          style={[
            full,
            { left: -radius, borderRightColor: 'transparent', transform: [{ rotate: `${rightRotation}deg` }] },
          ]}
        />
      </View>
      {/* Linker helft: alleen zichtbaar boven 50%, vervolg van 180°→360°. */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: radius, height: size, overflow: 'hidden' }}>
        <View
          style={[
            full,
            { left: 0, borderLeftColor: 'transparent', transform: [{ rotate: `${leftRotation}deg` }] },
          ]}
        />
      </View>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
