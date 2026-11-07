import { describe, expect, it } from 'vitest';
import { en } from '../../src/i18n/en';
import { es } from '../../src/i18n/es';
import { translate } from '../../src/i18n/translate';

describe('translations', () => {
  it('Spanish has every English key, and no empty strings', () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
    for (const [key, value] of Object.entries(es)) expect(value.trim(), key).not.toBe('');
  });

  it('keeps the same placeholders in both languages', () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(en) as Array<keyof typeof en>) expect(vars(es[key]), key).toEqual(vars(en[key]));
  });

  it('interpolates variables', () => {
    expect(translate('es', 'ws.found', { found: 2, total: 5 })).toBe('2 de 5 encontradas');
    expect(translate('en', 'ws.found', { found: 2, total: 5 })).toBe('2 of 5 found');
  });
});
