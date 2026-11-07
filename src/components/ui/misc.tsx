import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/format';

export function Badge({ children, tone = 'slate', icon: Icon }: { children: ReactNode; tone?: 'slate' | 'indigo' | 'teal' | 'violet' | 'amber' | 'rose'; icon?: LucideIcon }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200',
    teal: 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-200',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone])}>
      {Icon && <Icon size={13} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-400 transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Stat({ icon: Icon, label, value, tone = 'indigo' }: { icon: LucideIcon; label: string; value: ReactNode; tone?: 'indigo' | 'teal' | 'violet' | 'rose' | 'amber' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  };
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0 leading-tight">
        <div className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">{label}</div>
        <div className="text-base font-bold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, actions }: { icon: LucideIcon; title: string; body: string; actions?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-teal-400 text-white shadow-lg shadow-indigo-500/30">
        <Icon size={30} aria-hidden="true" />
      </span>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{body}</p>
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
