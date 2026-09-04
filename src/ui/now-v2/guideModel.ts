import type { Experience } from '../../product/experienceModel';
import type { ActiveSession } from '../../app/store';
import type { GuideDepth } from '../../guidance/experienceGuide';
import type { WeatherSignal } from '../../liveworld/liveWorld';
import {
  beaufort,
  formatClock,
  isDryCode,
  precipWord,
  SunTimes,
} from './nowModel';

// Domeinmodel voor het Gids-scherm (onderweg) volgens concept v2 (ADR-067,
// fase R4). Pure functies zonder React Native — deterministisch en los
// testbaar. De concrete-copy doctrine is leidend: elke regel benoemt een feit
// uit de sessie, het routeplan, de huidige weersmeting of het zonmodel.
//
// Eerlijkheidsgrenzen van deze fase (bewust, gedocumenteerd):
// - Er is geen GPS-tracking in de app. Voortgang is daarom tijd- en stap-
//   gebaseerd ("24 van 75 min"), nooit een verzonnen kilometerstand.
// - Er is geen uur-voor-uur-verwachting; "terug vóór …" gebruikt alleen de
//   huidige meting en het zonmodel.

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export type GuideProgress = {
  /** Serif-getal, bijv. "24". */
  headline: string;
  /** Eenheid naast het getal, bijv. "van 75 min". */
  suffix: string;
  /** Feitenregel rechts, bijv. "24 min onderweg · stap 2 van 3". */
  sub: string;
  /** Balkvulling 0..1. */
  fraction: number;
};

/**
 * Voortgang uit echte sessiedata: de seconden van afgeronde stappen plus de
 * tijd op de huidige stap (afgeleid van sessie-updatedAt, afgetopt op de
 * stapduur), gedeeld door de totale duur van de ervaring. Een schatting op
 * echte grond — de bar loopt nooit voor op de klok.
 */
export function guideProgress(now: Date, experience: Experience, session: ActiveSession | null, stepIndex: number): GuideProgress {
  const totalSeconds = Math.max(1, experience.duration * 60);
  const steps = experience.steps;
  const doneSeconds = steps.slice(0, stepIndex).reduce((sum, step) => sum + (step.seconds ?? 0), 0);
  const current = steps[stepIndex];
  const onStepSeconds = session?.updatedAt && Number.isFinite(Date.parse(session.updatedAt))
    ? clamp((now.getTime() - Date.parse(session.updatedAt)) / 1000, 0, current?.seconds ?? totalSeconds)
    : 0;
  const elapsedSeconds = clamp(doneSeconds + onStepSeconds, 0, totalSeconds);
  const elapsedMinutes = Math.round(elapsedSeconds / 60);
  const stepCount = Math.max(1, steps.length);
  return {
    headline: `${elapsedMinutes}`,
    suffix: `van ${experience.duration} min`,
    sub: stepCount > 1
      ? `${elapsedMinutes} min onderweg · stap ${stepIndex + 1} van ${stepCount}`
      : `${elapsedMinutes} min onderweg`,
    fraction: clamp(elapsedSeconds / totalSeconds, 0, 1),
  };
}

export type GuideRow = {
  icon: 'moon' | 'clock' | 'home' | 'cloud-rain';
  title: string;
  sub?: string;
  trailing?: string;
};

export type GuideState = {
  /** Of de gids nu zwijgt (stille modus) — stuurt ook de kaart-badge. */
  quiet: boolean;
  rows: GuideRow[];
};

/**
 * "De gids" in concrete regels — alleen wat uit data volgt:
 * - Stille modus: alleen als de begeleidingsdiepte of de ervaring dat echt is.
 * - Neerslag nu: als de huidige meting neerslag meldt (geen verwachting).
 * - Rond … thuis: uit resterende stappen + terugminuten, gespiegeld aan het
 *   zonmodel (vóór of na zonsondergang).
 * - Snelste route terug: alleen met routeplan (echte terugminuten).
 */
export function guideState(
  now: Date,
  sun: SunTimes,
  weather: WeatherSignal | undefined,
  experience: Experience,
  session: ActiveSession | null,
  stepIndex: number,
  guideDepth: GuideDepth,
): GuideState {
  const quiet = guideDepth === 'quiet' || experience.presenceMode === 'quiet';
  const rows: GuideRow[] = [];
  if (quiet) {
    rows.push({
      icon: 'moon',
      title: 'Stille modus',
      sub: 'de gids zwijgt tot je hem opent',
      trailing: 'aan',
    });
  }
  if (weather && !isDryCode(weather.weatherCode)) {
    rows.push({
      icon: 'cloud-rain',
      title: `${precipWord(weather.weatherCode)} nu`,
      sub: `gemeld · wind ${beaufort(weather.windSpeed)} bft`,
    });
  }
  // Verwachte thuiskomst: resterende stapseconden (de huidige stap telt vol,
  // want een niet-gestarte timer staat nog vooraan) plus de terugweg.
  const remainingSeconds = experience.steps
    .slice(stepIndex)
    .reduce((sum, step) => sum + (step.seconds ?? 0), 0);
  const returnMinutes = experience.routePlan?.returnMinutes ?? 0;
  const hasEstimate = remainingSeconds > 0 || returnMinutes > 0;
  if (hasEstimate) {
    const home = new Date(now.getTime() + remainingSeconds * 1000 + returnMinutes * 60000);
    const dark = home.getTime() > sun.sunset.getTime();
    rows.push({
      icon: 'clock',
      title: `Rond ${formatClock(home)} thuis`,
      sub: dark ? `na zonsondergang (${formatClock(sun.sunset)})` : 'vóór zonsondergang',
    });
  }
  if (experience.routePlan) {
    rows.push({
      icon: 'home',
      title: 'Snelste route terug',
      sub: `vanaf ${experience.routePlan.destinationName}`,
      trailing: `${experience.routePlan.returnMinutes} min`,
    });
  }
  return { quiet, rows };
}
