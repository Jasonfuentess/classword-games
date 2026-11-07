import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// jsdom lacks matchMedia, which the theme hook uses.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

window.scrollTo = () => {};

afterEach(() => {
  window.localStorage.clear();
});
