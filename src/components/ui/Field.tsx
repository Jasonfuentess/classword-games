import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/format';

const CONTROL =
  'w-full rounded-2xl border-0 bg-white px-4 py-3 text-base text-slate-900 shadow-sm ring-1 ring-slate-200 transition placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800/80 dark:text-slate-100 dark:ring-white/10 dark:placeholder:text-slate-500';
const INVALID = 'ring-2 ring-rose-400 dark:ring-rose-500/70';

interface FieldProps {
  label: string;
  help?: ReactNode;
  error?: string | string[];
  counter?: string;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
  className?: string;
}

export function Field({ label, help, error, counter, children, className }: FieldProps) {
  const id = useId();
  const errors = (Array.isArray(error) ? error : error ? [error] : []).filter(Boolean);
  const helpId = help ? `${id}-help` : undefined;
  const errorId = errors.length ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {label}
        </label>
        {counter && <span className="text-xs tabular-nums text-slate-400">{counter}</span>}
      </div>
      {children({ id, describedBy, invalid: errors.length > 0 })}
      {help && (
        <p id={helpId} className="text-xs text-slate-500 dark:text-slate-400">
          {help}
        </p>
      )}
      {errors.length > 0 && (
        <div id={errorId} role="alert" className="space-y-1">
          {errors.map((e) => (
            <p key={e} className="flex items-start gap-1.5 text-sm font-medium text-rose-600 dark:text-rose-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {e}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function TextInput({ invalid, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input aria-invalid={invalid || undefined} className={cn(CONTROL, invalid && INVALID, className)} {...rest} />;
}

export function TextArea({ invalid, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea aria-invalid={invalid || undefined} className={cn(CONTROL, 'min-h-24 resize-y', invalid && INVALID, className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CONTROL, 'appearance-none bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat pr-10', className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...rest}>
      {children}
    </select>
  );
}
