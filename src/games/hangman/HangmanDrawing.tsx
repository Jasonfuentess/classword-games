import type { ReactElement } from 'react';
import { motion } from 'motion/react';

const TOTAL_PARTS = 10;

/**
 * Ten drawing steps. When fewer errors are allowed, the first parts (gallows) are
 * pre-drawn so the figure is always complete exactly on the last allowed error.
 */
export function HangmanDrawing({ errors, maxErrors, lost, won }: { errors: number; maxErrors: number; lost: boolean; won: boolean }) {
  const visible = Math.min(TOTAL_PARTS, TOTAL_PARTS - maxErrors + errors);
  const stroke = 'currentColor';
  const part = (index: number, el: ReactElement) => (index < visible ? el : null);
  const draw = { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { duration: 0.4 } };

  return (
    <svg viewBox="0 0 200 220" className="h-full w-full text-slate-700 dark:text-slate-200" role="img" aria-label={`${errors}/${maxErrors}`}>
      <g fill="none" stroke={stroke} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
        {part(0, <motion.path key="base" d="M20 205 H140" {...draw} />)}
        {part(1, <motion.path key="pole" d="M50 205 V20" {...draw} />)}
        {part(2, <motion.path key="beam" d="M50 20 H140" {...draw} />)}
        {part(3, <motion.path key="rope" d="M140 20 V48" {...draw} stroke="#8b5cf6" />)}
      </g>
      <g fill="none" stroke={lost ? '#f43f5e' : won ? '#14b8a6' : '#6366f1'} strokeWidth={5} strokeLinecap="round">
        {part(4, <motion.circle key="head" cx="140" cy="66" r="18" {...draw} />)}
        {part(5, <motion.path key="body" d="M140 84 V138" {...draw} />)}
        {part(6, <motion.path key="arm-l" d="M140 98 L116 120" {...draw} />)}
        {part(7, <motion.path key="arm-r" d="M140 98 L164 120" {...draw} />)}
        {part(8, <motion.path key="leg-l" d="M140 138 L120 172" {...draw} />)}
        {part(9, <motion.path key="leg-r" d="M140 138 L160 172" {...draw} />)}
        {visible > 4 && lost && <path d="M132 60 l6 6 m0 -6 l-6 6 M144 60 l6 6 m0 -6 l-6 6" strokeWidth={2.5} />}
        {visible > 4 && won && <path d="M132 72 q8 7 16 0" strokeWidth={2.5} />}
      </g>
    </svg>
  );
}
