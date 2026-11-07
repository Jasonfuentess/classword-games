import { useMemo } from 'react';
import { CheckCircle2, Shuffle } from 'lucide-react';
import type { GridSizeOption, WordSearchActivity } from '../../types/activity';
import { generateWordSearch, MAX_WORDS, MIN_WORDS } from '../../engines/wordsearch';
import { CATEGORIES } from '../../data/categories';
import { LIMITS } from '../../services/activitySchema';
import { useI18n } from '../../i18n/useI18n';
import { parseWordList } from '../../utils/text';
import { newSeed } from '../../utils/random';
import { Field, Select, TextArea, TextInput } from '../ui/Field';
import { Toggle } from '../ui/Toggle';
import { Button } from '../ui/Button';

interface Props {
  activity: WordSearchActivity;
  wordsText: string;
  onWordsText: (text: string) => void;
  onChange: (patch: Partial<WordSearchActivity['wordsearch']>) => void;
  wordErrors?: string[];
}

export function WordSearchFields({ activity, wordsText, onWordsText, onChange, wordErrors }: Props) {
  const { t } = useI18n();
  const ws = activity.wordsearch;
  const count = parseWordList(wordsText).length;

  const preview = useMemo(
    () => (wordErrors?.length ? null : generateWordSearch({ ...ws, difficulty: activity.difficulty, language: activity.language })),
    [ws, activity.difficulty, activity.language, wordErrors],
  );

  return (
    <div className="space-y-5">
      <Field
        label={t('editor.ws.words')}
        help={t('editor.ws.wordsHelp', { min: MIN_WORDS, max: MAX_WORDS })}
        error={wordErrors}
        counter={t('editor.ws.wordCount', { count })}
      >
        {({ id, describedBy, invalid }) => (
          <TextArea
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            rows={7}
            value={wordsText}
            placeholder={t('editor.ws.wordsPlaceholder')}
            onChange={(e) => onWordsText(e.target.value)}
            data-testid="ws-words-input"
          />
        )}
      </Field>

      <Field label={t('editor.ws.addCategory')}>
        {({ id }) => (
          <Select
            id={id}
            value=""
            onChange={(e) => {
              const cat = CATEGORIES.find((c) => c.id === e.target.value);
              if (cat) onWordsText(cat.words[activity.language].join('\n'));
            }}
          >
            <option value="">—</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name[activity.language]}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label={t('editor.ws.clue')} counter={t('editor.chars', { count: ws.clue.length, max: LIMITS.clue })}>
        {({ id }) => (
          <TextInput id={id} value={ws.clue} maxLength={LIMITS.clue} placeholder={t('editor.ws.cluePlaceholder')} onChange={(e) => onChange({ clue: e.target.value })} />
        )}
      </Field>

      <Field label={t('editor.ws.gridSize')}>
        {({ id }) => (
          <Select
            id={id}
            value={String(ws.gridSize)}
            onChange={(e) => onChange({ gridSize: (e.target.value === 'auto' ? 'auto' : Number(e.target.value)) as GridSizeOption })}
            data-testid="ws-grid-size"
          >
            <option value="auto">{t('editor.ws.gridAuto')}</option>
            {[10, 12, 15, 20].map((s) => (
              <option key={s} value={s}>
                {s} × {s}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle label={t('editor.ws.diagonal')} checked={ws.allowDiagonal} onChange={(v) => onChange({ allowDiagonal: v })} />
        <Toggle label={t('editor.ws.reverse')} checked={ws.allowReverse} onChange={(v) => onChange({ allowReverse: v })} />
      </div>
      <Toggle label={t('editor.ws.showList')} description={t('editor.ws.showListHelp')} checked={ws.showWordList} onChange={(v) => onChange({ showWordList: v })} />

      {preview?.ok && (
        <div className="rounded-3xl bg-slate-50 p-4 dark:bg-white/5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-teal-700 dark:text-teal-300" data-testid="ws-grid-ready">
              <CheckCircle2 size={16} aria-hidden="true" />
              {t('editor.ws.gridReady', { size: preview.puzzle.size, count: preview.puzzle.placements.length })}
            </p>
            <Button size="sm" variant="soft" icon={Shuffle} onClick={() => onChange({ seed: newSeed() })}>
              {t('editor.ws.regenerate')}
            </Button>
          </div>
          <div
            className="mx-auto grid max-w-xs gap-px overflow-hidden rounded-xl bg-slate-200 font-mono text-[10px] font-bold ring-1 ring-slate-200 dark:bg-slate-700 dark:ring-white/10"
            style={{ gridTemplateColumns: `repeat(${preview.puzzle.size}, 1fr)` }}
            aria-hidden="true"
          >
            {preview.puzzle.grid.flat().map((l, i) => (
              <span key={i} className="flex aspect-square items-center justify-center bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                {l}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
