import type { Experience, ExperienceKind } from '../../product/experienceModel';
import type { LiveWorldSnapshot } from '../../liveworld/liveWorld';
import { experiencePresentation } from './experiencePresentation';
import { beaufort, formatClock, isDryCode, precipWord } from './nowModel';
import { NatureInterest, natureInterestLabels } from '../../profile/naturePreferences';

const names: Record<ExperienceKind, string> = {
  outside: 'Buiten ontdekken', movement: 'Bewegen', food: 'Koken & voeding',
  restore: 'Rust & herstel', connect: 'Samen beleven', learn: 'Leren & maken',
  culture: 'Cultuur & eropuit',
};

/** Presentation only. Never treats the prototype's clock/place as user evidence. */
export function nowInvitation(
  experience: Experience,
  preferredKinds: ExperienceKind[],
  locationConfirmed: boolean,
  snapshot: LiveWorldSnapshot | null | undefined,
  now: Date,
  natureInterests: NatureInterest[] = [],
) {
  const outdoor = experiencePresentation(experience).outdoorContext;
  const region = locationConfirmed ? snapshot?.regionLabel?.replace(/ proefcontext.*$/i, '').trim() : undefined;
  const weather = snapshot?.weather;
  const age = now.getTime() - Date.parse(snapshot?.retrievedAt ?? '');
  const observedAge = now.getTime() - Date.parse(weather?.observedAt ?? '');
  // A remote region's zone-less clock is not the device's local time.
  const observationHasZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(weather?.observedAt ?? '');
  const liveWeather = Boolean(
    outdoor && locationConfirmed && region && weather
    && snapshot?.sources.some((source) => source.id === 'open-meteo' && source.state === 'live')
    && age >= 0 && age < 2 * 60 * 60 * 1000
    && observationHasZone && observedAge >= 0 && observedAge < 2 * 60 * 60 * 1000
    && Number.isFinite(weather.temperature) && Number.isFinite(weather.windSpeed)
    && weather.windSpeed >= 0 && Number.isFinite(weather.weatherCode),
  );
  const tiles: Array<{ icon: 'clock' | 'check' | 'activity'; title: string; sub: string }> = [
    { icon: 'clock', title: `Ongeveer ${experience.duration} min`, sub: 'Duur van dit voorstel' },
    { icon: 'activity', title: experience.effort, sub: 'Beschreven inspanning' },
  ];
  const route = locationConfirmed ? experience.routePlan : undefined;
  if (route) tiles[1] = { icon: 'activity', title: `Circa ${route.outboundMinutes} min ${route.mode === 'cycling' ? 'fietsen' : 'lopen'} heen`, sub: `Schatting, geen routecheck · ${route.experienceMinutes} min ter plekke · ${route.returnMinutes} min terug · ${route.bufferMinutes} min buffer` };
  const natureMatch = natureInterests.find((interest) => experience.natureTopics?.includes(interest));
  if (natureMatch) {
    tiles.push({ icon: 'check', title: natureInterestLabels[natureMatch], sub: 'Een door jou gekozen interesse' });
  } else if (preferredKinds.includes(experience.kind)) {
    tiles.push({ icon: 'check', title: names[experience.kind], sub: 'Een door jou gekozen interesse' });
  }
  return {
    region: region || 'Jouw moment',
    place: outdoor ? (region ? experience.routePlan?.destinationName || region : 'Omgeving niet gekozen') : names[experience.kind],
    badge: names[experience.kind],
    promise: experience.wonder || experience.promise,
    tiles,
    cta: experience.kind === 'movement' && !outdoor ? 'Bekijk de workout'
      : experience.kind === 'food' ? 'Bekijk het recept'
        : outdoor ? 'Bekijk deze ervaring' : 'Ontdek dit moment',
    weather: liveWeather && weather ? {
      text: `${Math.round(weather.temperature)}° · ${isDryCode(weather.weatherCode) ? 'droog gemeld' : precipWord(weather.weatherCode).toLowerCase()} · wind ${beaufort(weather.windSpeed)} bft`,
      source: `Open-Meteo · ${formatClock(new Date(weather.observedAt))}`,
    } : undefined,
    contextNote: !outdoor ? undefined : !locationConfirmed
      ? 'Kies je omgeving in Jij voor plaatsgebonden context.'
      : !liveWeather ? 'Actueel weer is niet bevestigd. Controleer de omstandigheden voor vertrek.' : undefined,
  };
}
