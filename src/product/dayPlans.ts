import type { Experience } from './experienceModel';
import { parseSaved } from './savedExperiences';

export type PlanItem = { id: string; addedAt: string; experience: Experience };
export type DayPlan = { id: string; title: string; createdAt: string; updatedAt: string; items: PlanItem[] };
export const dayPlansKey = 'momentum.day-plans.v1';
export const serializePlans = (plans: DayPlan[]) => JSON.stringify({ version: 1, plans });
export function parsePlans(raw: string | null): DayPlan[] {
  if (raw === null) return [];
  const value = JSON.parse(raw);
  if (value?.version !== 1 || !Array.isArray(value.plans)) throw new Error('Unknown plan format');
  const ids = new Set<string>();
  for (const p of value.plans) {
    if (!p || typeof p.id !== 'string' || !p.id || ids.has(p.id) || typeof p.title !== 'string'
      || !p.title.trim() || p.title.length > 100 || !Number.isFinite(Date.parse(p.createdAt))
      || !Number.isFinite(Date.parse(p.updatedAt)) || !Array.isArray(p.items)) throw new Error('Invalid plan');
    ids.add(p.id);
    const itemIds = new Set<string>();
    for (const item of p.items) {
      if (!item || typeof item.id !== 'string' || !item.id || itemIds.has(item.id)) throw new Error('Invalid item');
      itemIds.add(item.id);
    }
    parseSaved(JSON.stringify({ version: 1, items: p.items.map((item: PlanItem) => ({
      id: item.experience?.id, savedAt: item.addedAt, experience: item.experience,
    })) }));
  }
  return value.plans;
}
export type PlanAction =
  | { type: 'create'; id: string }
  | { type: 'rename'; id: string; title: string }
  | { type: 'delete'; id: string }
  | { type: 'add'; id: string; itemId: string; experience: Experience }
  | { type: 'remove'; id: string; itemId: string }
  | { type: 'move'; id: string; itemId: string; direction: -1 | 1 };
export function changePlans(plans: DayPlan[], action: PlanAction, now = new Date().toISOString()): DayPlan[] {
  if (action.type === 'create') return plans.some(p => p.id === action.id) ? plans : [...plans, { id: action.id, title: 'Mijn dagplan', createdAt: now, updatedAt: now, items: [] }];
  if (action.type === 'delete') return plans.filter(p => p.id !== action.id);
  return plans.map(p => {
    if (p.id !== action.id) return p;
    let items = p.items;
    if (action.type === 'rename') return { ...p, title: action.title.trim().slice(0, 100) || p.title, updatedAt: now };
    if (action.type === 'add') {
      if (items.some(i => i.experience.id === action.experience.id || i.id === action.itemId)) return p;
      items = [...items, { id: action.itemId, addedAt: now, experience: JSON.parse(JSON.stringify(action.experience)) }];
    } else if (action.type === 'remove') items = items.filter(i => i.id !== action.itemId);
    else {
      const index = items.findIndex(i => i.id === action.itemId), next = index + action.direction;
      if (index < 0 || next < 0 || next >= items.length) return p;
      items = [...items]; [items[index], items[next]] = [items[next], items[index]];
    }
    return { ...p, items, updatedAt: now };
  });
}

// Independent, injectable persistence controller: invalid storage is never overwritten.
export function createPlanStorage(storage: { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<unknown> }, notify: () => void) {
  let state = { plans: [] as DayPlan[], hydrated: false, writable: false, error: '' };
  let writes = Promise.resolve();
  let revision = 0;
  const publish = (patch: Partial<typeof state>) => { state = { ...state, ...patch }; notify(); };
  const save = () => {
    const current = ++revision, raw = serializePlans(state.plans);
    writes = writes.then(() => storage.setItem(dayPlansKey, raw)).then(() => {
      if (current === revision) publish({ error: '' });
    }).catch(() => { if (current === revision) publish({ error: 'Je planwijziging is nog niet opgeslagen. Probeer opnieuw voordat je de app sluit.' }); });
    return writes;
  };
  return {
    getSnapshot: () => state,
    async load() {
      try { const plans = parsePlans(await storage.getItem(dayPlansKey)); publish({ plans, writable: true, error: '' }); }
      catch { publish({ error: 'Je dagplannen konden niet worden geladen. De opgeslagen gegevens blijven intact. Heropen de app om opnieuw te proberen.' }); }
      finally { publish({ hydrated: true }); }
    },
    dispatch(action: PlanAction) { if (!state.writable) return; publish({ plans: changePlans(state.plans, action) }); void save(); },
    retry: () => state.writable ? save() : Promise.resolve(),
    settled: () => writes,
  };
}
