import { describe, expect, it } from 'vitest';
import { ACTIVITIES_KEY, activityStore, deleteActivity, getActivity, listActivities, saveActivity } from '../../src/storage/activities';
import { addResult, bestScoreFor, resultStore, RESULTS_KEY } from '../../src/storage/results';
import { PREFERENCES_KEY, preferenceStore, resetPreferences, updatePreferences } from '../../src/storage/preferences';
import { createActivity } from '../../src/services/activityFactory';
import type { ResultRecord } from '../../src/types/activity';

function sample(title: string) {
  const a = createActivity('hangman', 'es');
  a.title = title;
  if (a.type === 'hangman') a.hangman.secret = 'Hola';
  return a;
}

describe('local persistence', () => {
  it('saves, reloads, updates and deletes activities', () => {
    activityStore.reload();
    const a = sample('Primera');
    saveActivity(a);
    expect(JSON.parse(localStorage.getItem(ACTIVITIES_KEY)!)).toHaveLength(1);

    // Simulates a page refresh: the store re-reads localStorage.
    activityStore.reload();
    expect(getActivity(a.id)?.title).toBe('Primera');

    saveActivity({ ...a, title: 'Editada', updatedAt: a.updatedAt + 1 });
    activityStore.reload();
    expect(listActivities()).toHaveLength(1);
    expect(getActivity(a.id)?.title).toBe('Editada');

    deleteActivity(a.id);
    activityStore.reload();
    expect(listActivities()).toHaveLength(0);
  });

  it('survives corrupted storage', () => {
    localStorage.setItem(ACTIVITIES_KEY, '{not json');
    activityStore.reload();
    expect(listActivities()).toEqual([]);
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify([{ bogus: true }, sample('Válida')]));
    activityStore.reload();
    expect(listActivities().map((a) => a.title)).toEqual(['Válida']);
  });

  it('stores results history and best score', () => {
    resultStore.reload();
    const r: ResultRecord = {
      id: '1', activityKey: 'k', activityTitle: 'T', gameType: 'hangman', playerName: 'Ana', score: 500, maxScore: 1000,
      stars: 1, completed: true, errors: 2, hintsUsed: 0, elapsedSec: 30, playedAt: Date.now(),
    };
    addResult(r);
    addResult({ ...r, id: '2', score: 800 });
    resultStore.reload();
    expect(resultStore.get()).toHaveLength(2);
    expect(bestScoreFor('k')).toBe(800);
    expect(bestScoreFor('other')).toBeNull();
    expect(JSON.parse(localStorage.getItem(RESULTS_KEY)!)).toHaveLength(2);
  });

  it('persists and resets preferences', () => {
    updatePreferences({ theme: 'dark', language: 'es', sound: false });
    preferenceStore.reload();
    expect(preferenceStore.get()).toMatchObject({ theme: 'dark', language: 'es', sound: false });
    resetPreferences();
    expect(localStorage.getItem(PREFERENCES_KEY)).toBeNull();
    expect(preferenceStore.get().theme).toBe('system');
    expect(preferenceStore.get().sound).toBe(true);
  });
});
