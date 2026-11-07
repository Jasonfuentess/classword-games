import { lazy } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { I18nProvider } from './i18n/I18nProvider';
import { ToastProvider } from './components/ui/Toast';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
const PlayHubPage = lazy(() => import('./pages/PlayHubPage').then((m) => ({ default: m.PlayHubPage })));
const SharedPlayPage = lazy(() => import('./pages/SharedPlayPage').then((m) => ({ default: m.SharedPlayPage })));
const LocalPlayPage = lazy(() => import('./pages/LocalPlayPage').then((m) => ({ default: m.LocalPlayPage })));
const MyActivitiesPage = lazy(() => import('./pages/MyActivitiesPage').then((m) => ({ default: m.MyActivitiesPage })));
const EditorPage = lazy(() => import('./pages/EditorPage').then((m) => ({ default: m.EditorPage })));
import { NotFoundPage } from './pages/NotFoundPage';
import { useApplyTheme } from './hooks/useTheme';
import { ScrollToTop } from './components/layout/ScrollToTop';

/**
 * HashRouter keeps every route after "#", so GitHub Pages (a static host without
 * rewrite rules) always serves index.html — reloads and shared links never 404.
 */
export default function App() {
  useApplyTheme();
  return (
    <I18nProvider>
      <ToastProvider>
        <HashRouter>
          <ScrollToTop />
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="play" element={<PlayHubPage />} />
              <Route path="play/:id" element={<LocalPlayPage />} />
              <Route path="p/:code" element={<SharedPlayPage />} />
              <Route path="activities" element={<MyActivitiesPage />} />
              <Route path="create" element={<EditorPage />} />
              <Route path="edit/:id" element={<EditorPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </ToastProvider>
    </I18nProvider>
  );
}
