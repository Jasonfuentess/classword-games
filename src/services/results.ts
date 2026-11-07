import type { GameType, ResultRecord } from '../types/activity';
import type { TranslateFn } from '../i18n/translate';
import { formatDate, formatTime } from '../utils/format';

export function buildResultSummary(r: ResultRecord, t: TranslateFn, locale: string): string {
  const gameName = t(r.gameType === 'wordsearch' ? 'game.wordsearch' : 'game.hangman');
  const stars = '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars);
  return [
    `🎓 ${t('result.summary.title')}`,
    `${t('result.summary.activity')}: ${r.activityTitle}`,
    `${t('result.summary.game')}: ${gameName}`,
    `${t('result.summary.player')}: ${r.playerName || t('result.anonymous')}`,
    `${t('result.summary.status')}: ${r.completed ? `✅ ${t('result.summary.completed')}` : `❌ ${t('result.summary.notCompleted')}`}`,
    `${t('result.score')}: ${r.score}/${r.maxScore} ${stars}`,
    `${t('result.time')}: ${formatTime(r.elapsedSec)}`,
    `${t('result.errors')}: ${r.errors}`,
    `${t('result.hints')}: ${r.hintsUsed}`,
    `${t('result.summary.date')}: ${formatDate(r.playedAt, locale)}`,
  ].join('\n');
}

export function gameLabelKey(type: GameType) {
  return type === 'wordsearch' ? ('game.wordsearch' as const) : ('game.hangman' as const);
}
