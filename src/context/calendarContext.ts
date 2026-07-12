import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export type CalendarSourceState = 'not-requested' | 'live' | 'denied' | 'unavailable' | 'error';
export type BusyInterval = { start: string; end: string };
export type FreeWindow = { start: string; end: string; minutes: number };
export type CalendarContextSnapshot = {
  state: CalendarSourceState;
  detail: string;
  retrievedAt?: string;
  busyIntervals: BusyInterval[];
  freeWindows: FreeWindow[];
  currentFreeMinutes?: number;
};

export const emptyCalendarContext = (): CalendarContextSnapshot => ({
  state: Platform.OS === 'web' ? 'unavailable' : 'not-requested',
  detail: Platform.OS === 'web'
    ? 'Agenda-context werkt op een iPhone-development-build, niet in de webpreview.'
    : 'Nog niet gekoppeld. Momentum blijft werken met handmatig gekozen tijd.',
  busyIntervals: [],
  freeWindows: [],
});

const dateAt = (base: Date, hour: number) => {
  const result = new Date(base);
  result.setHours(hour, 0, 0, 0);
  return result;
};

const mergeBusy = (intervals: Array<{ start: Date; end: Date }>) => intervals
  .sort((a, b) => a.start.getTime() - b.start.getTime())
  .reduce<Array<{ start: Date; end: Date }>>((merged, interval) => {
    const last = merged[merged.length - 1];
    if (!last || interval.start > last.end) merged.push({ ...interval });
    else if (interval.end > last.end) last.end = interval.end;
    return merged;
  }, []);

export function detectFreeWindows(now: Date, intervals: BusyInterval[], minimumMinutes = 20): FreeWindow[] {
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 1);
  horizon.setHours(22, 0, 0, 0);
  const busy = mergeBusy(intervals.map((interval) => ({ start: new Date(interval.start), end: new Date(interval.end) })));
  const windows: FreeWindow[] = [];

  for (let offset = 0; offset < 2; offset += 1) {
    const day = new Date(now);
    day.setDate(day.getDate() + offset);
    const dayStart = offset === 0 ? new Date(Math.max(now.getTime(), dateAt(day, 7).getTime())) : dateAt(day, 7);
    const dayEnd = dateAt(day, 22);
    let cursor = dayStart;
    busy.filter((item) => item.end > dayStart && item.start < dayEnd).forEach((item) => {
      const blockedStart = new Date(Math.max(item.start.getTime(), dayStart.getTime()));
      const blockedEnd = new Date(Math.min(item.end.getTime(), dayEnd.getTime()));
      const minutes = Math.floor((blockedStart.getTime() - cursor.getTime()) / 60000);
      if (minutes >= minimumMinutes) windows.push({ start: cursor.toISOString(), end: blockedStart.toISOString(), minutes });
      if (blockedEnd > cursor) cursor = blockedEnd;
    });
    const trailing = Math.floor((dayEnd.getTime() - cursor.getTime()) / 60000);
    if (trailing >= minimumMinutes) windows.push({ start: cursor.toISOString(), end: dayEnd.toISOString(), minutes: trailing });
  }
  return windows.filter((window) => new Date(window.start) < horizon);
}

export async function loadCalendarContext(requestPermission: boolean): Promise<CalendarContextSnapshot> {
  if (Platform.OS === 'web') return emptyCalendarContext();
  try {
    const permission = requestPermission
      ? await Calendar.requestCalendarPermissions(false)
      : await Calendar.getCalendarPermissions(false);
    if (permission.status !== 'granted') {
      return { state: requestPermission ? 'denied' : 'not-requested', detail: 'Geen agenda-toegang. Handmatige tijd blijft beschikbaar.', busyIntervals: [], freeWindows: [] };
    }

    const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 2);
    end.setHours(0, 0, 0, 0);
    const events = await Calendar.listEvents(calendars, now, end);

    // Privacy boundary: discard title, location, notes, attendees and identifiers immediately.
    const busyIntervals: BusyInterval[] = events.flatMap((event) => event.allDay || event.availability === Calendar.Availability.FREE ? [] : [{
      start: new Date(event.startDate).toISOString(),
      end: new Date(event.endDate).toISOString(),
    }]);
    const freeWindows = detectFreeWindows(now, busyIntervals);
    const current = freeWindows.find((window) => new Date(window.start) <= now && new Date(window.end) > now);
    return {
      state: 'live',
      detail: `${freeWindows.length} vrije vensters gevonden · alleen begin- en eindtijden lokaal verwerkt`,
      retrievedAt: now.toISOString(),
      busyIntervals,
      freeWindows,
      currentFreeMinutes: current?.minutes,
    };
  } catch (error) {
    return { state: 'error', detail: error instanceof Error ? error.message : 'Agenda kon niet lokaal worden gelezen', busyIntervals: [], freeWindows: [] };
  }
}

export const formatWindow = (window: FreeWindow) => {
  const start = new Date(window.start);
  const end = new Date(window.end);
  const day = start.toDateString() === new Date().toDateString() ? 'Vandaag' : 'Morgen';
  const clock = (value: Date) => value.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${clock(start)}–${clock(end)} · ${window.minutes} min`;
};
