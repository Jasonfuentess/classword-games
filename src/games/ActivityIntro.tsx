import { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Gauge, Globe, Grid3x3, Heart, Lightbulb, Play, Trophy } from 'lucide-react';
import type { Activity } from '../types/activity';
import { useI18n } from '../i18n/useI18n';
import { Button } from '../components/ui/Button';
import { Field, TextInput } from '../components/ui/Field';
import { Badge } from '../components/ui/misc';
import { GameIcon } from '../components/GameIcon';

interface IntroProps {
  activity: Activity;
  bestScore: number | null;
  initialName: string;
  onStart: (playerName: string) => void;
}

export function ActivityIntro({ activity, bestScore, initialName, onStart }: IntroProps) {
  const { t } = useI18n();
  const [name, setName] = useState(initialName);
  const isWs = activity.type === 'wordsearch';

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-xl">
      <form
        className="card overflow-hidden"
        onSubmit={(e) => {
          e.preventDefault();
          onStart(name.trim());
        }}
      >
        <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-teal-500 px-6 pt-8 pb-7 text-white">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" aria-hidden="true" />
          <div className="relative flex items-center gap-3">
            <GameIcon type={activity.type} size="lg" inverted />
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wider text-white/80 uppercase">{t(isWs ? 'game.wordsearch' : 'game.hangman')}</p>
              <h1 className="text-2xl font-extrabold break-words sm:text-3xl" data-testid="activity-title">
                {activity.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex flex-wrap gap-2">
            <Badge tone="indigo" icon={Gauge}>
              {t(`difficulty.${activity.difficulty}`)}
            </Badge>
            <Badge tone="slate" icon={Globe}>
              {t(`lang.${activity.language}`)}
            </Badge>
            {isWs ? (
              <Badge tone="teal" icon={Grid3x3}>
                {t('intro.wordCount', { count: activity.wordsearch.words.length })}
              </Badge>
            ) : (
              <Badge tone="rose" icon={Heart}>
                {t('intro.errorsAllowed', { count: activity.hangman.maxErrors })}
              </Badge>
            )}
            {activity.timerEnabled && (
              <Badge tone="violet" icon={Clock}>
                {activity.timeLimitSec > 0 ? t('intro.timeLimit', { min: Math.round(activity.timeLimitSec / 60) }) : t('intro.timer')}
              </Badge>
            )}
            <Badge tone="amber" icon={Lightbulb}>
              {activity.hintsEnabled ? t('intro.hints') : t('intro.noHints')}
            </Badge>
          </div>

          {activity.instructions && (
            <div>
              <h2 className="mb-1 text-sm font-bold text-slate-500 dark:text-slate-400">{t('intro.instructions')}</h2>
              <p className="whitespace-pre-line text-slate-700 dark:text-slate-200">{activity.instructions}</p>
            </div>
          )}

          {bestScore !== null && (
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-300">
              <Trophy size={16} aria-hidden="true" />
              {t('intro.best', { score: bestScore })}
            </p>
          )}

          <Field label={t('intro.name')}>
            {({ id }) => (
              <TextInput
                id={id}
                value={name}
                maxLength={40}
                autoComplete="given-name"
                placeholder={t('intro.namePlaceholder')}
                onChange={(e) => setName(e.target.value)}
              />
            )}
          </Field>

          <Button type="submit" variant="primary" size="lg" icon={Play} className="w-full" data-testid="start-game">
            {t('intro.start')}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
