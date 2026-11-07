import { en, type TranslationKey } from './en';
import { es } from './es';

export type Locale = 'en' | 'es';
export type TranslateFn = (key: TranslationKey, vars?: Record<string, string | number>) => string;

const DICTIONARIES: Record<Locale, Record<TranslationKey, string>> = { en, es };

export function translate(locale: Locale, key: TranslationKey, vars?: Record<string, string | number>): string {
  const template = DICTIONARIES[locale][key] ?? en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

export function createTranslator(locale: Locale): TranslateFn {
  return (key, vars) => translate(locale, key, vars);
}
