import type { ResultRecord } from '../types/activity';
import { createStore, readJson, writeJson } from './storage';

export const RESULTS_KEY = 'cwg.results';
const MAX_RESULTS = 100;

function isResult(v: unknown): v is ResultRecord {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return typeof r.id === 'string' && typeof r.activityTitle === 'string' && typeof r.score === 'number' && typeof r.playedAt === 'number';
}

export const resultStore = createStore<ResultRecord[]>(() => {
  const raw = readJson<unknown>(RESULTS_KEY, []);
  return Array.isArray(raw) ? raw.filter(isResult) : [];
});

export function addResult(result: ResultRecord): void {
  const next = [result, ...resultStore.get()].slice(0, MAX_RESULTS);
  writeJson(RESULTS_KEY, next);
  resultStore.set(next);
}

export function clearResults(): void {
  writeJson(RESULTS_KEY, []);
  resultStore.set([]);
}

export function bestScoreFor(activityKey: string): number | null {
  const scores = resultStore.get().filter((r) => r.activityKey === activityKey).map((r) => r.score);
  return scores.length ? Math.max(...scores) : null;
}
