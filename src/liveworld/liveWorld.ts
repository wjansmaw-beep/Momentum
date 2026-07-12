import { byId, Experience, LiveEvidence, RoutePlan } from '../product/experienceModel';
import { PrototypeContext } from '../product/localIntelligence';

declare const process: { env: { EXPO_PUBLIC_EBIRD_API_KEY?: string } };

export type Coordinates = { latitude: number; longitude: number };
export type SourceState = 'live' | 'loading' | 'not-configured' | 'error';
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

export type MarineSignal = {
  waveHeight: number;
  wavePeriod: number;
  seaLevelHeight: number;
  currentVelocity: number;
  currentDirection: number;
  trend: 'rising' | 'falling' | 'steady' | 'unknown';
  observedAt: string;
  modelLocation: Coordinates;
};

export type OpeningState = 'open' | 'closed' | 'unknown';
export type NearbyPlace = {
  id: string; name: string; kind: 'cafe' | 'library' | 'museum' | 'gallery' | 'viewpoint' | 'park' | 'community';
  latitude: number; longitude: number; openingHours?: string; openingState: OpeningState; openingNote: string;
};
export type AirQualitySignal = {
  europeanAqi: number; category: 'good' | 'fair' | 'moderate' | 'poor' | 'very-poor';
  pm25: number; pollenPeak?: { type: string; grainsPerM3: number }; observedAt: string;
};

