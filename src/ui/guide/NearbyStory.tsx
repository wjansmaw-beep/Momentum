import React from 'react';
import { Text, View } from 'react-native';
import { ed, EditorialAction, EditorialDisclosure } from '../editorial';
import type { useNearbyStory } from './useNearbyStory';

export function NearbyStory({guide,onSelect}:{guide:ReturnType<typeof useNearbyStory>;onSelect:(index:number)=>void}) {
  if(!guide.supported) return null;
  return <View style={{gap:12}}>
    {guide.result?.kind==='proposal' && <View style={ed.section}>
      <Text accessibilityLiveRegion="polite" style={ed.body}>Bij jou in de buurt: {guide.result.place}</Text>
      <EditorialAction title="Lees dit verhaal" onPress={()=>{const index=guide.accept();if(index!==undefined) onSelect(index);}} />
      <EditorialAction title="Blijf bij dit verhaal" onPress={guide.dismiss} />
    </View>}
    <EditorialDisclosure title="Verhaal bij je locatie">
      <Text style={ed.small}>Als je terugkomt in deze gids, kan Momentum één keer je locatie controleren en een passend verhaal voorstellen. Je kiest zelf. Je locatie wordt niet bewaard.</Text>
      <Text accessibilityLiveRegion="polite" style={ed.small}>{guide.busy ? 'Locatie controleren…' : guide.message || (guide.enabled ? 'Ingeschakeld voor deze tocht.' : 'Uitgeschakeld. Alle hoofdstukken blijven beschikbaar.')}</Text>
      {guide.enabled ? <>
        <EditorialAction title="Controleer mijn locatie" disabled={guide.busy} onPress={guide.retry} />
        <EditorialAction title="Locatievoorstellen uitzetten" onPress={guide.disable} />
      </> : <EditorialAction title="Locatievoorstellen aanzetten" disabled={guide.busy} onPress={guide.enable} />}
    </EditorialDisclosure>
  </View>;
}
