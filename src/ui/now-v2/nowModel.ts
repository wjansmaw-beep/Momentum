import { Experience } from '../../product/experienceModel';
import { LocalDecision } from '../../product/localIntelligence';
import { Coordinates, WeatherSignal } from '../../liveworld/liveWorld';

// Domeinmodel voor het Nu-scherm volgens concept v2 (ADR-067, fase R1).
// Pure functies zonder React Native — volledig deterministisch en daardoor
// los testbaar. De concrete-copy doctrine is leidend: elke regel die hieruit
// komt benoemt een feit (tijd, afstand, wind, droogte) — nooit een belofte
// of een poëtische formulering.

export type SunSource = 'live' | 'approx';
export type SunTimes = { sunrise: Date; sunset: Date; source: SunSource };

const rad = Math.PI / 180;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Kloktijd "20:15" in lokale tijd, nl-NL. */
export const formatClock = (date: Date) =>
  date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

/** "1U 07M" of "12 M" — hoofdletters voor de live-badge. */
export function formatCountdown(from: Date, to: Date): string {
  const minutes = Math.max(0, Math.round((to.getTime() - from.getTime()) / 60000));
  if (minutes >= 60) return `${Math.floor(minutes / 60)}U ${String(minutes % 60).padStart(2, '0')}M`;
  return `${minutes} M`;
}

/** Begroeting per dagdeel (persoonlijke aanhef blijft, ADR-067 §1). */
export function greetingForHour(hour: number): string {
  if (hour < 5) return 'Goedenacht';
  if (hour < 12) return 'Goedemorgen';
  if (hour < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

/** "Vrijdag 24 juli" — eerste letter hoofdletter. */
export function formatLongDate(date: Date): string {
  const value = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** km/u → Beaufort (standaard grenzen). */
export function beaufort(kmh: number): number {
  const thresholds = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117];
  return thresholds.filter((limit) => kmh >= limit).length;
}

const windWord = (bft: number) => (bft <= 2 ? 'zacht' : bft <= 4 ? 'voelbaar' : bft <= 6 ? 'stevig' : 'hard');

// Weercodes (WMO, Open-Meteo): alles met neerslag of onweer.
const PRECIP_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99];
export const isDryCode = (code: number) => !PRECIP_CODES.includes(code);

/** Kort, concreet neerslagwoord voor de reden-tegel. */
export function precipWord(code: number): string {
  if ([51, 53, 55].includes(code)) return 'Motregen';
  if ([56, 57, 66, 67].includes(code)) return 'IJzel';
  if ([61, 63].includes(code)) return 'Regen';
  if (code === 65) return 'Zware regen';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Sneeuw';
  if ([80, 81, 82].includes(code)) return 'Buien';
  if ([95, 96, 99].includes(code)) return 'Onweer';
  return 'Neerslag';
}

const dayOfYear = (date: Date) =>
  Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 86400000);

function sunTimeUtc(date: Date, latitude: number, longitude: number, rising: boolean): number {
  // NOAA-benadering (zenith 90,833°) — decimale UT-uren terug.
  const day = dayOfYear(date);
  const lngHour = longitude / 15;
  const t = day + ((rising ? 6 : 18) - lngHour) / 24;
  const meanAnomaly = 0.9856 * t - 3.289;
  let trueLongitude = meanAnomaly + 1.916 * Math.sin(meanAnomaly * rad) + 0.020 * Math.sin(2 * meanAnomaly * rad) + 282.634;
  trueLongitude = ((trueLongitude % 360) + 360) % 360;
  let rightAscension = Math.atan(0.91764 * Math.tan(trueLongitude * rad)) / rad;
  rightAscension = ((rightAscension % 360) + 360) % 360;
  rightAscension = (rightAscension + Math.floor(trueLongitude / 90) * 90 - Math.floor(rightAscension / 90) * 90) / 15;
  const sinDec = 0.39782 * Math.sin(trueLongitude * rad);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH = (Math.cos(90.833 * rad) - sinDec * Math.sin(latitude * rad)) / (cosDec * Math.cos(latitude * rad));
  const hourAngle = (rising ? 360 - Math.acos(clamp(cosH, -1, 1)) / rad : Math.acos(clamp(cosH, -1, 1)) / rad) / 15;
  const localMean = hourAngle + rightAscension - 0.06571 * t - 6.622;
  return ((localMean - lngHour) % 24 + 24) % 24;
}

