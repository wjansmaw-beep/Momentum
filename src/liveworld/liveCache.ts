import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Coordinates, LiveWorldSnapshot } from './liveWorld';

const prefix = 'momentum.live-world-cache.v1';
const regionCell = (coordinates: Coordinates) => `${coordinates.latitude.toFixed(1)}:${coordinates.longitude.toFixed(1)}`;
const keyFor = (coordinates: Coordinates) => `${prefix}:${regionCell(coordinates)}`;

export const snapshotAgeMinutes = (snapshot: LiveWorldSnapshot, now = Date.now()) => Math.max(0, (now - new Date(snapshot.retrievedAt).getTime()) / 60000);
export const isSnapshotFresh = (snapshot: LiveWorldSnapshot, maxMinutes: number) => snapshotAgeMinutes(snapshot) <= maxMinutes;

export async function saveLiveWorldCache(snapshot: LiveWorldSnapshot) {
  await AsyncStorage.setItem(keyFor(snapshot.coordinates), JSON.stringify(snapshot));
}

export async function loadLiveWorldCache(coordinates: Coordinates): Promise<LiveWorldSnapshot | null> {
  const raw = await AsyncStorage.getItem(keyFor(coordinates));
  if (!raw) return null;
  try {
    const snapshot = JSON.parse(raw) as LiveWorldSnapshot;
    if (snapshotAgeMinutes(snapshot) > 24 * 60) return null;
    return {
      ...snapshot,
      placeKnowledge: snapshot.placeKnowledge ?? [],
      sources: snapshot.sources.map((source) => source.state === 'live' ? { ...source, state: 'stale', detail: `${source.detail} · eerder opgehaald` } : source),
    };
  } catch {
    return null;
  }
}

export async function clearLiveWorldCache() {
  const keys = await AsyncStorage.getAllKeys();
  const cacheKeys = keys.filter((key) => key.startsWith(prefix));
  if (cacheKeys.length) await AsyncStorage.multiRemove(cacheKeys);
}
