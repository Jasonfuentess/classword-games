import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, FolderOpen, Pencil, Play, Plus, Search, Share2, Sparkles, Trash2, Trophy } from 'lucide-react';
import type { Activity, GameType } from '../types/activity';
import { useI18n } from '../i18n/useI18n';
import { useActivities, useResults } from '../hooks/useStores';
import { deleteActivity, saveActivity } from '../storage/activities';
import { duplicateActivity } from '../services/activityFactory';
import { SAMPLE_ACTIVITIES } from '../data/samples';
import { newId, newSeed } from '../utils/random';
import { formatDate } from '../utils/format';
import { Button, ButtonLink, IconButton } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/Dialog';
import { Badge, EmptyState, PageHeader } from '../components/ui/misc';
import { Segmented } from '../components/ui/Segmented';
import { TextInput } from '../components/ui/Field';
import { useToast } from '../components/ui/useToast';
import { GameIcon } from '../components/GameIcon';
import { ShareDialog } from '../components/ShareDialog';

type Filter = 'all' | GameType;

export function MyActivitiesPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const activities = useActivities();
  const results = useResults();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [toDelete, setToDelete] = useState<Activity | null>(null);
  const [sharing, setSharing] = useState<Activity | null>(null);

  const bestById = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of results) map.set(r.activityKey, Math.max(map.get(r.activityKey) ?? 0, r.score));
    return map;
  }, [results]);

  const visible = activities.filter(
    (a) => (filter === 'all' || a.type === filter) && a.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );

  const loadExamples = () => {
    const now = Date.now();
    SAMPLE_ACTIVITIES.forEach((s, i) => {
      const copy = structuredClone(s);
      copy.id = newId();
      copy.createdAt = copy.updatedAt = now - i;
      if (copy.type === 'wordsearch') copy.wordsearch.seed = newSeed();
      saveActivity(copy);
    });
    toast(t('activities.examplesAdded'));
  };

  const duplicate = (a: Activity) => {
    const ok = saveActivity(duplicateActivity(a, t('common.copySuffix')));
    toast(ok ? t('activities.duplicated') : t('activities.saveFailed'), ok ? 'success' : 'error');
  };

  return (
    <div>
      <PageHeader
        title={t('activities.title')}
        subtitle={t('activities.subtitle')}
        actions={
          <ButtonLink to="/create" variant="primary" icon={Plus} data-testid="new-activity">
            {t('activities.new')}
          </ButtonLink>
        }
      />

      {activities.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={t('activities.empty.title')}
          body={t('activities.empty.body')}
          actions={
            <>
              <ButtonLink to="/create" variant="primary" icon={Plus}>
                {t('home.create')}
              </ButtonLink>
              <Button icon={Sparkles} onClick={loadExamples} data-testid="load-examples">
                {t('activities.loadExamples')}
              </Button>
            </>
          }
        />
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <TextInput aria-label={t('activities.search')} placeholder={t('activities.search')} value={query} onChange={(e) => setQuery(e.target.value)} className="pl-11" type="search" />
            </div>
            <div className="sm:w-80">
              <Segmented<Filter>
                label="Filter"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: t('activities.filter.all') },
                  { value: 'wordsearch', label: t('game.wordsearch') },
                  { value: 'hangman', label: t('game.hangman') },
                ]}
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="card p-8 text-center text-slate-500">{t('activities.noMatch')}</p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="activity-list">
              <AnimatePresence initial={false}>
                {visible.map((a) => {
                  const best = bestById.get(a.id);
                  return (
                    <motion.li
                      key={a.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="card flex flex-col p-5"
                      data-testid="activity-card"
                    >
                      <div className="flex items-start gap-3">
                        <GameIcon type={a.type} />
                        <div className="min-w-0 flex-1">
                          <h2 className="line-clamp-2 font-bold break-words">{a.title}</h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{t('activities.updated', { date: formatDate(a.updatedAt, locale) })}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Badge>{t(a.type === 'wordsearch' ? 'game.wordsearch' : 'game.hangman')}</Badge>
                        <Badge tone="indigo">{t(`difficulty.${a.difficulty}`)}</Badge>
                        <Badge tone="teal">
                          {a.type === 'wordsearch' ? t('activities.words', { count: a.wordsearch.words.length }) : t('activities.errors', { count: a.hangman.maxErrors })}
                        </Badge>
                        {best !== undefined && (
                          <Badge tone="amber" icon={Trophy}>
                            {t('activities.best', { score: best })}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-3 dark:border-white/5">
                        <ButtonLink to={`/play/${a.id}`} size="sm" variant="soft" icon={Play}>
                          {t('common.play')}
                        </ButtonLink>
                        <Button size="sm" variant="ghost" icon={Share2} onClick={() => setSharing(a)} data-testid="share-activity">
                          {t('common.share')}
                        </Button>
                        <div className="ml-auto flex">
                          <IconButton label={t('common.edit')} icon={Pencil} onClick={() => navigate(`/edit/${a.id}`)} />
                          <IconButton label={t('common.duplicate')} icon={Copy} onClick={() => duplicate(a)} />
                          <IconButton label={t('common.delete')} icon={Trash2} className="hover:text-rose-600" onClick={() => setToDelete(a)} />
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!toDelete}
        danger
        title={t('activities.deleteTitle')}
        body={t('activities.deleteBody', { title: toDelete?.title ?? '' })}
        confirmLabel={t('common.delete')}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) deleteActivity(toDelete.id);
          setToDelete(null);
          toast(t('activities.deleted'));
        }}
      />
      <ShareDialog activity={sharing} open={!!sharing} onClose={() => setSharing(null)} />
    </div>
  );
}
