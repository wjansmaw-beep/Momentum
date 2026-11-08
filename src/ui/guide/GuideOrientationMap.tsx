import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import type { GuideDestination } from '../../guidance/guideDestination';

export function GuideOrientationMap({ destination }: { destination: GuideDestination }) {
  const initial = { latitude: destination.latitude, longitude: destination.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 };
  const [region, setRegion] = useState<Region>(initial);
  const [visible, setVisible] = useState(false);
  const zoom = (factor: number) => setRegion(r => ({ ...r,
    latitudeDelta: Math.min(1, Math.max(0.002, r.latitudeDelta * factor)),
    longitudeDelta: Math.min(1, Math.max(0.002, r.longitudeDelta * factor)),
  }));
  return <View style={s.panel}>
    <Text accessibilityRole="header" style={s.label}>Bestemming · {destination.label}</Text>
    <Text style={s.copy}>Oriëntatiepunt, geen uitgestippelde route. De routeapp leidt je. Zonder kaart blijft de bestemming hierboven beschikbaar.</Text>
    <Pressable accessibilityRole="button" aria-expanded={visible} accessibilityState={{ expanded: visible }} onPress={() => setVisible(v => !v)} style={s.button}>
      <Text style={s.label}>{visible ? 'Verberg kaart' : 'Bekijk de kaart'}</Text>
    </Pressable>
    {visible && <>
      <MapView provider={PROVIDER_DEFAULT} style={s.map} region={region} onRegionChangeComplete={setRegion}
        pitchEnabled={false} rotateEnabled={false} showsUserLocation={false} showsMyLocationButton={false}
        toolbarEnabled={false} accessibilityLabel={`Oriëntatiekaart bij ${destination.label}`}>
        <Marker coordinate={destination} title={destination.label} />
      </MapView>
      <View style={s.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel="Zoom in op kaart" onPress={() => zoom(0.5)} style={s.button}><Text style={s.label}>＋</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Zoom uit op kaart" onPress={() => zoom(2)} style={s.button}><Text style={s.label}>−</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setRegion(initial)} style={s.button}><Text style={s.label}>Toon bestemming</Text></Pressable>
      </View>
      <Text style={s.copy}>Geen kaart zichtbaar? Gebruik de bestemming en ‘Open route in Kaarten’. Je hoeft geen locatie te delen.</Text>
    </>}
  </View>;
}

const s = StyleSheet.create({
  panel: { padding: 16, borderRadius: 20, backgroundColor: '#243832', gap: 12 },
  label: { color: '#F4F0E7', fontSize: 16, lineHeight: 23 }, copy: { color: '#F4F0E7', fontSize: 14, lineHeight: 21 },
  map: { height: 300, width: '100%' }, controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 48, minWidth: 48, padding: 12, borderRadius: 16, backgroundColor: '#3D554B', justifyContent: 'center', alignItems: 'center' },
});
