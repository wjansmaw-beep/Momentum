import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, phase } from '../design/theme';

// Web-fallback voor de routekaart-preview (ADR-061, punt 3): op web laden we
// bewust géén kaart-framework. In plaats daarvan een stijlvolle, statische
// oriëntatieplaats met dezelfde informatierol — bestemming benoemen, rustig
// kaderen — terwijl de bestaande route-informatie eronder leidend blijft.

type RouteMapPreviewProps = {
  latitude: number;
  longitude: number;
  label: string;
  radiusMeters?: number;
};

export function RouteMapPreview({ label }: RouteMapPreviewProps) {
  return (
    <View style={styles.frame} accessibilityLabel={`Bestemming ${label} op de kaart`}>
      <View style={styles.gridRow} /><View style={styles.gridRow} /><View style={styles.gridRow} />
      <View style={styles.markerWrap}>
        <View style={styles.markerHalo} />
        <Ionicons name="location" size={30} color={phase.prepare.accent} />
      </View>
      <View style={styles.captionBar}>
        <Text style={styles.captionTitle}>{label}</Text>
        <Text style={styles.captionBody}>Kaartvoorbeeld volgt in de app op je telefoon · de routeapp leidt je</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: phase.prepare.line,
    backgroundColor: phase.prepare.soft,
    marginTop: 14,
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  gridRow: {
    position: 'relative',
    alignSelf: 'stretch',
    height: 0,
  },
  markerWrap: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  markerHalo: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    borderColor: phase.prepare.line,
    backgroundColor: 'rgba(47,93,168,0.14)',
  },
  captionBar: {
    alignSelf: 'stretch',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: phase.prepare.line,
    backgroundColor: colors.panel,
  },
  captionTitle: { color: colors.bone, fontSize: 13, fontWeight: '700' },
  captionBody: { color: phase.prepare.text, fontSize: 10, lineHeight: 14, marginTop: 3 },
});
