import { byId, Experience, LiveEvidence, RoutePlan } from '../product/experienceModel';
import { PrototypeContext } from '../product/localIntelligence';

declare const process: { env: { EXPO_PUBLIC_EBIRD_API_KEY?: string } };

export type Coordinates = { latitude: number; longitude: number };
export type SourceState = 'live' | 'not-configured' | 'error';
export type SourceReceipt = { id: string; name: string; state: SourceState; detail: string; url: string };

export type WeatherSignal = {
  temperature: number;
  windSpeed: number;
  visibilityMeters: number;
  weatherCode: number;
  sunrise: string;
  sunset: string;
  observedAt: string;
};

export type BirdObservation = {
  commonName: string;
  scientificName: string;
  observedAt: string;
  latitude: number;
  longitude: number;
  locationName: string;
  locationId: string;
  publicLocation: boolean;
};

export type LiveWorldSnapshot = {
  regionLabel: string;
  coordinates: Coordinates;
  retrievedAt: string;
  weather?: WeatherSignal;
  birdObservations: BirdObservation[];
  sources: SourceReceipt[];
};

type OpenMeteoResponse = {
  current?: { time: string; temperature_2m: number; wind_speed_10m: number; visibility: number; weather_code: number };
  daily?: { sunrise?: string[]; sunset?: string[] };
};

type EbirdObservation = {
  comName?: string; sciName?: string; obsDt?: string; lat?: number; lng?: number;
  locName?: string; locId?: string; locationPrivate?: boolean;
};

const isoInHours = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
const safeFetch = async (url: string, init?: RequestInit) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } finally {
    clearTimeout(timeout);
  }
};

async function loadWeather(coordinates: Coordinates): Promise<{ signal?: WeatherSignal; receipt: SourceReceipt }> {
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude), longitude: String(coordinates.longitude),
    current: 'temperature_2m,wind_speed_10m,visibility,weather_code',
    daily: 'sunrise,sunset', timezone: 'auto', forecast_days: '1',
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  try {
    const response = await safeFetch(url);
    const data = await response.json() as OpenMeteoResponse;
    if (!data.current) throw new Error('Geen actuele velden');
    return {
      signal: {
        temperature: data.current.temperature_2m,
        windSpeed: data.current.wind_speed_10m,
        visibilityMeters: data.current.visibility,
        weatherCode: data.current.weather_code,
        sunrise: data.daily?.sunrise?.[0] ?? '', sunset: data.daily?.sunset?.[0] ?? '',
        observedAt: data.current.time,
      },
      receipt: { id: 'open-meteo', name: 'Open-Meteo', state: 'live', detail: 'Weer, zicht en licht opgehaald', url: 'https://open-meteo.com/' },
    };
  } catch (error) {
    return { receipt: { id: 'open-meteo', name: 'Open-Meteo', state: 'error', detail: error instanceof Error ? error.message : 'Bron niet bereikbaar', url: 'https://open-meteo.com/' } };
  }
}

async function loadBirds(coordinates: Coordinates): Promise<{ observations: BirdObservation[]; receipt: SourceReceipt }> {
  const token = process.env.EXPO_PUBLIC_EBIRD_API_KEY;
  if (!token) return { observations: [], receipt: { id: 'ebird', name: 'eBird', state: 'not-configured', detail: 'API-token nog niet ingesteld', url: 'https://ebird.org/data/download' } };
  const params = new URLSearchParams({ lat: String(coordinates.latitude), lng: String(coordinates.longitude), dist: '35', back: '2', maxResults: '25' });
  const url = `https://api.ebird.org/v2/data/obs/geo/recent/notable?${params.toString()}`;
  try {
    const response = await safeFetch(url, { headers: { 'X-eBirdApiToken': token } });
    const raw = await response.json() as EbirdObservation[];
    const observations = raw.flatMap<BirdObservation>((item) => {
      if (!item.comName || !item.sciName || !item.obsDt || typeof item.lat !== 'number' || typeof item.lng !== 'number' || !item.locName || !item.locId) return [];
      return [{
        commonName: item.comName, scientificName: item.sciName, observedAt: item.obsDt,
        latitude: item.lat, longitude: item.lng, locationName: item.locName, locationId: item.locId,
        publicLocation: item.locationPrivate !== true && item.locId.startsWith('L'),
      }];
    });
    return { observations, receipt: { id: 'ebird', name: 'eBird', state: 'live', detail: `${observations.length} recente openbare meldingen beoordeeld`, url: 'https://ebird.org/' } };
  } catch (error) {
    return { observations: [], receipt: { id: 'ebird', name: 'eBird', state: 'error', detail: error instanceof Error ? error.message : 'Bron niet bereikbaar', url: 'https://ebird.org/' } };
  }
}

export async function loadLiveWorld(coordinates: Coordinates, regionLabel: string): Promise<LiveWorldSnapshot> {
  const [weather, birds] = await Promise.all([loadWeather(coordinates), loadBirds(coordinates)]);
  return {
    regionLabel, coordinates, retrievedAt: new Date().toISOString(), weather: weather.signal,
    birdObservations: birds.observations, sources: [weather.receipt, birds.receipt],
  };
}

