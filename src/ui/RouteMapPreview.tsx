import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';
import { phase, schemeStyles } from '../design/theme';

// Routekaart-preview (ADR-061, punt 3): een rustige in-kaart oriëntatie op de
// bestemming met OpenStreetMap-tegels. Alleen oriëntatie — Apple Maps blijft
// de route-eigenaar (ADR-041 ongewijzigd); er wordt hier geen route berekend
// of getekend. De kaart is niet-interactief (puur voorbeeld) en respecteert
// daarmee ook de motion-discipline: geen pannen, geen animatie.
// Web kent een eigen stijlvolle fallback (RouteMapPreview.web.tsx) zodat er
// op web nooit een kaart-framework in de bundel terechtkomt.

type RouteMapPreviewProps = {
  latitude: number;
  longitude: number;
  /** Naam van de bestemming, alleen als marker-titel. */
  label: string;
  /** Optionele straal (m) uit het aankomstplan om de zoom passend te maken. */
  radiusMeters?: number;
};

const zoomDelta = (radiusMeters?: number) => {
  if (!radiusMeters || !Number.isFinite(radiusMeters)) return 0.02;
  // Grof genoeg voor oriëntatie: ~4x de straal in beeld, tussen 550 m en 5,5 km.
  return Math.min(0.05, Math.max(0.005, (radiusMeters * 4) / 111320));
};

export function RouteMapPreview({ latitude, longitude, label, radiusMeters }: RouteMapPreviewProps) {
  const delta = zoomDelta(radiusMeters);
  return (
    <View style={styles.frame}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{ latitude, longitude, latitudeDelta: delta, longitudeDelta: delta }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
        pointerEvents="none"
        accessibilityLabel={`Kaartvoorbeeld van ${label}`}
      >
        <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} zIndex={-1} />
        <Marker coordinate={{ latitude, longitude }} title={label} pinColor={phase.prepare.accent} />
      </MapView>
      <Text style={styles.attribution}>© OpenStreetMap-bijdragers · alleen oriëntatie, de routeapp leidt je</Text>
    </View>
  );
}

const styles = schemeStyles(({ phase }) => StyleSheet.create({
  frame: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: phase.prepare.line,
    marginTop: 14,
  },
  map: { height: 190, width: '100%' },
  attribution: {
    color: phase.prepare.text,
    fontSize: 10,
    lineHeight: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: phase.prepare.soft,
  },
}));
