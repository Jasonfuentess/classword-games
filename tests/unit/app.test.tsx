import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from '../../src/App';
import { preferenceStore, updatePreferences } from '../../src/storage/preferences';

describe('App smoke test', () => {
  it('renders the landing page and switches language', () => {
    updatePreferences({ language: 'en', tutorialSeen: true });
    preferenceStore.reload();
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Turn any lesson into a game');
    fireEvent.click(screen.getByTestId('language-toggle'));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Convierte cualquier lección en un juego');
  });
});
