import React, { useState } from 'react';
import { Linking, Pressable, Text } from 'react-native';
import type { PlaceInformation, VisitPlace } from '../../product/experienceModel';
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
