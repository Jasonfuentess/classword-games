import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';

/** Pre-seeds preferences so the onboarding dialog and sounds don't interfere. */
export async function prepare(context: BrowserContext, language: 'en' | 'es' = 'en') {
  await context.addInitScript((lang) => {
    if (!localStorage.getItem('cwg.preferences')) {
      localStorage.setItem('cwg.preferences', JSON.stringify({ tutorialSeen: true, language: lang, sound: false, theme: 'light' }));
    }
  }, language);
}

/** A brand-new browser context: no cookies, no localStorage from the creator. */
export async function freshPage(browser: Browser, contextOptions: Parameters<Browser['newContext']>[0]) {
  const context = await browser.newContext(contextOptions);
  await prepare(context);
  const page = await context.newPage();
  return { context, page };
}

export async function readShareUrl(page: Page): Promise<string> {
  const input = page.getByTestId('share-url');
  await expect(input).toBeVisible();
  const url = await input.inputValue();
  expect(url).toContain('#/p/');
  return url;
}

type Grid = string[][];

export async function readGrid(page: Page): Promise<Grid> {
  const size = Number(await page.getByTestId('ws-grid').getAttribute('data-size'));
  const letters = await page.locator('[data-testid="ws-grid"] [data-letter]').evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-letter') ?? ''),
  );
  return Array.from({ length: size }, (_, r) => letters.slice(r * size, (r + 1) * size));
}

/** Finds a word in the grid the same way a human would: scanning all 8 directions. */
export function locateWord(grid: Grid, word: string) {
  const n = grid.length;
  const dirs = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      for (const [dr, dc] of dirs) {
        let ok = true;
        for (let i = 0; i < word.length && ok; i++) {
          const rr = r + dr * i;
          const cc = c + dc * i;
          ok = rr >= 0 && cc >= 0 && rr < n && cc < n && grid[rr][cc] === word[i];
        }
        if (ok) return { start: { row: r, col: c }, end: { row: r + dr * (word.length - 1), col: c + dc * (word.length - 1) } };
      }
    }
  }
  throw new Error(`Word ${word} not found in grid`);
}

async function cellCenter(page: Page, row: number, col: number) {
  const box = await page.locator(`[data-testid="ws-grid"] [data-row="${row}"][data-col="${col}"]`).boundingBox();
  if (!box) throw new Error('cell not visible');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Drags with the mouse on desktop; on touch devices uses the tap-first/tap-last selection. */
export async function selectWord(page: Page, start: { row: number; col: number }, end: { row: number; col: number }, touch: boolean) {
  // Bring the whole grid on screen once, then measure both cells (no scrolling in between).
  await page.getByTestId('ws-grid').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const a = await cellCenter(page, start.row, start.col);
  const b = await cellCenter(page, end.row, end.col);
  if (touch) {
    await page.touchscreen.tap(a.x, a.y);
    await page.touchscreen.tap(b.x, b.y);
  } else {
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 4 });
    await page.mouse.move(b.x, b.y, { steps: 4 });
    await page.mouse.up();
  }
}
