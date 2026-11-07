import type { Activity } from '../types/activity';
import { parseActivity } from '../services/activitySchema';
import { createStore, readJson, writeJson } from './storage';

export const ACTIVITIES_KEY = 'cwg.activities';

function load(): Activity[] {
  const raw = readJson<unknown>(ACTIVITIES_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.map(parseActivity).filter((a): a is Activity => a !== null);
}

export const activityStore = createStore(load);

function persist(list: Activity[]): boolean {
  const ok = writeJson(ACTIVITIES_KEY, list);
  activityStore.set(list);
  return ok;
}

export function listActivities(): Activity[] {
  return [...activityStore.get()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getActivity(id: string): Activity | undefined {
  return activityStore.get().find((a) => a.id === id);
}

export function saveActivity(activity: Activity): boolean {
  const list = activityStore.get();
  const exists = list.some((a) => a.id === activity.id);
  return persist(exists ? list.map((a) => (a.id === activity.id ? activity : a)) : [activity, ...list]);
}

export function deleteActivity(id: string): boolean {
  return persist(activityStore.get().filter((a) => a.id !== id));
}
