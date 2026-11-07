import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Languages, Menu, Monitor, Moon, Settings, Sun, Volume2, VolumeX, X } from 'lucide-react';
import { LogoMark } from './Logo';
import { SettingsDialog } from './SettingsDialog';
import { IconButton } from '../ui/Button';
import { useI18n } from '../../i18n/useI18n';
import { usePreferences } from '../../hooks/usePreferences';
import { updatePreferences, type ThemePreference } from '../../storage/preferences';
import { cn } from '../../utils/format';

const NEXT_THEME: Record<ThemePreference, ThemePreference> = { light: 'dark', dark: 'system', system: 'light' };
const THEME_ICON = { light: Sun, dark: Moon, system: Monitor };

export function Header() {
  const { t, locale, setLocale } = useI18n();
  const prefs = usePreferences();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();
  const [menuPath, setMenuPath] = useState(location.pathname);
  // Close the mobile menu whenever the route changes.
  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname);
    setMenuOpen(false);
  }

  const links = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/play', label: t('nav.play') },
    { to: '/activities', label: t('nav.myActivities') },
    { to: '/create', label: t('nav.create') },
  ];
  const ThemeIcon = THEME_ICON[prefs.theme];
  const themeLabel = `${t('settings.theme')}: ${t(`settings.theme.${prefs.theme}`)}`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/70 pt-[env(safe-area-inset-top)] backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/70">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg dark:focus:bg-slate-800">
        {t('nav.skip')}
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
        <Link to="/" className="flex items-center gap-2.5 rounded-xl pr-2 font-extrabold tracking-tight" aria-label={t('app.name')}>
          <LogoMark size={34} />
          <span className="hidden text-lg sm:inline">
            ClassWord <span className="text-gradient">Games</span>
          </span>
        </Link>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  'rounded-xl px-3 py-2 text-sm font-semibold transition',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200'
                    : 'text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10',
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setLocale(locale === 'en' ? 'es' : 'en')}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-bold text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10"
            aria-label={`${t('settings.language')}: ${locale === 'en' ? 'English' : 'Español'}`}
            title={t('settings.language')}
            data-testid="language-toggle"
          >
            <Languages size={18} aria-hidden="true" />
            {locale.toUpperCase()}
          </button>
          <IconButton label={themeLabel} icon={ThemeIcon} onClick={() => updatePreferences({ theme: NEXT_THEME[prefs.theme] })} />
          <IconButton
            label={prefs.sound ? t('settings.soundOn') : t('settings.soundOff')}
            icon={prefs.sound ? Volume2 : VolumeX}
            onClick={() => updatePreferences({ sound: !prefs.sound })}
            aria-pressed={prefs.sound}
          />
          <IconButton label={t('settings.title')} icon={Settings} onClick={() => setSettingsOpen(true)} />
          <IconButton
            label={t('nav.menu')}
            icon={menuOpen ? X : Menu}
            className="md:hidden"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          />
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-200/60 md:hidden dark:border-white/5"
          >
            <div className="grid gap-1 p-3">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    cn(
                      'rounded-xl px-4 py-3 font-semibold',
                      isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200' : 'hover:bg-slate-900/5 dark:hover:bg-white/10',
                    )
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}
