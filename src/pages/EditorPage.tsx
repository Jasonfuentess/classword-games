import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Eye, FileQuestion, FolderOpen, Save, Share2 } from 'lucide-react';
import type { Activity, ContentLanguage, Difficulty, GameType } from '../types/activity';
import { useI18n } from '../i18n/useI18n';
import { getActivity, saveActivity } from '../storage/activities';
import { createActivity, DEFAULT_MAX_ERRORS, switchGameType } from '../services/activityFactory';
import { LIMITS, tidyActivity, validateActivity } from '../services/activitySchema';
import { parseWordList } from '../utils/text';
import { Button, ButtonLink } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Field, Select, TextArea, TextInput } from '../components/ui/Field';
import { EmptyState, PageHeader } from '../components/ui/misc';
import { Segmented } from '../components/ui/Segmented';
import { Toggle } from '../components/ui/Toggle';
import { useToast } from '../components/ui/useToast';
import { GameIcon } from '../components/GameIcon';
import { ShareDialog } from '../components/ShareDialog';
import { WordSearchFields } from '../components/editor/WordSearchFields';
import { HangmanFields } from '../components/editor/HangmanFields';
import { issueMessages } from '../components/editor/issues';
import { ActivityPlayer } from '../games/ActivityPlayer';
import { cn } from '../utils/format';

const TIME_LIMITS = [0, 1, 2, 3, 5, 10, 15, 20, 30];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card space-y-5 p-5 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function EditorPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { locale } = useI18n();
  const { key: locationKey } = useLocation();
  const type: GameType = params.get('type') === 'hangman' ? 'hangman' : 'wordsearch';
  // A new blank activity per visit to /create; deliberately not recreated when the UI language changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fresh = useMemo(() => createActivity(type, locale), [type, locationKey]);
  const existing = id ? getActivity(id) : undefined;
  if (id && !existing) return <NotFound />;
  const initial = existing ?? fresh;
  return <Editor key={initial.id} initial={initial} isNew={!existing} />;
}

function NotFound() {
  const { t } = useI18n();
  return (
    <EmptyState
      icon={FileQuestion}
      title={t('editor.notFound')}
      body={t('activities.subtitle')}
      actions={
        <ButtonLink to="/activities" variant="primary" icon={FolderOpen}>
          {t('nav.myActivities')}
        </ButtonLink>
      }
    />
  );
}

