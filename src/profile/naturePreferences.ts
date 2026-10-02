export const natureInterestLabels = {
  birds: 'Vogels kijken',
  'nature-photo': 'Natuurfotografie',
} as const;

export type NatureInterest = keyof typeof natureInterestLabels;

/** Explicit choices only: never infer these from broad outside preferences. */
export function hydrateNatureInterests(value: unknown): NatureInterest[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is NatureInterest => item === 'birds' || item === 'nature-photo'))]
    : [];
}
