import { useEffect } from 'react';
import { usePreferences } from './usePreferences';

/** Keeps the `dark` class on <html> in sync with the preference and the OS setting. */
export function useApplyTheme(): void {
  const { theme } = usePreferences();
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f172a' : '#4f46e5');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}
