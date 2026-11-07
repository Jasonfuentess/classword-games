import { preferenceStore } from '../storage/preferences';

/** Tiny synthesized sound effects (Web Audio) — no audio files to download. */
type SoundName = 'select' | 'correct' | 'wrong' | 'win' | 'lose' | 'hint';

const PATTERNS: Record<SoundName, Array<[freq: number, dur: number, type?: OscillatorType]>> = {
  select: [[660, 0.05, 'sine']],
  correct: [[660, 0.09], [880, 0.12]],
  wrong: [[220, 0.15, 'triangle'], [180, 0.18, 'triangle']],
  hint: [[740, 0.08], [990, 0.08]],
  win: [[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.25]],
  lose: [[392, 0.18, 'triangle'], [330, 0.18, 'triangle'], [262, 0.3, 'triangle']],
};

let ctx: AudioContext | null = null;

export function playSound(name: SoundName): void {
  if (!preferenceStore.get().sound) return;
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    ctx ??= new AudioCtx();
    if (ctx.state === 'suspended') void ctx.resume();
    let t = ctx.currentTime;
    for (const [freq, dur, type = 'sine'] of PATTERNS[name]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      t += dur * 0.9;
    }
  } catch {
    /* Audio is optional. */
  }
}
