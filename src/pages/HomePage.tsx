import { motion } from 'motion/react';
import { ArrowRight, FolderOpen, GraduationCap, Play, Plus, School, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import { ButtonLink } from '../components/ui/Button';
import { GameIcon } from '../components/GameIcon';
import { ResultList } from '../components/ResultList';
import { useActivities, useResults } from '../hooks/useStores';
import type { GameType } from '../types/activity';
import type { TranslationKey } from '../i18n/en';

function MiniGrid() {
  const letters = 'CLASSWORDXGAMESQPLAYZFUNKLEARN'.split('');
  const highlight = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14]);
  return (
    <div className="grid grid-cols-6 gap-1.5" aria-hidden="true">
      {letters.slice(0, 30).map((l, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 + i * 0.02 }}
          className={
            highlight.has(i)
              ? 'flex aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow sm:text-base'
              : 'flex aspect-square items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-500 ring-1 ring-slate-200 sm:text-base dark:bg-slate-800 dark:text-slate-300 dark:ring-white/10'
          }
        >
          {l}
        </motion.span>
      ))}
    </div>
  );
}

function GameCard({ type, delay }: { type: GameType; delay: number }) {
  const { t } = useI18n();
  const ws = type === 'wordsearch';
  const example = ws ? 'sample-ws-animals-es' : 'sample-hm-en';
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card group relative flex flex-col overflow-hidden p-6 transition hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className={`absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl ${ws ? 'bg-sky-400/20' : 'bg-teal-400/20'}`} aria-hidden="true" />
      <GameIcon type={type} size="lg" />
      <h3 className="mt-4 text-xl font-bold">{t(ws ? 'home.ws.title' : 'home.hm.title')}</h3>
      <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-300">{t(ws ? 'home.ws.desc' : 'home.hm.desc')}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <ButtonLink to={`/create?type=${type}`} variant="primary" icon={Plus} data-testid={`create-${type}`}>
          {t('home.createThis')}
        </ButtonLink>
        <ButtonLink to={`/play/${example}`} variant="ghost" iconRight={ArrowRight}>
          {t('home.tryExample')}
        </ButtonLink>
      </div>
    </motion.article>
  );
}

function Steps({ title, icon: Icon, keys }: { title: string; icon: typeof School; keys: TranslationKey[] }) {
  const { t } = useI18n();
  return (
    <div className="card p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
        <Icon size={20} className="text-indigo-500" aria-hidden="true" />
        {title}
      </h3>
      <ol className="space-y-3">
        {keys.map((k, i) => (
          <li key={k} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
              {i + 1}
            </span>
            {t(k)}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function HomePage() {
  const { t } = useI18n();
  const activities = useActivities();
  const results = useResults();

  return (
    <div className="space-y-14">
      <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100 dark:bg-white/5 dark:text-indigo-200 dark:ring-white/10">
            <Sparkles size={14} aria-hidden="true" />
            {t('home.badge')}
          </span>
          <h1 className="mt-5 text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-gradient">{t('home.title')}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">{t('home.subtitle')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/create" variant="primary" size="lg" icon={Plus} data-testid="home-create">
              {t('home.create')}
            </ButtonLink>
            <ButtonLink to="/play" variant="success" size="lg" icon={Play}>
              {t('home.play')}
            </ButtonLink>
            <ButtonLink to="/activities" size="lg" icon={FolderOpen}>
              {t('home.myActivities')}
            </ButtonLink>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, rotate: -2, scale: 0.95 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 18 }}
          className="card mx-auto w-full max-w-sm p-5"
        >
          <MiniGrid />
        </motion.div>
      </section>

      <section aria-labelledby="games-heading">
        <h2 id="games-heading" className="mb-5 text-2xl font-bold">
          {t('home.games')}
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          <GameCard type="wordsearch" delay={0.1} />
          <GameCard type="hangman" delay={0.2} />
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <Steps title={t('home.creators')} icon={School} keys={['home.creators.1', 'home.creators.2', 'home.creators.3']} />
        <Steps title={t('home.students')} icon={GraduationCap} keys={['home.students.1', 'home.students.2', 'home.students.3']} />
      </section>

      {(activities.length > 0 || results.length > 0) && (
        <section className="grid gap-5 md:grid-cols-2">
          {activities.length > 0 && (
            <div className="card p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">{t('home.recent')}</h2>
                <Link to="/activities" className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300">
                  {t('home.seeAll')}
                </Link>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-white/5">
                {activities.slice(0, 4).map((a) => (
                  <li key={a.id}>
                    <Link to={`/play/${a.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-slate-50 dark:hover:bg-white/5">
                      <GameIcon type={a.type} size="sm" />
                      <span className="min-w-0 flex-1 truncate font-semibold">{a.title}</span>
                      <ArrowRight size={16} className="text-slate-400" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {results.length > 0 && (
            <div className="card p-6">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-bold">{t('home.recentResults')}</h2>
                <Link to="/play" className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300">
                  {t('home.seeAll')}
                </Link>
              </div>
              <ResultList results={results.slice(0, 4)} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
