import { Experience } from '../../product/experienceModel';
import { TransportMode, transportLabels } from '../../product/localIntelligence';
import { GuideDepth } from '../../guidance/experienceGuide';
import { WeatherSignal } from '../../liveworld/liveWorld';
import {
  beaufort,
  formatClock,
  goldenWindow,
  isDryCode,
  precipWord,
  suggestedStart,
  SunTimes,
} from './nowModel';

// Domeinmodel voor het Voorpret-scherm volgens concept v2 (ADR-067, fase R3).
// Pure functies zonder React Native — volledig deterministisch en los testbaar.
// De concrete-copy doctrine is leidend: elke regel benoemt een feit (tijd,
// afstand, wind, temperatuur, licht). Waar geen live bron bestaat — uur-voor-
// uur-weer verderop in de avond bijvoorbeeld — zegt het model wat het wél weet
// (huidige meting, zonverloop) en laat het de rest weg.

/** "1u 07m" of "12 m" — kleine letters voor de serif-countdown op de kaart. */
export function formatCountdownLower(from: Date, to: Date): string {
  const minutes = Math.max(0, Math.round((to.getTime() - from.getTime()) / 60000));
  if (minutes >= 60) return `${Math.floor(minutes / 60)}u ${String(minutes % 60).padStart(2, '0')}m`;
  return `${minutes} m`;
}

/**
 * Aandeel van het aftelvenster dat verstreken is: het venster loopt van één
 * uur voor vertrek tot het vertrek zelf, geclampt op 0..1. Rustig en
 * deterministisch — geen kunstmatige voortgang vanaf het openen van het scherm.
 */
export function departureProgress(now: Date, start: Date): number {
  const windowStart = start.getTime() - 60 * 60000;
  const value = (now.getTime() - windowStart) / (start.getTime() - windowStart);
  return Math.max(0, Math.min(1, value));
}

export type JourneySegment = {
  icon: 'navigation' | 'sun' | 'flag' | 'clock';
  title: string;
  sub?: string;
  /** Rechts uitgelijnd, bijv. "20 min". */
  trailing?: string;
};

/**
 * "Zo ga je" als routesegmenten. Met een routeplan: heen, de ervaring zelf en
 * terug — met echte minuten en de vervoerskeuze. Zonder routeplan: één
 * eerlijke rij uit de capsule zelf (duur en inspanning), nooit verzonnen
 * segmenten.
 */
export function journeySegments(experience: Experience, transport: TransportMode): JourneySegment[] {
  const plan = experience.routePlan;
  if (!plan) {
    return [{
      icon: 'clock',
      title: `${experience.duration} minuten · ${experience.effort.toLowerCase()}`,
      sub: experience.timeWindow ? `het mooiste venster is ${experience.timeWindow}` : 'binnen handbereik van huis',
    }];
  }
  const way = transportLabels[transport].toLowerCase();
  return [
    {
      icon: 'navigation',
      title: `${transportLabels[transport]} naar ${plan.destinationName}`,
      sub: 'heen',
      trailing: `${plan.outboundMinutes} min`,
    },
    {
      icon: 'sun',
      title: `Daar · ${plan.destinationName}`,
      sub: 'het moment zelf',
      trailing: `${plan.experienceMinutes} min`,
    },
    {
      icon: 'flag',
      title: 'Terug naar huis',
      sub: plan.bufferMinutes > 0 ? `met ${plan.bufferMinutes} min marge` : 'zonder haast',
      trailing: `${plan.returnMinutes} min`,
    },
  ];
}

export type PackStatus = 'nodig' | 'handig' | 'geregeld';

export type PackingRow = {
  icon: 'wind' | 'cloud-rain' | 'droplet' | 'check' | 'thermometer';
  title: string;
  sub?: string;
  status?: PackStatus;
};

/**
 * "Neem mee" uit echte data. Met live weer: een windjack als het waait of
 * afkoelt (wind ≥4 bft of ≤15°), een regenlaag als er neerslag is, water als
 * het moment lang genoeg duurt om dorst reëel te maken (≥75 min). Zonder live
 * weer: de bestaande paklijst van de capsule zelf — die is door de makers uit
 * de ervaring opgesteld en daarmee een eerlijke bron.
 */
