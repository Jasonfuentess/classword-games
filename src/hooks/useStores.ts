import { useSyncExternalStore } from 'react';
import { activityStore } from '../storage/activities';
import { resultStore } from '../storage/results';
import type { Activity, ResultRecord } from '../types/activity';

export function useActivities(): Activity[] {
  const list = useSyncExternalStore(activityStore.subscribe, activityStore.get, activityStore.get);
  return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function useResults(): ResultRecord[] {
  return useSyncExternalStore(resultStore.subscribe, resultStore.get, resultStore.get);
}
