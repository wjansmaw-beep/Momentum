import type { Experience } from '../product/experienceModel';
import type { PositionSample } from './foregroundPosition';
import { safePlaceSource } from './placeInformation';

export type NearbyStory = { kind: 'proposal'; index: number; place: string; expiresAt: number }
  | { kind: 'current' | 'uncertain' | 'far' };
export const supportsNearbyStory = (experience: Experience) => experience.id === 'moddergat-five-places-v1';
function validPoint(p: { latitude: number; longitude: number }) {
  return Number.isFinite(p.latitude) && Math.abs(p.latitude) <= 90 && Number.isFinite(p.longitude) && Math.abs(p.longitude) <= 180;
}
function distance(a: PositionSample, b: {latitude: number; longitude: number}) {
  const rad = Math.PI / 180;
  const h = Math.sin((b.latitude-a.latitude)*rad/2)**2 + Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin((b.longitude-a.longitude)*rad/2)**2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0,h))));
}
export function nearbyStory(experience: Experience, currentIndex: number, sample: PositionSample, now: number): NearbyStory {
  if (!supportsNearbyStory(experience) || !validPoint(sample) || !Number.isFinite(now)
    || !Number.isFinite(sample.timestamp) || sample.timestamp > now || now-sample.timestamp > 30000
    || sample.accuracy == null || !Number.isFinite(sample.accuracy) || sample.accuracy < 0 || sample.accuracy > 35) return {kind:'uncertain'};
  const candidates = experience.steps.flatMap((step,index) => {
    const place = step.visitPlace;
    return place && validPoint(place) && safePlaceSource(place.coordinateSourceUrl) && safePlaceSource(place.sourceUrl)
      ? [{ index, place:place.name, distance:distance(sample,place) }] : [];
  }).sort((a,b)=>a.distance-b.distance);
  const first=candidates[0];
  if (!first) return {kind:'uncertain'};
  if (first.distance + sample.accuracy > 120) return {kind:'far'};
  if (candidates[1] && candidates[1].distance-first.distance <= 2*sample.accuracy+15) return {kind:'uncertain'};
  return first.index === currentIndex ? {kind:'current'} : {kind:'proposal',index:first.index,place:first.place,expiresAt:sample.timestamp+30000};
}
