import type confettiType from 'canvas-confetti';

export function celebrate(): void {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  // Loaded on demand: only needed at the moment a player wins.
  import('canvas-confetti').then(({ default: confetti }) => burst(confetti)).catch(() => {});
}

function burst(confetti: typeof confettiType): void {
  const colors = ['#4f46e5', '#8b5cf6', '#14b8a6', '#38bdf8', '#facc15'];
  const fire = (ratio: number, opts: confettiType.Options) =>
    confetti({ origin: { y: 0.7 }, colors, disableForReducedMotion: true, particleCount: Math.floor(220 * ratio), ...opts });
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}
