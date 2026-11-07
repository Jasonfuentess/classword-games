import { useState } from 'react';
import { Dices, Eye, EyeOff } from 'lucide-react';
import type { HangmanActivity } from '../../types/activity';
import { MAX_ERRORS, MIN_ERRORS } from '../../engines/hangman/hangman';
import { CATEGORIES, getCategory } from '../../data/categories';
import { LIMITS } from '../../services/activitySchema';
import { useI18n } from '../../i18n/useI18n';
import { Field, Select, TextInput } from '../ui/Field';
import { Segmented } from '../ui/Segmented';
import { Button, IconButton } from '../ui/Button';

interface Props {
  activity: HangmanActivity;
  onChange: (patch: Partial<HangmanActivity['hangman']>) => void;
  secretErrors?: string[];
}

export function HangmanFields({ activity, onChange, secretErrors }: Props) {
  const { t } = useI18n();
  const hm = activity.hangman;
  const [source, setSource] = useState<'custom' | 'category'>(hm.category ? 'category' : 'custom');
  const [showSecret, setShowSecret] = useState(true);

  const pickRandom = (categoryId: string) => {
    const cat = getCategory(categoryId);
    if (!cat) return;
    const options = cat.words[activity.language].filter((w) => w.toLowerCase() !== hm.secret.toLowerCase());
    const word = options[Math.floor(Math.random() * options.length)];
    onChange({ category: cat.id, secret: word, hint: `${t('editor.hm.category')}: ${cat.name[activity.language]}` });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('editor.hm.source')}</p>
        <Segmented
          label={t('editor.hm.source')}
          value={source}
          onChange={(v) => {
            setSource(v);
            if (v === 'custom') onChange({ category: null });
          }}
          options={[
            { value: 'custom', label: t('editor.hm.custom') },
            { value: 'category', label: t('editor.hm.category') },
          ]}
        />
      </div>

      {source === 'category' && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Field label={t('editor.hm.category')} className="flex-1">
            {({ id }) => (
              <Select id={id} value={hm.category ?? ''} onChange={(e) => e.target.value && pickRandom(e.target.value)}>
                <option value="">—</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name[activity.language]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Button icon={Dices} disabled={!hm.category} onClick={() => hm.category && pickRandom(hm.category)}>
            {t('editor.hm.random')}
          </Button>
        </div>
      )}

      <Field
        label={t('editor.hm.secret')}
        help={t('editor.hm.secretHelp', { max: LIMITS.secret })}
        error={secretErrors}
        counter={t('editor.chars', { count: hm.secret.length, max: LIMITS.secret })}
      >
        {({ id, describedBy, invalid }) => (
          <div className="relative">
            <TextInput
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              type={showSecret ? 'text' : 'password'}
              autoComplete="off"
              spellCheck={false}
              value={hm.secret}
              maxLength={LIMITS.secret}
              placeholder={t('editor.hm.secretPlaceholder')}
              onChange={(e) => onChange({ secret: e.target.value })}
              className="pr-12"
              data-testid="hm-secret-input"
            />
            <IconButton
              label={showSecret ? t('editor.hm.hide') : t('editor.hm.show')}
              icon={showSecret ? EyeOff : Eye}
              className="absolute top-1/2 right-1.5 -translate-y-1/2"
              onClick={() => setShowSecret((s) => !s)}
            />
          </div>
        )}
      </Field>

      <Field label={t('editor.hm.hint')} counter={t('editor.chars', { count: hm.hint.length, max: LIMITS.hint })}>
        {({ id }) => (
          <TextInput id={id} value={hm.hint} maxLength={LIMITS.hint} placeholder={t('editor.hm.hintPlaceholder')} onChange={(e) => onChange({ hint: e.target.value })} data-testid="hm-hint-input" />
        )}
      </Field>

      <Field label={`${t('editor.hm.maxErrors')}: ${hm.maxErrors}`}>
        {({ id }) => (
          <input
            id={id}
            type="range"
            min={MIN_ERRORS}
            max={MAX_ERRORS}
            value={hm.maxErrors}
            onChange={(e) => onChange({ maxErrors: Number(e.target.value) })}
            className="w-full accent-indigo-600"
          />
        )}
      </Field>
    </div>
  );
}
