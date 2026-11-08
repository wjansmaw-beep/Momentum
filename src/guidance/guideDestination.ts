import type { RoutePlan } from '../product/experienceModel';

export type GuideDestination = { latitude: number; longitude: number; label: string };

// Orientation reuses the route owner's point; it does not infer a place from
// narrative text, nor turn an expired opportunity into a new route.
export function guideDestination(plan?: Pick<RoutePlan, 'destination' | 'destinationName' | 'expiresAt'>, now = Date.now()): GuideDestination | null {
  if (!plan?.destination) return null;
  if (plan.expiresAt && (!Number.isFinite(Date.parse(plan.expiresAt)) || Date.parse(plan.expiresAt) <= now)) return null;
  const { latitude, longitude } = plan.destination;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude, label: plan.destinationName || 'Bestemming' };
}
