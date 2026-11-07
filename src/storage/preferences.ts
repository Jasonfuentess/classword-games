import { createStore, readJson, removeKey, writeJson } from './storage';

export type ThemePreference = 'light' | 'dark' | 'system';
export type UiLanguage = 'en' | 'es';

export interface Preferences {
  theme: ThemePreference;
  language: UiLanguage;
  sound: boolean;
  tutorialSeen: boolean;
}

export const PREFERENCES_KEY = 'cwg.preferences';

export function defaultPreferences(): Preferences {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return { theme: 'system', language: nav.toLowerCase().startsWith('es') ? 'es' : 'en', sound: true, tutorialSeen: false };
}

function load(): Preferences {
  const defaults = defaultPreferences();
  const raw = readJson<Partial<Preferences>>(PREFERENCES_KEY, {});
  return {
    theme: raw.theme === 'light' || raw.theme === 'dark' || raw.theme === 'system' ? raw.theme : defaults.theme,
    language: raw.language === 'en' || raw.language === 'es' ? raw.language : defaults.language,
    sound: typeof raw.sound === 'boolean' ? raw.sound : defaults.sound,
    tutorialSeen: typeof raw.tutorialSeen === 'boolean' ? raw.tutorialSeen : defaults.tutorialSeen,
  };
}

export const preferenceStore = createStore(load);

export function updatePreferences(patch: Partial<Preferences>): void {
  const next = { ...preferenceStore.get(), ...patch };
  writeJson(PREFERENCES_KEY, next);
  preferenceStore.set(next);
}

export function resetPreferences(): void {
  removeKey(PREFERENCES_KEY);
  preferenceStore.reload();
}
