import React, { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import type { PlaceInformation, VisitPlace, WalkingApproach } from '../../product/experienceModel';
import { presentPlaceInformation, safePlaceSource } from '../../guidance/placeInformation';
import { ed, EditorialDisclosure } from '../editorial';

function InformationRow({ title, info, fallback }: { title: string; info?: PlaceInformation; fallback?: string }) {
  const [error, setError] = useState(false);
  const value = presentPlaceInformation(info);
  const url = value.sourceUrl ?? safePlaceSource(fallback);
  return <EditorialDisclosure title={title}>
    <Text style={ed.body}>{value.text}</Text>
    {value.checkedAt && <Text style={ed.small}>Bron nagekeken op {value.checkedAt}.</Text>}
    {value.outdated && value.checkedAt && <Text style={ed.small}>Deze informatieperiode is verstreken. Controleer de actuele gegevens vóór je bezoek.</Text>}
    {url && <Pressable accessibilityRole="link" style={ed.row} onPress={() => {
      setError(false); Linking.openURL(url).catch(() => setError(true));
    }}><Text style={ed.body}>Informatie van de locatie ↗</Text></Pressable>}
    {error && <Text accessibilityRole="alert" style={ed.small}>De bron is nu niet bereikbaar. Probeer het later opnieuw.</Text>}
  </EditorialDisclosure>;
}

export function PlaceDetails({ place }: { place?: VisitPlace }) {
  if (!place) return null;
  return <>
    {place.openingHours && <InformationRow title="Openingstijden" info={place.openingHours} fallback={place.sourceUrl} />}
    {place.admission && <InformationRow title="Toegang en kosten" info={place.admission} fallback={place.sourceUrl} />}
  </>;
}

export function WalkingDirections({ approach }: { approach?: WalkingApproach }) {
  const [error, setError] = useState(false);
  if (!approach) return null;
  return <View style={{ gap: 12 }}>
    <Text accessibilityRole="header" style={ed.heading}>Vanaf {approach.from}</Text>
    {approach.instructions.map((instruction, index) => <Text key={index} style={ed.body}>{index + 1}. {instruction}</Text>)}
    <Text style={ed.small}>{approach.note}</Text>
    <EditorialDisclosure title="Over deze loopaanwijzingen">
      <Text style={ed.small}>Aanwijzingen tussen de genoemde plekken, niet vanaf je huidige positie. Geen live afslagbegeleiding of controle op afsluitingen. Bronnen nagekeken op {approach.checkedAt}.</Text>
      {approach.sources.map(source => {
        const url = safePlaceSource(source.url);
        return url ? <Pressable key={url} accessibilityRole="link" style={ed.row} onPress={() => {
          setError(false); Linking.openURL(url).catch(() => setError(true));
        }}><Text style={ed.body}>{source.title} ↗</Text></Pressable> : null;
      })}
      {approach.sources.some(source => source.url.startsWith('https://www.openstreetmap.org/')) && <Text style={ed.small}>Kaartgegevens © OpenStreetMap-bijdragers, ODbL.</Text>}
      {error && <Text accessibilityRole="alert" style={ed.small}>De bron is nu niet bereikbaar. De aanwijzingen blijven beschikbaar.</Text>}
    </EditorialDisclosure>
  </View>;
}