export function packingRows(experience: Experience, weather: WeatherSignal | undefined): PackingRow[] {
  const totalMinutes = experience.routePlan
    ? experience.routePlan.outboundMinutes + experience.routePlan.experienceMinutes + experience.routePlan.returnMinutes
    : experience.duration;
  if (!weather) {
    return experience.prepare.map((item) => ({ icon: 'check' as const, title: item }));
  }
  const rows: PackingRow[] = [];
  const temp = Math.round(weather.temperature);
  const bft = beaufort(weather.windSpeed);
  if (!isDryCode(weather.weatherCode)) {
    rows.push({
      icon: 'cloud-rain',
      title: 'Regenlaag',
      sub: `${precipWord(weather.weatherCode).toLowerCase()} gemeld · nu ${temp}°`,
      status: 'nodig',
    });
  }
  if (bft >= 4 || temp <= 15) {
    rows.push({
      icon: 'wind',
      title: 'Windjack',
      sub: bft >= 4 ? `wind ${bft} bft · nu ${temp}°` : `nu ${temp}° en koeler na zonsondergang`,
      status: 'nodig',
    });
  }
  if (totalMinutes >= 75) {
    rows.push({
      icon: 'droplet',
      title: 'Flesje water',
      sub: `${totalMinutes} min onderweg`,
      status: 'handig',
    });
  }
  // Capsule-regels die niet al door een live regel gedekt worden, blijven
  // eerlijk zichtbaar (bijv. "stevige schoenen") — zonder verzonnen status.
  const covered = rows.length;
  const extra = experience.prepare
    .filter((item) => !rows.some((row) => item.toLowerCase().includes(row.title.toLowerCase().split(' ')[0])))
    .slice(0, Math.max(0, 3 - covered))
    .map((item) => ({ icon: 'check' as const, title: item }));
  return [...rows, ...extra];
}

export type WeatherRow = {
  icon: 'thermometer' | 'sunset' | 'moon';
  title: string;
  sub?: string;
  trailing?: string;
};

/**
 * "Weer onderweg": wat nu geldt en wat het zonmodel zegt over de rest van het
 * moment. Er is geen uur-voor-uur-verwachting in de live bron — dus geen
 * "14° om 22:30". Wel eerlijk: de huidige meting, droog/neerslag nu, zon onder
 * om …, en of het bij terugkomst donker is.
 */
export function weatherRows(now: Date, sun: SunTimes, weather: WeatherSignal | undefined, end: Date): WeatherRow[] {
  const darkAtReturn = end.getTime() > sun.sunset.getTime();
  const rows: WeatherRow[] = [];
  if (weather) {
    const dry = isDryCode(weather.weatherCode);
    rows.push({
      icon: 'thermometer',
      title: `${Math.round(weather.temperature)}° nu · ${dry ? 'droog' : precipWord(weather.weatherCode).toLowerCase()}`,
      sub: `wind ${beaufort(weather.windSpeed)} bft`,
      trailing: dry ? 'goed' : 'pas op',
    });
  }
  if (darkAtReturn) {
    rows.push({
      icon: 'moon',
      title: `Donker bij terugkomst`,
      sub: `zon onder ${formatClock(sun.sunset)} · rond ${formatClock(end)} thuis`,
    });
  } else {
    rows.push({
      icon: 'sunset',
      title: `Zon onder om ${formatClock(sun.sunset)}`,
      sub: `gouden uur rond ${formatClock(goldenWindow(sun).peak)}`,
    });
  }
  return rows;
}

/**
 * De subregel onder de Go-CTA: wat de begeleiding doet en wanneer je klaar
 * bent — alleen feiten uit de sessie en de klok. Bij rustige begeleiding
 * loopt de gids niet mee, dus zegt de regel dat ook niet.
 */
export function ctaSubline(guideDepth: GuideDepth, end: Date): string {
  const ready = `rond ${formatClock(end)} klaar`;
  if (guideDepth === 'quiet') return `rustig begeleid · ${ready}`;
  if (guideDepth === 'deep') return `de gids loopt mee met verdieping · ${ready}`;
  return `de gids loopt mee · ${ready}`;
}

export type Departure = {
  start: Date;
  end: Date;
  countdown: string;
  progress: number;
  meta: string;
};

/** Alles voor de aftelkaart in één model. */
export function departureModel(now: Date, durationMinutes: number, sun: SunTimes, transport: TransportMode): Departure {
  const suggestion = suggestedStart(now, durationMinutes, sun);
  return {
    start: suggestion.start,
    end: suggestion.end,
    countdown: formatCountdownLower(now, suggestion.start),
    progress: departureProgress(now, suggestion.start),
    meta: `vertrek ${formatClock(suggestion.start)} · ${transportLabels[transport].toLowerCase()}`,
  };
}