/**
 * Zon op/onder als er geen live weersdata is: deterministisch uit datum en
 * coördinaten (NOAA-benadering, typisch binnen enkele minuten van de bron).
 */
export function approximateSunTimes(date: Date, coordinates: Coordinates): SunTimes {
  const offsetHours = -date.getTimezoneOffset() / 60;
  const toLocal = (utcHours: number) => {
    const local = ((utcHours + offsetHours) % 24 + 24) % 24;
    const result = new Date(date);
    result.setHours(Math.floor(local), Math.round((local % 1) * 60), 0, 0);
    return result;
  };
  return {
    sunrise: toLocal(sunTimeUtc(date, coordinates.latitude, coordinates.longitude, true)),
    sunset: toLocal(sunTimeUtc(date, coordinates.latitude, coordinates.longitude, false)),
    source: 'approx',
  };
}

/** Live zontijden uit de weersignalen; anders de deterministische benadering. */
export function resolveSunTimes(weather: WeatherSignal | undefined, coordinates: Coordinates, now: Date): SunTimes {
  if (weather?.sunrise && weather?.sunset) {
    const sunrise = new Date(weather.sunrise);
    const sunset = new Date(weather.sunset);
    if (Number.isFinite(sunrise.getTime()) && Number.isFinite(sunset.getTime()) && sunset.getTime() > sunrise.getTime()) {
      return { sunrise, sunset, source: 'live' };
    }
  }
  return approximateSunTimes(now, coordinates);
}

/** Gouden uur: het laatste uur voor zonsondergang; het pieklicht valt kort voor de zonsondergang zelf. */
export function goldenWindow(sun: SunTimes): { start: Date; peak: Date } {
  return {
    start: new Date(sun.sunset.getTime() - 55 * 60000),
    peak: new Date(sun.sunset.getTime() - 15 * 60000),
  };
}

export type LiveBadge = { label: string; pulse: boolean };

/** De live-badge op de hero: altijd een feit over licht en tijd, nooit sfeertaal. */
export function liveBadge(now: Date, sun: SunTimes): LiveBadge {
  const golden = goldenWindow(sun);
  if (now.getTime() < sun.sunrise.getTime()) return { label: `ZON OP OM ${formatClock(sun.sunrise)}`, pulse: false };
  if (now.getTime() < golden.start.getTime()) {
    return golden.start.getTime() - now.getTime() <= 3 * 3600000
      ? { label: `GOUDEN UUR OVER ${formatCountdown(now, golden.start)}`, pulse: true }
      : { label: `ZON ONDER OM ${formatClock(sun.sunset)}`, pulse: false };
  }
  if (now.getTime() < sun.sunset.getTime()) return { label: `GOUDEN UUR LOOPT · TOT ${formatClock(sun.sunset)}`, pulse: true };
  return { label: `ZON ONDER OM ${formatClock(sun.sunset)}`, pulse: false };
}

/**
 * Fit-percentage voor de match-ring. De ring legt fit uit (ADR-067 §6) — dit
 * is geen score, ranking of prestatie: een verzadigende, begrensde afbeelding
 * van de interne ranking-score zodat het getal rustig tussen ~55 en 97 blijft.
 */
export function fitPercent(score: number | undefined): number {
  const safe = Number.isFinite(score) ? (score as number) : 40;
  return Math.round(clamp(52 + 46 * (1 - Math.exp(-Math.max(0, safe) / 70)), 48, 97));
}

export type HeadlinePart = { text: string; accent?: boolean };

/**
 * De "waarom nu"-headline: één concrete zin. Met live weer: droogte, wind en
 * het eerstvolgende lichtmoment. Zonder live weer: de sterkste concrete reden
 * uit de bestaande ranking (ADR-065, punt 3 — zichtbare waarom-nu uit data).
 */
