# ClassWord Games

Create **word searches** and **hangman** games, share them with a link or QR code, and let classmates play on any device — phone, tablet or computer. No accounts, no server.

**Live site:** https://jasonfuentess.github.io/classword-games/

## Features

- **Word Search**: 3–20 words, automatic or fixed grid (10×10, 12×12, 15×15, 20×20), optional diagonal/backwards words, general clue, show/hide word list. Real placement engine with crossings, backtracking and impossible-configuration detection. Drag with mouse or finger (page doesn't scroll while dragging), tap first + last letter, or play with the keyboard.
- **Hangman**: words or phrases, hint, 3–10 allowed errors, preset categories, on-screen and physical keyboard, accents and **Ñ** support, animated SVG drawing.
- **My Activities**: create, edit, duplicate, delete, preview — saved in your browser (localStorage).
- **Sharing**: the whole activity is compressed into the link (`#/p/…`), so anyone can open it without your device. Copy link, native Share sheet (with fallback) and QR code. Long links are warned about; oversized ones are blocked.
- **Student experience**: intro screen with instructions, optional name, timer, progress, score, result screen, restart, and a **copy result summary** button to send to the creator.
- **Scoring**: up to 1000 points. With timer: 700 for solving + up to 300 speed bonus. Hints cost 75 points each; errors also subtract.
- English / Spanish interface, light / dark / system theme, optional sounds, confetti, first-visit tutorial, full-screen mode, accessible keyboard navigation.

> **Privacy note:** links are *encoded, not encrypted*. The hangman answer is hidden during normal play, but someone technical could decode a link. Don't put private information in activities. Results are only stored in each player's own browser; there is no central results tracking.

## How to share a game

1. Open **My Activities → New activity** (or **Create Activity** on the home page).
2. Choose the game, fill in the title, instructions and words/secret, then press **Save & share**.
3. Use **Copy Link**, **Share**, or show the **QR code** to your class.
4. Classmates open the link, type their name (optional) and press **Start Game**. When they finish, they can press **Copy result summary** and send it to you.

To change an activity later, open **My Activities** and use **Edit**. Note: links you already sent contain the old version of the activity — share again after editing to send the new version.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev          # http://localhost:5173/classword-games/
```

Other commands:

```bash
npm run typecheck    # TypeScript
npm run lint         # ESLint
npm test             # Vitest unit tests
npm run build        # Production build into dist/
npm run preview      # Serve the production build
npx playwright install chromium   # once
npm run test:e2e     # Playwright end-to-end tests (desktop + mobile emulation)
```

## Project structure

```
src/
  engines/      Game logic, independent of React (word search generator & selection, hangman, scoring)
  games/        Game UIs (word search grid, hangman) and the shared ActivityPlayer flow
  pages/        Routes: Home, Play, My Activities, Editor, shared-link player
  components/   UI kit, layout, editor fields, share dialog
  services/     Sharing (serialize + compress + validate), activity schema, sound, clipboard
  storage/      localStorage stores (activities, results, preferences)
  i18n/         English and Spanish dictionaries
  hooks/  types/  utils/  data/ (categories and examples)
tests/
  unit/         Vitest
  e2e/          Playwright
```

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`: install → typecheck → lint → unit tests → build → E2E tests → deploy `dist/` to GitHub Pages. Vite's `base` is `/classword-games/`, and the app uses `HashRouter`, so reloads and shared links never hit a 404 on GitHub Pages.

If you rename the repository, update `base` in `vite.config.ts`.
