/** Open-Meteo timeformat=unixtime supplies absolute seconds, not local clocks. */
export function unixSecondsToIso(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 8640000000000) return '';
  return new Date(value * 1000).toISOString();
}

export function isCurrentInstant(value: string, now: number, maxAgeHours = 2): boolean {
  if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) return false;
  const age = now - Date.parse(value);
  return Number.isFinite(age) && age >= 0 && age < maxAgeHours * 3600000;
}

/** eBird local reports have no offset: claim only the calendar date, never an instant. */
export function recentBirdDate(value: string, now: number): string | undefined {
  const date = /^(\d{4}-\d{2}-\d{2})(?:$|[ T])/.exec(value)?.[1];
  if (!date) return undefined;
  const time = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== date) return undefined;
  const today = Date.parse(`${new Date(now).toISOString().slice(0, 10)}T00:00:00Z`);
  const days = (today - time) / 86400000;
  // Conservative at date boundaries: no future-date reports, at most seven days.
  return days >= 0 && days <= 7 ? date : undefined;
}
