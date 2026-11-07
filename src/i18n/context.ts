import { createContext } from 'react';
import type { Locale, TranslateFn } from './translate';

export interface I18nContextValue {
  locale: Locale;
  t: TranslateFn;
  setLocale: (locale: Locale) => void;
}

export const I18nContext = createContext<I18nContextValue | null>(null);
