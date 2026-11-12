import { colors, schemeStyles } from '../../design/theme';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import type { GuideDestination } from '../../guidance/guideDestination';
import { readForegroundPosition, PositionSample } from '../../guidance/foregroundPosition';

export function GuideOrientationMap({ destination }: { destination: GuideDestination }) {
  const initial = { latitude: destination.latitude, longitude: destination.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 };
  const [region, setRegion] = useState<Region>(initial);
  const [visible, setVisible] = useState(true);
  const [position, setPosition] = useState<PositionSample>();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const map = useRef<MapView>(null);
  const request = useRef<AbortController | undefined>(undefined);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state !== 'background') return;
      request.current?.abort();
      setBusy(false);
      setPosition(undefined);
      setStatus('Vraag je positie opnieuw op wanneer je verdergaat.');
    });
    return () => { request.current?.abort(); listener.remove(); };
  }, []);
  const locate = async () => {
    if (busy) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true); setPosition(undefined); setStatus('');
    try {
      const sample = await readForegroundPosition({
        permission: async () => (await Location.requestForegroundPermissionsAsync()).status === 'granted',
        watch: (receive, fail) => Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced },
          value => receive({ latitude: value.coords.latitude, longitude: value.coords.longitude,
            accuracy: value.coords.accuracy, timestamp: value.timestamp }), fail),
      }, controller.signal);
      if (controller.signal.aborted) return;
      setPosition(sample);
      setStatus('Eenmalig bepaald om ' + new Date(sample.timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) + '. Niet live bijgewerkt.');
      map.current?.fitToCoordinates([sample, destination], { edgePadding: { top: 45, right: 45, bottom: 45, left: 45 }, animated: false });
    } catch (error) {
      if (controller.signal.aborted) return;
      const reason = error instanceof Error ? error.message : '';
      setStatus(reason === 'denied' ? 'Locatietoegang is niet toegestaan. De bestemming blijft op de kaart staan.'
        : reason === 'timeout' ? 'Je positie kon niet op tijd worden bepaald. Probeer het opnieuw op een open plek.'
        : 'Je positie is nu niet beschikbaar. Je kunt de bestemmingskaart blijven gebruiken.');
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };
  const zoom = (factor: number) => setRegion(r => ({ ...r,
    latitudeDelta: Math.min(180, Math.max(0.002, r.latitudeDelta * factor)),
    longitudeDelta: Math.min(360, Math.max(0.002, r.longitudeDelta * factor)),
  }));
  return <View style={s.panel}>
    <Pressable accessibilityRole="button" aria-expanded={visible} accessibilityState={{ expanded: visible }} onPress={() => {
      if (visible) { request.current?.abort(); setBusy(false); setPosition(undefined); setStatus(''); }
      setVisible(v => !v);
    }} style={s.row}>
      <Text style={[s.label, { flex: 1 }]}>Kaart</Text><Text accessible={false} style={s.label}>{visible ? '−' : '+'}</Text>
    </Pressable>
    {visible && <>
      <MapView ref={map} provider={PROVIDER_DEFAULT} style={s.map} region={region} onRegionChangeComplete={setRegion}
        pitchEnabled={false} rotateEnabled={false} showsUserLocation={false} showsMyLocationButton={false}
        toolbarEnabled={false} accessibilityLabel={'Oriëntatiekaart bij ' + destination.label}>
        <Marker coordinate={destination} title={destination.label} />
        {position && <Marker coordinate={position} title="Je eenmalig bepaalde positie" />}
        {position && position.accuracy != null && Number.isFinite(position.accuracy) && position.accuracy > 0 &&
          <Circle center={position} radius={position.accuracy} strokeColor={colors.bone} fillColor="transparent" />}
      </MapView>
      <View style={s.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel="Zoom in op kaart" onPress={() => zoom(0.5)} style={s.button}><Text style={s.label}>＋</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Zoom uit op kaart" onPress={() => zoom(2)} style={s.button}><Text style={s.label}>−</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setRegion(initial)} style={s.button}><Text style={s.label}>Toon bestemming</Text></Pressable>
      </View>
      <Pressable accessibilityRole="button" disabled={busy} accessibilityState={{ disabled: busy, busy }} onPress={locate} style={s.row}>
        <Text style={s.label}>{busy ? 'Positie bepalen…' : position ? 'Vernieuw mijn positie' : 'Toon mijn positie'}</Text>
      </Pressable>
      {!!status && <Text accessibilityLiveRegion="polite" style={s.copy}>{status}</Text>}
      <Text style={s.copy}>Alleen op verzoek wordt je positie bepaald. Deze wordt hier niet opgeslagen. De kaart toont punten, geen gecontroleerde wandelroute.</Text>
    </>}
  </View>;
}

const s = schemeStyles(({ colors: c }) => StyleSheet.create({
  panel: { gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
  label: { color: c.bone, fontSize: 16, lineHeight: 23 }, copy: { color: c.muted, fontSize: 14, lineHeight: 21 },
  map: { height: 300, width: '100%' }, controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { minHeight: 48, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  button: { minHeight: 48, minWidth: 48, padding: 10, justifyContent: 'center', alignItems: 'center' },
}));