export type LiveWorldSnapshot = {
  regionLabel: string;
  coordinates: Coordinates;
  retrievedAt: string;
  weather?: WeatherSignal;
  marine?: MarineSignal;
  airQuality?: AirQualitySignal;
  birdObservations: BirdObservation[];
  nearbyPlaces: NearbyPlace[];
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

type MarineResponse = {
  latitude?: number; longitude?: number;
  current?: { time: string; wave_height?: number; wave_period?: number; sea_level_height_msl?: number; ocean_current_velocity?: number; ocean_current_direction?: number };
  hourly?: { time?: string[]; sea_level_height_msl?: Array<number | null> };
};

type AirQualityResponse = { current?: { time: string; european_aqi?: number; pm2_5?: number; alder_pollen?: number; birch_pollen?: number; grass_pollen?: number; mugwort_pollen?: number; ragweed_pollen?: number } };
type OverpassElement = { id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
type OverpassResponse = { elements?: OverpassElement[] };

const isoInHours = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
const safeFetch = async (url: string, init?: RequestInit, timeoutMs = 12000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
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

const inNorthernCoastalPilot = (coordinates: Coordinates) => coordinates.latitude >= 52.9 && coordinates.latitude <= 53.7 && coordinates.longitude >= 4.5 && coordinates.longitude <= 7.5;

async function loadMarine(coordinates: Coordinates): Promise<{ signal?: MarineSignal; receipt: SourceReceipt }> {
  if (!inNorthernCoastalPilot(coordinates)) return { receipt: { id: 'open-meteo-marine', name: 'Open-Meteo Marine', state: 'not-configured', detail: 'Buiten de noordelijke kustproefregio', url: 'https://open-meteo.com/en/docs/marine-weather-api' } };
  // Bounded public-water reference near the Wadden coast; never an inferred wildlife location.
  const modelPoint = { latitude: 53.45, longitude: 6.1 };
  const params = new URLSearchParams({
    latitude: String(modelPoint.latitude), longitude: String(modelPoint.longitude),
    current: 'wave_height,wave_period,sea_level_height_msl,ocean_current_velocity,ocean_current_direction',
    hourly: 'sea_level_height_msl', forecast_hours: '6', timezone: 'auto', cell_selection: 'sea',
  });
  const url = `https://marine-api.open-meteo.com/v1/marine?${params.toString()}`;
  try {
    const response = await safeFetch(url);
    const data = await response.json() as MarineResponse;
    const current = data.current;
    if (!current || typeof current.wave_height !== 'number' || typeof current.sea_level_height_msl !== 'number') throw new Error('Geen bruikbaar marien modelpunt');
    const levels = (data.hourly?.sea_level_height_msl ?? []).filter((value): value is number => typeof value === 'number');
    const delta = levels.length >= 2 ? levels[Math.min(2, levels.length - 1)] - levels[0] : 0;
    const trend: MarineSignal['trend'] = levels.length < 2 ? 'unknown' : delta > 0.05 ? 'rising' : delta < -0.05 ? 'falling' : 'steady';
    return {
      signal: {
        waveHeight: current.wave_height, wavePeriod: current.wave_period ?? 0,
        seaLevelHeight: current.sea_level_height_msl,
        currentVelocity: current.ocean_current_velocity ?? 0,
        currentDirection: current.ocean_current_direction ?? 0,
        trend, observedAt: current.time,
        modelLocation: { latitude: data.latitude ?? modelPoint.latitude, longitude: data.longitude ?? modelPoint.longitude },
      },
      receipt: { id: 'open-meteo-marine', name: 'Open-Meteo Marine', state: 'live', detail: 'Golf, stroming en modelwaterstand opgehaald', url: 'https://open-meteo.com/en/docs/marine-weather-api' },
    };
  } catch (error) {
    return { receipt: { id: 'open-meteo-marine', name: 'Open-Meteo Marine', state: 'error', detail: error instanceof Error ? error.message : 'Marien model niet bereikbaar', url: 'https://open-meteo.com/en/docs/marine-weather-api' } };
  }
}

const dayIndex: Record<string, number> = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };
const dayMatches = (day: number, start: string, end?: string) => {
  const first = dayIndex[start]; const last = end ? dayIndex[end] : first;
  return first <= last ? day >= first && day <= last : day >= first || day <= last;
};

export function interpretSimpleOpeningHours(value: string | undefined, now = new Date()): { state: OpeningState; note: string } {
  if (!value) return { state: 'unknown', note: 'Geen openingstijden in OpenStreetMap' };
  if (value.trim() === '24/7') return { state: 'open', note: 'Volgens OpenStreetMap 24 uur toegankelijk' };
  const segments = value.split(';').map((item) => item.trim());
  let understoodToday = false;
  for (const segment of segments) {
    const match = segment.match(/^(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?\s+(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
    if (!match || !dayMatches(now.getDay(), match[1], match[2])) continue;
    understoodToday = true;
    const start = Number(match[3]) * 60 + Number(match[4]); const end = Number(match[5]) * 60 + Number(match[6]);
    if (end < start) return { state: 'unknown', note: 'Openingstijd loopt over middernacht; controleer bij de locatie' };
    const minute = now.getHours() * 60 + now.getMinutes();
    if (minute >= start && minute < end) return { state: 'open', note: `Volgens eenvoudige OSM-tijden open tot ${match[5]}:${match[6]}` };
  }
  return understoodToday ? { state: 'closed', note: 'Volgens eenvoudige OSM-tijden nu gesloten' } : { state: 'unknown', note: 'Complexe openingstijden; controleer bij de locatie' };
}

async function loadNearbyPlaces(coordinates: Coordinates): Promise<{ places: NearbyPlace[]; receipt: SourceReceipt }> {
  const query = `[out:json][timeout:8];(node(around:3500,${coordinates.latitude},${coordinates.longitude})[name][opening_hours][amenity~"^(cafe|library|community_centre)$"];node(around:3500,${coordinates.latitude},${coordinates.longitude})[name][opening_hours][tourism~"^(museum|gallery|viewpoint)$"];node(around:3500,${coordinates.latitude},${coordinates.longitude})[name][opening_hours][leisure=park];);out body 15;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  try {
    const response = await safeFetch(url, { headers: { Accept: 'application/json' } }, 12000);
    const data = await response.json() as OverpassResponse;
    const places = (data.elements ?? []).flatMap<NearbyPlace>((element) => {
      const tags = element.tags; const latitude = element.lat ?? element.center?.lat; const longitude = element.lon ?? element.center?.lon;
      if (!tags?.name || typeof latitude !== 'number' || typeof longitude !== 'number') return [];
      const rawKind = tags.amenity ?? tags.tourism ?? tags.leisure;
      const kind: NearbyPlace['kind'] = rawKind === 'community_centre' ? 'community' : rawKind as NearbyPlace['kind'];
      if (!['cafe', 'library', 'museum', 'gallery', 'viewpoint', 'park', 'community'].includes(kind)) return [];
      const opening = interpretSimpleOpeningHours(tags.opening_hours);
      return [{ id: `osm-${element.id}`, name: tags.name, kind, latitude, longitude, openingHours: tags.opening_hours, openingState: opening.state, openingNote: opening.note }];
    });
    return { places, receipt: { id: 'openstreetmap-places', name: 'OpenStreetMap', state: 'live', detail: `${places.length} openbare plekken met haalbaarheidsdata beoordeeld`, url: 'https://www.openstreetmap.org/copyright' } };
  } catch (error) {
    return { places: [], receipt: { id: 'openstreetmap-places', name: 'OpenStreetMap', state: 'error', detail: error instanceof Error ? error.message : 'Plaatsenbron niet bereikbaar', url: 'https://www.openstreetmap.org/copyright' } };
  }
}

async function loadAirQuality(coordinates: Coordinates): Promise<{ signal?: AirQualitySignal; receipt: SourceReceipt }> {
  const params = new URLSearchParams({ latitude: String(coordinates.latitude), longitude: String(coordinates.longitude), current: 'european_aqi,pm2_5,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,ragweed_pollen', domains: 'cams_europe', timezone: 'auto' });
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
  try {
    const response = await safeFetch(url); const data = await response.json() as AirQualityResponse; const current = data.current;
    if (!current || typeof current.european_aqi !== 'number') throw new Error('Geen actuele Europese luchtindex');
    const category: AirQualitySignal['category'] = current.european_aqi <= 20 ? 'good' : current.european_aqi <= 40 ? 'fair' : current.european_aqi <= 60 ? 'moderate' : current.european_aqi <= 80 ? 'poor' : 'very-poor';
    const pollen = [['els', current.alder_pollen], ['berk', current.birch_pollen], ['gras', current.grass_pollen], ['bijvoet', current.mugwort_pollen], ['ambrosia', current.ragweed_pollen]] as Array<[string, number | undefined]>;
    const peak = pollen.filter((item): item is [string, number] => typeof item[1] === 'number').sort((a, b) => b[1] - a[1])[0];
    return { signal: { europeanAqi: current.european_aqi, category, pm25: current.pm2_5 ?? 0, pollenPeak: peak && peak[1] > 0 ? { type: peak[0], grainsPerM3: peak[1] } : undefined, observedAt: current.time }, receipt: { id: 'open-meteo-air', name: 'Open-Meteo Air Quality', state: 'live', detail: 'Europese luchtindex en seizoenspollen opgehaald', url: 'https://open-meteo.com/en/docs/air-quality-api' } };
  } catch (error) {
    return { receipt: { id: 'open-meteo-air', name: 'Open-Meteo Air Quality', state: 'error', detail: error instanceof Error ? error.message : 'Luchtkwaliteitsmodel niet bereikbaar', url: 'https://open-meteo.com/en/docs/air-quality-api' } };
  }
}

export async function loadLiveWorld(coordinates: Coordinates, regionLabel: string): Promise<LiveWorldSnapshot> {
  const [weather, birds, marine, air] = await Promise.all([loadWeather(coordinates), loadBirds(coordinates), loadMarine(coordinates), loadAirQuality(coordinates)]);
  return {
    regionLabel, coordinates, retrievedAt: new Date().toISOString(), weather: weather.signal, marine: marine.signal, airQuality: air.signal,
    birdObservations: birds.observations, nearbyPlaces: [], sources: [weather.receipt, marine.receipt, air.receipt, { id: 'openstreetmap-places', name: 'OpenStreetMap', state: 'loading', detail: 'Nabije plaatsen worden op de achtergrond beoordeeld', url: 'https://www.openstreetmap.org/copyright' }, birds.receipt],
  };
}

export async function loadPlaceContext(snapshot: LiveWorldSnapshot): Promise<LiveWorldSnapshot> {
  const places = await loadNearbyPlaces(snapshot.coordinates);
  return {
    ...snapshot,
    nearbyPlaces: places.places,
    sources: snapshot.sources.map((source) => source.id === places.receipt.id ? places.receipt : source),
  };
}

const weatherSuitableForOutside = (weather?: WeatherSignal) =>
  Boolean(weather && weather.windSpeed <= 35 && weather.visibilityMeters >= 3000 && ![65, 66, 67, 75, 77, 82, 85, 86, 95, 96, 99].includes(weather.weatherCode));

const formatClock = (value: string) => value ? new Date(value).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : 'onbekend';

export function composeLiveExperience(snapshot: LiveWorldSnapshot, context: PrototypeContext): Experience | undefined {
  if (!weatherSuitableForOutside(snapshot.weather) || (snapshot.airQuality?.europeanAqi ?? 0) > 80) return undefined;
  const base = byId('wadden-light');
  const bird = snapshot.birdObservations.find((item) => item.publicLocation);
  const weather = snapshot.weather!;
  const marine = snapshot.marine;
  const retrievedAt = snapshot.retrievedAt;
  const evidence: LiveEvidence[] = [
    { label: `${weather.temperature}°C · wind ${Math.round(weather.windSpeed)} km/u · zicht ${Math.round(weather.visibilityMeters / 1000)} km`, sourceName: 'Open-Meteo', sourceUrl: 'https://open-meteo.com/', observedAt: weather.observedAt, retrievedAt, expiresAt: isoInHours(2), certainty: 'forecast' },
  ];
  if (marine) evidence.push({ label: `Modelwaterstand ${marine.trend === 'rising' ? 'stijgend' : marine.trend === 'falling' ? 'dalend' : marine.trend === 'steady' ? 'vrijwel gelijk' : 'onbekend'} · golf ${marine.waveHeight.toFixed(1)} m`, sourceName: 'Open-Meteo Marine', sourceUrl: 'https://open-meteo.com/en/docs/marine-weather-api', observedAt: marine.observedAt, retrievedAt, expiresAt: isoInHours(3), certainty: 'forecast' });
  if (snapshot.airQuality) {
    const airLabel = { good: 'goed', fair: 'redelijk', moderate: 'matig', poor: 'slecht', 'very-poor': 'zeer slecht' }[snapshot.airQuality.category];
    evidence.push({ label: `Europese luchtindex ${Math.round(snapshot.airQuality.europeanAqi)} · ${airLabel}`, sourceName: 'Open-Meteo Air Quality', sourceUrl: 'https://open-meteo.com/en/docs/air-quality-api', observedAt: snapshot.airQuality.observedAt, retrievedAt, expiresAt: isoInHours(6), certainty: 'forecast' });
  }
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
    why: [bird ? 'recente openbare natuurwaarneming' : 'actueel zicht en bruikbare wind', marine ? 'marien model als extra kustcontext' : 'past binnen de gekozen tijd', 'route en terugkeerbuffer voorbereid'],
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

const distanceKm = (a: Coordinates, b: Coordinates) => {
  const rad = (value: number) => value * Math.PI / 180; const earth = 6371;
  const dLat = rad(b.latitude - a.latitude); const dLon = rad(b.longitude - a.longitude);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

export function composeNearbyPlaceExperience(snapshot: LiveWorldSnapshot, context: PrototypeContext): Experience | undefined {
  if (context.availableMinutes < 45) return undefined;
  const place = snapshot.nearbyPlaces.filter((item) => item.openingState === 'open').sort((a, b) => distanceKm(snapshot.coordinates, a) - distanceKm(snapshot.coordinates, b))[0];
  if (!place) return undefined;
  const routeDistance = distanceKm(snapshot.coordinates, place);
  const outbound = Math.max(5, Math.min(20, Math.ceil(routeDistance * 4)));
  const experienceMinutes = Math.max(15, Math.min(45, context.availableMinutes - outbound * 2 - 5));
  if (experienceMinutes < 15) return undefined;
  const base = ['viewpoint', 'park'].includes(place.kind) ? byId('wadden-light') : byId('small-reading');
  const kind: Experience['kind'] = place.kind === 'cafe' ? 'food' : ['museum', 'gallery'].includes(place.kind) ? 'culture' : place.kind === 'community' ? 'connect' : place.kind === 'library' ? 'learn' : 'outside';
  const promise = place.kind === 'cafe' ? `Een korte onderbreking op een plek die volgens eenvoudige openbare tijden nu open is.`
    : ['museum', 'gallery'].includes(place.kind) ? `Laat één lokaal verhaal of beeld je middag een andere richting geven.`
      : place.kind === 'library' ? `Geef jezelf één goed idee op een plek waar je niet eindeloos hoeft te zoeken.`
        : `Een openbare plek dichtbij die ruimte geeft om even anders te kijken.`;
  const routePlan: RoutePlan = {
    mode: 'walking', destinationName: place.name, destination: { latitude: place.latitude, longitude: place.longitude }, source: snapshot.coordinates,
    outboundMinutes: outbound, experienceMinutes, returnMinutes: outbound, bufferMinutes: 5,
    natureGuard: 'OpenStreetMap-informatie kan verouderd zijn. Controleer bij aankomst lokale toegang, borden en actuele opening.',
  };
  return {
    ...base, id: `live-place-${place.id}`, kind, title: `Even naar ${place.name}`, promise,
    wonder: `${place.name} ligt op ongeveer ${routeDistance.toFixed(1)} kilometer. Momentum heeft reistijd en een terugkeerbuffer al meegerekend.`,
    duration: outbound * 2 + experienceMinutes + 5, distance: `${routeDistance.toFixed(1)} km`, timeWindow: 'volgens eenvoudige openbare openingstijden nu mogelijk', effort: 'Rustig',
    company: ['solo', 'together', 'family'], cta: 'Ga naar deze plek',
    why: ['volgens eenvoudige OSM-tijden nu open', 'dichtbij genoeg voor je beschikbare tijd', 'route en terugkeerbuffer voorbereid'],
    prepare: ['Controleer de actuele opening bij de locatie', 'Neem alleen mee wat je al nodig hebt', 'Laat Kaarten de route controleren'],
    steps: [
      { title: 'Controleer de plek', instruction: `${place.openingNote}. OpenStreetMap kan achterlopen; lokale informatie gaat altijd voor.` },
      { title: 'Laat Kaarten navigeren', instruction: 'Momentum geeft alleen de bestemming door. Kaarten bepaalt de actuele route.' },
      { title: 'Kies één ervaring', instruction: 'Je hoeft niet alles te zien of te doen. Eén gesprek, beeld, smaak of detail is genoeg.' },
      { title: 'Ga op tijd terug', instruction: 'Bescherm je terugkeerbuffer en verander het plan als toegang of opening anders blijkt.' },
    ],
    memoryPrompt: `Wat maakte ${place.name} de moeite waard?`,
    liveEvidence: [{ label: `${place.name} · ${place.openingNote}`, sourceName: 'OpenStreetMap', sourceUrl: 'https://www.openstreetmap.org/copyright', observedAt: snapshot.retrievedAt, retrievedAt: snapshot.retrievedAt, expiresAt: isoInHours(6), certainty: 'observation' }],
    routePlan,
  };
}

export const futureSourceRegistry = [
  { id: 'tides', label: 'Officiële lokale getijdenstations', state: 'planned' },
  { id: 'seasonal-nature', label: 'Bloei, trek en seizoenen', state: 'planned' },
  { id: 'events', label: 'Evenementen, markten en cultuur', state: 'planned' },
  { id: 'verified-openings', label: 'Rechtstreeks geverifieerde openingstijden', state: 'planned' },
  { id: 'crowds', label: 'Drukte', state: 'planned' },
  { id: 'closures', label: 'Weg- en gebiedsafsluitingen', state: 'planned' },
] as const;
