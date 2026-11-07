import { useSyncExternalStore } from 'react';
import { preferenceStore, type Preferences } from '../storage/preferences';

export function usePreferences(): Preferences {
  return useSyncExternalStore(preferenceStore.subscribe, preferenceStore.get, preferenceStore.get);
}