function Editor({ initial, isNew }: { initial: Activity; isNew: boolean }) {
  const { t } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Activity>(initial);
  const [saved, setSaved] = useState<Activity | null>(isNew ? null : initial);
  const [wordsText, setWordsText] = useState(initial.type === 'wordsearch' ? initial.wordsearch.words.join('\n') : '');
  const [showErrors, setShowErrors] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);

  const issues = useMemo(() => validateActivity(tidyActivity(draft)), [draft]);
  const messages = issueMessages(issues, t);
  const visible = showErrors ? messages : {};
  // Word-list problems are useful immediately (live feedback) once there is some input.
  const wordErrors = draft.type === 'wordsearch' && (showErrors || parseWordList(wordsText).length >= 3) ? messages.words : undefined;
  const dirty = !saved || JSON.stringify(tidyActivity(draft)) !== JSON.stringify(saved);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const update = (patch: Partial<Activity>) => setDraft((d) => ({ ...d, ...patch }) as Activity);

  const setType = (type: GameType) => {
    setDraft((d) => {
      const next = switchGameType(d, type);
      if (next.type === 'wordsearch') next.wordsearch.words = parseWordList(wordsText);
      return next;
    });
  };

  const setDifficulty = (difficulty: Difficulty) =>
    setDraft((d) =>
      d.type === 'hangman'
        ? { ...d, difficulty, hangman: { ...d.hangman, maxErrors: DEFAULT_MAX_ERRORS[difficulty] } }
        : { ...d, difficulty, wordsearch: { ...d.wordsearch, allowDiagonal: difficulty !== 'easy', allowReverse: difficulty === 'hard' } },
    );

  const setWords = (text: string) => {
    setWordsText(text);
    setDraft((d) => (d.type === 'wordsearch' ? { ...d, wordsearch: { ...d.wordsearch, words: parseWordList(text) } } : d));
  };

  const save = (thenShare: boolean) => {
    setShowErrors(true);
    if (issues.length) {
      toast(t('editor.fixErrors'), 'error');
      return;
    }
    const final = { ...tidyActivity(draft), updatedAt: Date.now() };
    if (!saveActivity(final)) {
      toast(t('activities.saveFailed'), 'error');
      return;
    }
    setDraft(final);
    setSaved(final);
    toast(t('activities.saved'));
    if (isNew) navigate(`/edit/${final.id}`, { replace: true });
    if (thenShare) setShareOpen(true);
  };

  const ws = draft.type === 'wordsearch' ? draft : null;
  const hm = draft.type === 'hangman' ? draft : null;

  return (
    <div>
      <PageHeader title={t(isNew ? 'editor.createTitle' : 'editor.editTitle')} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <form
          className="space-y-6"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save(false);
          }}
        >
          <Section title={t('editor.section.game')}>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={t('editor.section.game')}>
              {(['wordsearch', 'hangman'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={draft.type === type}
                  onClick={() => setType(type)}
                  data-testid={`type-${type}`}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl p-3 text-left font-semibold ring-2 transition sm:p-4',
                    draft.type === type
                      ? 'bg-indigo-50 ring-indigo-500 dark:bg-indigo-500/10'
                      : 'bg-white ring-slate-200 hover:ring-indigo-300 dark:bg-slate-800/60 dark:ring-white/10',
                  )}
                >
                  <GameIcon type={type} size="sm" />
                  <span className="text-sm sm:text-base">{t(type === 'wordsearch' ? 'game.wordsearch' : 'game.hangman')}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title={t('editor.section.details')}>
            <Field label={t('editor.title')} error={visible.title} counter={t('editor.chars', { count: draft.title.length, max: LIMITS.title })}>
              {({ id, describedBy, invalid }) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={draft.title}
                  maxLength={LIMITS.title}
                  placeholder={t('editor.titlePlaceholder')}
                  onChange={(e) => update({ title: e.target.value })}
                  data-testid="title-input"
                />
              )}
            </Field>
            <Field
              label={t('editor.instructions')}
              error={visible.instructions}
              counter={t('editor.chars', { count: draft.instructions.length, max: LIMITS.instructions })}
            >
              {({ id, describedBy, invalid }) => (
                <TextArea
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  rows={3}
                  value={draft.instructions}
                  maxLength={LIMITS.instructions}
                  placeholder={t('editor.instructionsPlaceholder')}
                  onChange={(e) => update({ instructions: e.target.value })}
                  data-testid="instructions-input"
                />
              )}
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('editor.language')}</p>
                <Segmented<ContentLanguage>
                  label={t('editor.language')}
                  value={draft.language}
                  onChange={(language) => update({ language })}
                  options={[
                    { value: 'es', label: t('lang.es') },
                    { value: 'en', label: t('lang.en') },
                  ]}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('editor.languageHelp')}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('editor.difficulty')}</p>
                <Segmented<Difficulty>
                  label={t('editor.difficulty')}
                  value={draft.difficulty}
                  onChange={setDifficulty}
                  options={[
                    { value: 'easy', label: t('difficulty.easy') },
                    { value: 'medium', label: t('difficulty.medium') },
                    { value: 'hard', label: t('difficulty.hard') },
                  ]}
                />
              </div>
            </div>
          </Section>

          <Section title={t('editor.section.content')}>
            {ws && (
              <WordSearchFields
                activity={ws}
                wordsText={wordsText}
                onWordsText={setWords}
                wordErrors={wordErrors}
                onChange={(patch) => setDraft({ ...ws, wordsearch: { ...ws.wordsearch, ...patch } })}
              />
            )}
            {hm && <HangmanFields activity={hm} secretErrors={visible.secret} onChange={(patch) => setDraft({ ...hm, hangman: { ...hm.hangman, ...patch } })} />}
          </Section>

          <Section title={t('editor.section.options')}>
            <Toggle label={t('editor.timer')} description={t('editor.timerHelp')} checked={draft.timerEnabled} onChange={(timerEnabled) => update({ timerEnabled })} />
            {draft.timerEnabled && (
              <Field label={t('editor.timeLimit')} error={visible.timeLimit}>
                {({ id }) => (
                  <Select id={id} value={draft.timeLimitSec} onChange={(e) => update({ timeLimitSec: Number(e.target.value) })}>
                    {TIME_LIMITS.map((m) => (
                      <option key={m} value={m * 60}>
                        {m === 0 ? t('editor.timeLimitNone') : `${m} ${t('common.minutes')}`}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            )}
            <Toggle label={t('editor.hints')} description={t('editor.hintsHelp')} checked={draft.hintsEnabled} onChange={(hintsEnabled) => update({ hintsEnabled })} />
          </Section>
          <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
        </form>

        <aside className="card sticky top-20 space-y-3 p-5">
          <div className="flex items-center gap-3">
            <GameIcon type={draft.type} />
            <div className="min-w-0">
              <p className="truncate font-bold">{draft.title.trim() || t('common.untitled')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t(draft.type === 'wordsearch' ? 'game.wordsearch' : 'game.hangman')} · {t(`difficulty.${draft.difficulty}`)}
              </p>
            </div>
          </div>
          {dirty && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">{t('editor.unsaved')}</p>}
          {showErrors && issues.length > 0 && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
              {t('editor.fixErrors')}
            </p>
          )}
          <Button variant="primary" icon={Save} className="w-full" onClick={() => save(false)} data-testid="save-activity">
            {t('common.save')}
          </Button>
          <Button variant="success" icon={Share2} className="w-full" onClick={() => save(true)} data-testid="save-share">
            {t('editor.saveAndShare')}
          </Button>
          <Button
            icon={Eye}
            className="w-full"
            onClick={() => {
              setShowErrors(true);
              if (issues.length) {
                toast(t('editor.fixErrors'), 'error');
                return;
              }
              setPreviewKey((k) => k + 1);
              setPreviewOpen(true);
            }}
            data-testid="preview-activity"
          >
            {t('common.preview')}
          </Button>
        </aside>
      </div>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} title={t('preview.title')} description={t('preview.note')} size="xl">
        <ActivityPlayer key={previewKey} activity={tidyActivity(draft)} activityKey={`preview-${draft.id}`} preview />
      </Dialog>
      <ShareDialog activity={saved} open={shareOpen && !!saved} onClose={() => setShareOpen(false)} />
    </div>
  );
}
