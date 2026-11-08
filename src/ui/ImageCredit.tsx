import React, { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { referenceImageCredit } from '../product/referenceImages';

export function ImageCredit({ uri }: { uri?: string }) {
  const credit = referenceImageCredit(uri);
  const [error, setError] = useState(false);
  if (!credit) return null;
  const open = (url: string) => { setError(false); Linking.openURL(url).catch(() => setError(true)); };
  return <View style={{ paddingHorizontal: 16, backgroundColor: '#172522', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
    <Pressable accessibilityRole="link" onPress={() => open(credit.source)} style={{ minHeight: 48, flexShrink: 1, justifyContent: 'center' }}>
      <Text style={{ color: '#F4F0E7', fontSize: 12, lineHeight: 18 }}>{credit.label} · beelduitsnede ↗</Text>
    </Pressable>
    <Pressable accessibilityRole="link" onPress={() => open(credit.license)} style={{ minHeight: 48, flexShrink: 1, justifyContent: 'center' }}>
      <Text style={{ color: '#D8C8A8', fontSize: 12, lineHeight: 18 }}>Licentie ↗</Text>
    </Pressable>
    {error && <Text accessibilityLiveRegion="polite" style={{ color: '#F4F0E7' }}>De bron kon niet worden geopend.</Text>}
  </View>;
}
