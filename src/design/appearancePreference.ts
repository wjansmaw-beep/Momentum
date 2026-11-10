import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';

export type AppearancePreference = 'light' | 'dark' | 'editorial' | 'system';
const key = 'momentum.appearance.v1';
let preference: AppearancePreference = 'system';
let loading: Promise<void> | undefined;
let changed = false;
let saveError = '';
let writes = Promise.resolve();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());
export function setAppearancePreference(value: AppearancePreference) {
  changed = true;
  preference = value;
  notify();
  writes = writes.then(() => AsyncStorage.setItem(key, value)).then(() => { saveError = ''; notify(); }).catch(() => {
    saveError = 'Je kleurkeuze werkt nu, maar kon niet op dit toestel worden bewaard.'; notify();
  });
}
export function useAppearanceSaveError() {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => saveError, () => '');
}
export function useAppearancePreference() {
  useEffect(() => {
    loading ??= AsyncStorage.getItem(key).then(value => {
      if (!changed && (value === 'light' || value === 'dark' || value === 'system' || value === 'editorial')) {
        preference = value; notify();
      }
    }).catch(() => undefined);
  }, []);
  return useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => preference, () => 'system' as AppearancePreference);
}
