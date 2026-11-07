import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Link as LinkIcon, Trophy } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import { extractShareCode } from '../services/share';
import { SAMPLE_ACTIVITIES } from '../data/samples';
import { useActivities, useResults } from '../hooks/useStores';
import { Button } from '../components/ui/Button';
import { Field, TextInput } from '../components/ui/Field';
import { Badge, PageHeader } from '../components/ui/misc';
import { GameIcon } from '../components/GameIcon';
import { ResultList } from '../components/ResultList';
import type { Activity } from '../types/activity';

function ActivityTile({ activity }: { activity: Activity }) {
  const { t } = useI18n();
  return (
    <Link to={`/play/${activity.id}`} className="card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-2xl">
      <GameIcon type={activity.type} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{activity.title}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Badge>{t(activity.type === 'wordsearch' ? 'game.wordsearch' : 'game.hangman')}</Badge>
          <Badge tone="indigo">{t(`difficulty.${activity.difficulty}`)}</Badge>
          <Badge tone="teal">{activity.language.toUpperCase()}</Badge>
        </div>
      </div>
      <ArrowRight size={18} className="text-slate-400 transition group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  );
}

export function PlayHubPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const mine = useActivities();
  const results = useResults();
  const [link, setLink] = useState('');
  const [error, setError] = useState('');

  const open = () => {
    const code = extractShareCode(link);
    if (!code) {
      setError(t('play.invalidLink'));
      return;
    }
    navigate(`/p/${code}`);
  };

  return (
    <div className="space-y-10">
      <PageHeader title={t('play.title')} subtitle={t('play.subtitle')} />

      <form
        className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          open();
        }}
      >
        <Field label={t('play.pasteLabel')} error={error} className="flex-1">
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={link}
              inputMode="url"
              placeholder={t('play.pastePlaceholder')}
              onChange={(e) => {
                setLink(e.target.value);
                setError('');
              }}
            />
          )}
        </Field>
        <Button type="submit" variant="primary" icon={LinkIcon} className="sm:mb-[1px]">
          {t('play.open')}
        </Button>
      </form>

      <section>
        <h2 className="mb-4 text-xl font-bold">{t('play.examples')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {SAMPLE_ACTIVITIES.map((a) => (
            <ActivityTile key={a.id} activity={a} />
          ))}
        </div>
      </section>

      {mine.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">{t('play.mine')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {mine.slice(0, 6).map((a) => (
              <ActivityTile key={a.id} activity={a} />
            ))}
          </div>
        </section>
      )}

      <section className="card p-6">
        <h2 className="mb-2 flex items-center gap-2 text-xl font-bold">
          <Trophy size={20} className="text-amber-500" aria-hidden="true" />
          {t('play.history')}
        </h2>
        {results.length ? <ResultList results={results.slice(0, 20)} /> : <p className="py-4 text-sm text-slate-500 dark:text-slate-400">{t('play.noHistory')}</p>}
      </section>
    </div>
  );
}