export function whyHeadline(now: Date, sun: SunTimes, weather: WeatherSignal | undefined, decision: LocalDecision): HeadlinePart[] {
  if (weather) {
    const dry = isDryCode(weather.weatherCode);
    const bft = beaufort(weather.windSpeed);
    const lead = dry ? 'Droog' : precipWord(weather.weatherCode);
    const golden = goldenWindow(sun);
    if (now.getTime() < sun.sunset.getTime() && golden.start.getTime() - now.getTime() <= 4 * 3600000) {
      return [
        { text: `${lead}, wind ${bft} bft en om ` },
        { text: formatClock(golden.peak), accent: true },
        { text: ' het gouden uur.' },
      ];
    }
    if (now.getTime() < sun.sunset.getTime()) {
      return [{ text: `${lead} en ${Math.round(weather.temperature)}° — zon onder om ` }, { text: formatClock(sun.sunset), accent: true }, { text: '.' }];
    }
    return [{ text: `${lead} en ${Math.round(weather.temperature)}° — zon op om ` }, { text: formatClock(sun.sunrise), accent: true }, { text: '.' }];
  }
  const reason = decision.selected?.reasons[0]?.text;
  if (reason) return [{ text: `${reason.charAt(0).toUpperCase()}${reason.slice(1)}.` }];
  return [{ text: 'Dit past binnen de ruimte die je nu hebt.' }];
}

export type ReasonTile = { icon: 'wind' | 'sun' | 'cloud-rain' | 'sunset' | 'sunrise' | 'moon' | 'check' | 'clock' | 'feather'; title: string; sub?: string };

/**
 * De drie reden-tegels. Met live weer: wind, droog/neerslag en licht — exact
 * de concept-tegels, gevuld uit de weersignalen. Zonder live weer: de
 * concrete redenen die de ranking al gaf (zichtbare waarom-nu, ADR-065).
 */
export function reasonTiles(now: Date, sun: SunTimes, weather: WeatherSignal | undefined, decision: LocalDecision, fallbackWhy: string[]): ReasonTile[] {
  if (weather) {
    const bft = beaufort(weather.windSpeed);
    const dry = isDryCode(weather.weatherCode);
    const observed = weather.observedAt && Number.isFinite(new Date(weather.observedAt).getTime()) ? `meting ${formatClock(new Date(weather.observedAt))}` : undefined;
    const golden = goldenWindow(sun);
    const light: ReasonTile = now.getTime() < sun.sunrise.getTime()
      ? { icon: 'sunrise', title: 'Zonsopkomst', sub: `om ${formatClock(sun.sunrise)}` }
      : now.getTime() < sun.sunset.getTime()
        ? { icon: 'sunset', title: 'Gouden uur', sub: `piek om ${formatClock(golden.peak)}` }
        : { icon: 'moon', title: 'Donker buiten', sub: `zon onder om ${formatClock(sun.sunset)}` };
    return [
      { icon: 'wind', title: `Wind ${bft} bft`, sub: `${Math.round(weather.windSpeed)} km/u · ${windWord(bft)}` },
      dry
        ? { icon: 'sun', title: 'Droog', sub: observed ? `geen neerslag · ${observed}` : 'geen neerslag gemeld' }
        : { icon: 'cloud-rain', title: precipWord(weather.weatherCode), sub: observed ? `neerslag · ${observed}` : 'neerslag gemeld' },
      light,
    ];
  }
  const reasons = decision.selected?.reasons.map((reason) => reason.text) ?? [];
  const source = reasons.length ? reasons : fallbackWhy;
  const icons: ReasonTile['icon'][] = ['check', 'clock', 'feather'];
  return source.slice(0, 3).map((text, index) => ({
    icon: icons[index] ?? 'check',
    title: `${text.charAt(0).toUpperCase()}${text.slice(1)}`,
  }));
}

export type LightCurveModel = {
  /** Genormaliseerde lichtsterkte 0..1 per sample, van nu tot +4 uur. */
  values: number[];
  /** Vier uurlabels onder de curve. */
  hourLabels: string[];
  /** Index van het piekpunt (voor de marker). */
  peakIndex: number;
  /** Label bij de piek, bijv. "piek 21:12". */
  peakLabel: string;
};

/**
 * Licht de komende uren: deterministisch uit het zonverloop (echte zontijden
 * als ze live zijn, anders de benadering). Vorm: een sinusboog tussen op en
 * onder, met een lineair afnemende schemerstaart na zonsondergang.
 */
