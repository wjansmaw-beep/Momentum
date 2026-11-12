import type { CapsuleStep, Experience, PlaceInformation } from '../product/experienceModel';
import { guideDestination } from './guideDestination';

export function currentPlace(experience: Experience, step?: CapsuleStep) {
  return step?.visitPlace ?? experience.visitPlace;
}

export function currentDestination(experience: Experience, step?: CapsuleStep, now = Date.now()) {
  const place = currentPlace(experience, step);
  // An invalid chapter point must not silently send the user to another place.
  return place ? guideDestination({ destination: place, destinationName: place.name }, now)
    : guideDestination(experience.routePlan, now);
}

export function safePlaceSource(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined; }
  catch { return undefined; }
}

export function presentPlaceInformation(info?: PlaceInformation, now = Date.now()) {
  const sourceUrl = safePlaceSource(info?.sourceUrl);
  const checked = Date.parse(info?.checkedAt ?? '');
  if (typeof info?.text !== 'string' || !info.text.trim() || !sourceUrl || !Number.isFinite(checked) || checked > now) {
    return { text: 'Nog niet gecontroleerd. Bekijk de informatie van de locatie.', sourceUrl, outdated: true, checkedAt: undefined };
  }
  const expiry = info.validUntil ? Date.parse(info.validUntil) : undefined;
  const outdated = expiry !== undefined && (!Number.isFinite(expiry) || expiry <= now);
  return { text: info.text, sourceUrl, outdated, checkedAt: info.checkedAt };
}
