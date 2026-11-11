import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPlanStorage } from '../product/dayPlans';

export function useDayPlans() {
  const [connection] = useState(() => {
    const listeners = new Set<() => void>();
    return { controller: createPlanStorage(AsyncStorage, () => listeners.forEach(fn => fn())),
      subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; } };
  });
  const state = useSyncExternalStore(connection.subscribe, connection.controller.getSnapshot, connection.controller.getSnapshot);
  useEffect(() => { void connection.controller.load(); }, [connection]);
  return { dayPlans: state.plans, plansHydrated: state.hydrated, canEditPlans: state.writable,
    plansError: state.error, changeDayPlans: connection.controller.dispatch, retryPlans: connection.controller.retry };
}
