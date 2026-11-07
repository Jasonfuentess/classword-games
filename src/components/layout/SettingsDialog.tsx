import { useState } from 'react';
import { BookOpen, RotateCcw, Trash2 } from 'lucide-react';
import { Dialog, ConfirmDialog } from '../ui/Dialog';
import { Segmented } from '../ui/Segmented';
import { Toggle } from '../ui/Toggle';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';
import { useI18n } from '../../i18n/useI18n';
import { usePreferences } from '../../hooks/usePreferences';
import { resetPreferences, updatePreferences, type ThemePreference } from '../../storage/preferences';
import { clearResults } from '../../storage/results';

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, setLocale, locale } = useI18n();
  const prefs = usePreferences();
  const toast = useToast();
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <>
      <Dialog open={open && !confirmClear} onClose={onClose} title={t('settings.title')} description={t('settings.privacy')}>
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold">{t('settings.language')}</p>
            <Segmented
              label={t('settings.language')}
              value={locale}
              onChange={setLocale}
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Español' },
              ]}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">{t('settings.theme')}</p>
            <Segmented<ThemePreference>
              label={t('settings.theme')}
              value={prefs.theme}
              onChange={(theme) => updatePreferences({ theme })}
              options={[
                { value: 'light', label: t('settings.theme.light') },
                { value: 'dark', label: t('settings.theme.dark') },
                { value: 'system', label: t('settings.theme.system') },
              ]}
            />
          </div>
          <Toggle label={t('settings.sound')} checked={prefs.sound} onChange={(sound) => updatePreferences({ sound })} />
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              icon={BookOpen}
              onClick={() => {
                updatePreferences({ tutorialSeen: false });
                onClose();
              }}
            >
              {t('settings.tutorial')}
            </Button>
            <Button
              icon={RotateCcw}
              onClick={() => {
                resetPreferences();
                updatePreferences({ tutorialSeen: true });
                toast(t('settings.resetDone'));
              }}
            >
              {t('settings.reset')}
            </Button>
          </div>
          <Button variant="ghost" icon={Trash2} className="w-full text-rose-600 dark:text-rose-400" onClick={() => setConfirmClear(true)}>
            {t('settings.clearHistory')}
          </Button>
        </div>
      </Dialog>
      <ConfirmDialog
        open={confirmClear}
        danger
        title={t('settings.clearHistory')}
        body={t('settings.clearHistoryConfirm')}
        confirmLabel={t('common.delete')}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearResults();
          setConfirmClear(false);
          toast(t('settings.historyCleared'));
        }}
      />
    </>
  );
}
