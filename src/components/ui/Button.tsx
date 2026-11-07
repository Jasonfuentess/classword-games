import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/format';
import { buttonClasses, type Size, type Variant } from './buttonStyles';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, CommonProps & ButtonHTMLAttributes<HTMLButtonElement>>(
  function Button({ variant, size, icon: Icon, iconRight: IconRight, className, children, type = 'button', ...rest }, ref) {
    const iconSize = size === 'lg' ? 20 : size === 'sm' ? 16 : 18;
    return (
      <button ref={ref} type={type} className={buttonClasses(variant, size, className)} {...rest}>
        {Icon && <Icon size={iconSize} aria-hidden="true" />}
        {children}
        {IconRight && <IconRight size={iconSize} aria-hidden="true" />}
      </button>
    );
  },
);

export function ButtonLink({ variant, size, icon: Icon, iconRight: IconRight, className, children, ...rest }: CommonProps & LinkProps) {
  const iconSize = size === 'lg' ? 20 : size === 'sm' ? 16 : 18;
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {Icon && <Icon size={iconSize} aria-hidden="true" />}
      {children}
      {IconRight && <IconRight size={iconSize} aria-hidden="true" />}
    </Link>
  );
}

export function IconButton({
  label,
  icon: Icon,
  className,
  active,
  ...rest
}: { label: string; icon: LucideIcon; active?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-900/5 active:scale-95 dark:text-slate-300 dark:hover:bg-white/10',
        active && 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200',
        className,
      )}
      {...rest}
    >
      <Icon size={20} aria-hidden="true" />
    </button>
  );
}