const weatherSuitableForOutside = (weather?: WeatherSignal) =>
  Boolean(weather && weather.windSpeed <= 35 && weather.visibilityMeters >= 3000 && ![65, 66, 67, 75, 77, 82, 85, 86, 95, 96, 99].includes(weather.weatherCode));

const formatClock = (value: string) => value ? new Date(value).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : 'onbekend';

export function composeLiveExperience(snapshot: LiveWorldSnapshot, context: PrototypeContext): Experience | undefined {
  if (!weatherSuitableForOutside(snapshot.weather)) return undefined;
  const base = byId('wadden-light');
  const bird = snapshot.birdObservations.find((item) => item.publicLocation);
  const weather = snapshot.weather!;
  const retrievedAt = snapshot.retrievedAt;
  const evidence: LiveEvidence[] = [
    { label: `${weather.temperature}°C · wind ${Math.round(weather.windSpeed)} km/u · zicht ${Math.round(weather.visibilityMeters / 1000)} km`, sourceName: 'Open-Meteo', sourceUrl: 'https://open-meteo.com/', observedAt: weather.observedAt, retrievedAt, expiresAt: isoInHours(2), certainty: 'forecast' },
  ];
  const routePlan: RoutePlan = {
    mode: 'walking', destinationName: bird?.locationName ?? `natuurgebied bij ${snapshot.regionLabel}`,
    destination: bird ? { latitude: bird.latitude, longitude: bird.longitude } : undefined,
    source: snapshot.coordinates, outboundMinutes: 15, experienceMinutes: Math.max(15, Math.min(35, context.availableMinutes - 40)),
    returnMinutes: 15, bufferMinutes: 5,
    natureGuard: bird ? 'Openbare bronlocatie; blijf op openbare paden en zoek nooit naar een nest.' : 'Kaarten zoekt een openbaar natuurgebied; controleer toegang en omstandigheden voor vertrek.',
  };
  if (bird) evidence.unshift({ label: `${bird.commonName} gemeld bij ${bird.locationName}`, sourceName: 'eBird', sourceUrl: 'https://ebird.org/', observedAt: bird.observedAt, retrievedAt, expiresAt: isoInHours(12), certainty: 'observation' });

  return {
    ...base,
    id: bird ? `live-bird-${bird.locationId}` : 'live-light-window',
    title: bird ? `${bird.commonName} boven het noorden?` : 'Een helder buitenvenster',
    promise: bird
      ? `Onlangs is bij ${bird.locationName} een ${bird.commonName.toLowerCase()} gemeld. Deze wandeling blijft ook zonder waarneming de moeite waard.`
      : `Het zicht is ongeveer ${Math.round(weather.visibilityMeters / 1000)} kilometer en de wind blijft bruikbaar. Een route naar buiten past in dit moment.`,
    wonder: bird
      ? `Een waarneming is geen garantie. De route brengt je naar een openbare bronlocatie en laat genoeg ruimte om gewoon van het landschap te genieten.`
      : `De zon gaat rond ${formatClock(weather.sunset)} onder. Momentum gebruikt dit als mogelijkheid, niet als belofte.`,
    duration: routePlan.outboundMinutes + routePlan.experienceMinutes + routePlan.returnMinutes + routePlan.bufferMinutes,
    distance: bird ? `route naar ${bird.locationName}` : 'route wordt in Kaarten bepaald',
    timeWindow: `voor zonsondergang ${formatClock(weather.sunset)}`,
    why: [bird ? 'recente openbare natuurwaarneming' : 'actueel zicht en bruikbare wind', 'past binnen de gekozen tijd', 'route en terugkeerbuffer voorbereid'],
    prepare: bird ? ['Verrekijker', 'Water en passende kleding', 'Blijf op openbare paden', 'Waarneming is niet gegarandeerd'] : ['Water en passende kleding', 'Controleer toegang in Kaarten', 'Blijf op openbare paden', 'Vertrek alleen als omstandigheden goed voelen'],
    steps: [
      { title: 'Controleer het routevoorstel', instruction: routePlan.natureGuard, meta: `${routePlan.outboundMinutes} min heen · ${routePlan.bufferMinutes} min buffer` },
      { title: 'Laat Kaarten navigeren', instruction: 'Momentum geeft bestemming en vervoerswijze door. Apple Maps berekent de daadwerkelijke begaanbare route.' },
      { title: 'Laat de waarneming los', instruction: bird ? `Kijk rustig vanuit de openbare omgeving. De ${bird.commonName.toLowerCase()} kan alweer weg zijn.` : 'Kijk naar wat er nu wél is: licht, landschap, geluid en ruimte.' },
      { title: 'Keer met buffer terug', instruction: 'Verander het plan wanneer weer, toegang of veiligheid anders blijkt dan verwacht.' },
    ],
    liveEvidence: evidence, routePlan,
  };
}

export const futureSourceRegistry = [
  { id: 'tides', label: 'Getijden', state: 'planned' },
  { id: 'seasonal-nature', label: 'Bloei, trek en seizoenen', state: 'planned' },
  { id: 'events', label: 'Evenementen, markten en cultuur', state: 'planned' },
  { id: 'opening-hours', label: 'Openingstijden', state: 'planned' },
  { id: 'crowds', label: 'Drukte', state: 'planned' },
  { id: 'closures', label: 'Weg- en gebiedsafsluitingen', state: 'planned' },
] as const;
