import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Header } from './Header';
import { Tutorial } from './Tutorial';
import { useI18n } from '../../i18n/useI18n';

export function AppShell() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const onSharedLink = pathname.startsWith('/p/');
  return (
    <div className="app-bg flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-16 sm:pt-10">
        <Suspense
          fallback={
            <div className="flex justify-center py-24 text-indigo-500" role="status" aria-label={t('common.loading')}>
              <Loader2 className="animate-spin" size={32} aria-hidden="true" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <footer className="border-t border-slate-200/60 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-xs text-slate-500 dark:border-white/5 dark:text-slate-400">
        {t('footer.text')}
      </footer>
      <Tutorial suppressed={onSharedLink} />
    </div>
  );
}
