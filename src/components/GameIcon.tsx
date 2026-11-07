import { Grid3x3, Type } from 'lucide-react';
import type { GameType } from '../types/activity';
import { cn } from '../utils/format';

export function GameIcon({ type, size = 'md', inverted }: { type: GameType; size?: 'sm' | 'md' | 'lg'; inverted?: boolean }) {
  const Icon = type === 'wordsearch' ? Grid3x3 : Type;
  const box = { sm: 'h-9 w-9 rounded-xl', md: 'h-12 w-12 rounded-2xl', lg: 'h-14 w-14 rounded-2xl' }[size];
  const icon = { sm: 18, md: 24, lg: 28 }[size];
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center',
        box,
        inverted
          ? 'bg-white/20 text-white ring-1 ring-white/30 backdrop-blur'
          : type === 'wordsearch'
            ? 'bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-lg shadow-indigo-500/25'
            : 'bg-gradient-to-br from-violet-500 to-teal-400 text-white shadow-lg shadow-violet-500/25',
      )}
    >
      <Icon size={icon} aria-hidden="true" />
    </span>
  );
}
