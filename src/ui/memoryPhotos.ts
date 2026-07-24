import * as ImagePicker from 'expo-image-picker';

// Foto's bij herinneringen (ADR-061, punt 3): altijd een expliciete
// gebruikersactie via de systeemkiezer. De gekozen beelden blijven lokale
// verwijzingen op het apparaat (AsyncStorage-referenties in de herinnering) —
// nooit upload, nooit analyse, geen camera-autocapture. Op web geeft de kiezer
// sessie-uri's terug; daar blijft de fotostrip zichtbaar zolang de sessie duurt.
export async function pickMemoryPhotos(limit = 4): Promise<string[]> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: limit,
      quality: 0.85,
    });
    if (result.canceled) return [];
    return result.assets.map((asset) => asset.uri).filter((uri) => typeof uri === 'string' && uri.length > 0);
  } catch {
    // Een geweigerde of ontbrekende mediatheek is geen foutconditie voor de
    // reflectie; de gebruiker kan gewoon zonder foto bewaren.
    return [];
  }
}