export function lightCurveModel(now: Date, sun: SunTimes, samples = 25, spanHours = 4): LightCurveModel {
  const spanMs = spanHours * 3600000;
  const sunrise = sun.sunrise.getTime();
  const sunset = sun.sunset.getTime();
  const dayMs = Math.max(1, sunset - sunrise);
  const values: number[] = [];
  let peakIndex = 0;
  for (let index = 0; index < samples; index += 1) {
    const t = now.getTime() + (index / (samples - 1)) * spanMs;
    let value: number;
    if (t >= sunrise && t <= sunset) value = Math.sin(Math.PI * ((t - sunrise) / dayMs));
    else if (t > sunset) value = Math.max(0, 0.16 * (1 - (t - sunset) / (50 * 60000)));
    else value = Math.max(0, 0.16 * (1 - (sunrise - t) / (50 * 60000)));
    // 's Avonds is het kwaliteitslicht (gouden uur) het verhaal; til de piek
    // richting het laatste uur zodat de curve het concept volgt.
    const goldenBoost = t >= sunset - 60 * 60000 && t <= sunset ? 0.18 : 0;
    const clamped = clamp(value ** 0.85 + goldenBoost, 0.02, 1);
    values.push(clamped);
    if (clamped > values[peakIndex]) peakIndex = index;
  }
  const hourLabels: string[] = [];
  const firstHour = new Date(now);
  firstHour.setMinutes(0, 0, 0);
  if (firstHour.getTime() < now.getTime()) firstHour.setHours(firstHour.getHours() + 1);
  for (let step = 0; step < 4; step += 1) {
    const label = new Date(firstHour);
    label.setHours(firstHour.getHours() + step);
    hourLabels.push(formatClock(label));
  }
  const golden = goldenWindow(sun);
  const goldenInSpan = golden.peak.getTime() >= now.getTime() && golden.peak.getTime() <= now.getTime() + spanMs;
  return {
    values,
    hourLabels,
    peakIndex,
    peakLabel: goldenInSpan ? `piek ${formatClock(golden.peak)}` : `zon onder ${formatClock(sun.sunset)}`,
  };
}

export type StartSuggestion = { start: Date; end: Date; subline: string };

/**
 * Concrete starttijd voor de primaire CTA. Start = over ±10 minuten, afgerond
 * op 5 minuten. De subregel zegt wat dat oplevert: het gouden uur meelopen
 * als dat binnen het moment valt, anders de concrete eindtijd.
 */
export function suggestedStart(now: Date, durationMinutes: number, sun: SunTimes): StartSuggestion {
  const earliest = now.getTime() + 9 * 60000;
  const rounded = Math.ceil(earliest / (5 * 60000)) * (5 * 60000);
  const start = new Date(rounded);
  const end = new Date(rounded + durationMinutes * 60000);
  const golden = goldenWindow(sun);
  const goldenInWalk = golden.peak.getTime() >= start.getTime() + 15 * 60000
    && golden.peak.getTime() <= end.getTime() + 45 * 60000
    && now.getTime() < sun.sunset.getTime();
  return {
    start,
    end,
    subline: goldenInWalk
      ? 'dan loop je het gouden uur mee'
      : `${durationMinutes} min · rond ${formatClock(end)} klaar`,
  };
}

const geoDistanceKm = (a: Coordinates, b: Coordinates) => {
  const earth = 6371;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const dutchDecimal = (value: number, digits = 1) => value.toFixed(digits).replace('.', ',');

/** Plaatsregel op de foto: bestemming + afstand, of de eerlijke fallback. */
export function placeLine(experience: Experience, region: string, here?: Coordinates): string {
  const place = experience.routePlan?.destinationName ?? experience.placeKnowledge?.title ?? region;
  const destination = experience.routePlan?.destination;
  if (destination && here) {
    return `${place} · ${dutchDecimal(geoDistanceKm(here, destination))} km van hier`;
  }
  if (experience.distance) return `${place} · ${experience.distance}`;
  return `${place} · dichtbij`;
}

/** Feitenrij op de foto: duur · afstand/bereik · wind (of inspanning zonder live weer). */
export function heroFacts(experience: Experience, weather: WeatherSignal | undefined, here?: Coordinates): Array<{ icon: 'clock' | 'navigation' | 'wind' | 'activity'; text: string }> {
  const facts: Array<{ icon: 'clock' | 'navigation' | 'wind' | 'activity'; text: string }> = [
    { icon: 'clock', text: `${experience.duration} min` },
  ];
  const destination = experience.routePlan?.destination;
  if (destination && here) facts.push({ icon: 'navigation', text: `${dutchDecimal(geoDistanceKm(here, destination))} km · te voet` });
  else facts.push({ icon: 'navigation', text: experience.distance ?? 'dichtbij' });
  if (weather) facts.push({ icon: 'wind', text: `wind ${beaufort(weather.windSpeed)}` });
  else facts.push({ icon: 'activity', text: experience.effort.toLowerCase() });
  return facts;
}
