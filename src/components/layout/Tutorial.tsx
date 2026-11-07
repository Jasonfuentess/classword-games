import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PencilRuler, Play, Share2 } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useI18n } from '../../i18n/useI18n';
import { usePreferences } from '../../hooks/usePreferences';
import { updatePreferences } from '../../storage/preferences';
import { cn } from '../../utils/format';

const STEPS = [
  { icon: PencilRuler, title: 'tutorial.step1.title', body: 'tutorial.step1.body', color: 'from-indigo-500 to-violet-500' },
  { icon: Share2, title: 'tutorial.step2.title', body: 'tutorial.step2.body', color: 'from-violet-500 to-fuchsia-500' },
  { icon: Play, title: 'tutorial.step3.title', body: 'tutorial.step3.body', color: 'from-teal-400 to-sky-500' },
] as const;

/** Short first-visit onboarding. Not shown on shared-link pages so students go straight to the game. */
export function Tutorial({ suppressed }: { suppressed: boolean }) {
  const { t } = useI18n();
  const { tutorialSeen } = usePreferences();
  const [step, setStep] = useState(0);
  const open = !tutorialSeen && !suppressed;
  const finish = () => {
    updatePreferences({ tutorialSeen: true });
    setStep(0);
  };
  const current = STEPS[step];
  const Icon = current.icon;
  const last = step === STEPS.length - 1;

  return (
    <Dialog
      open={open}
      onClose={finish}
      title={t('tutorial.title')}
      size="sm"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={finish}>
            {t('tutorial.skip')}
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button size="sm" onClick={() => setStep((s) => s - 1)}>
                {t('tutorial.back')}
              </Button>
            )}
            <Button variant="primary" size="sm" data-autofocus onClick={() => (last ? finish() : setStep((s) => s + 1))}>
              {last ? t('tutorial.done') : t('tutorial.next')}
            </Button>
          </div>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex flex-col items-center text-center"
        >
          <span className={cn('mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br text-white shadow-xl', current.color)}>
            <Icon size={38} aria-hidden="true" />
          </span>
          <h3 className="text-xl font-bold">{t(current.title)}</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t(current.body)}</p>
        </motion.div>
      </AnimatePresence>
      <div className="mt-6 flex justify-center gap-2" aria-hidden="true">
        {STEPS.map((_, i) => (
          <span key={i} className={cn('h-2 rounded-full transition-all', i === step ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-300 dark:bg-slate-600')} />
        ))}
      </div>
    </Dialog>
  );
}
