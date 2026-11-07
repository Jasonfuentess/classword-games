import { useEffect, useMemo, type ReactNode } from 'react';
import { usePreferences } from '../hooks/usePreferences';
import { updatePreferences } from '../storage/preferences';
import { createTranslator } from './translate';
import { I18nContext, type I18nContextValue } from './context';

export function I18nProvider({ children }: { children: ReactNode }) {
  const { language } = usePreferences();
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const value = useMemo<I18nContextValue>(
    () => ({ locale: language, t: createTranslator(language), setLocale: (l) => updatePreferences({ language: l }) }),
    [language],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
