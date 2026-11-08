import React from 'react';
import { Text, View } from 'react-native';
import type { GuideDestination } from '../../guidance/guideDestination';

export function GuideOrientationMap({ destination }: { destination: GuideDestination }) {
  return <View style={{ padding: 16, borderRadius: 20, backgroundColor: '#243832', gap: 10 }}>
    <Text accessibilityRole="header" style={{ color: '#F4F0E7', fontSize: 18 }}>Bestemming · {destination.label}</Text>
    <Text style={{ color: '#F4F0E7', fontSize: 15, lineHeight: 23 }}>De interactieve oriëntatiekaart is beschikbaar in de iPhone-app. Gebruik hier ‘Open route in Kaarten’. Dit punt bevat geen uitgestippelde route.</Text>
  </View>;
}
