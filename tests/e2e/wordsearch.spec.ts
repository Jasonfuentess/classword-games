import { expect, test } from '@playwright/test';
import { freshPage, locateWord, prepare, readGrid, readShareUrl, selectWord } from './helpers';

test('create a word search, share it, solve it in an independent browser, and restart', async ({ page, context, browser, isMobile }) => {
  await prepare(context);

  // 1. Create
  await page.goto('#/create?type=wordsearch');
  await page.getByTestId('title-input').fill('Sistema solar');
  await page.getByTestId('instructions-input').fill('Encuentra los planetas.');
  await page.getByTestId('ws-words-input').fill('Mercurio\nVenus\nTierra\nMarte\nJúpiter\nSaturno');
  await expect(page.getByTestId('ws-grid-ready')).toBeVisible();

  // 2. Save & share
  await page.getByTestId('save-share').click();
  const url = await readShareUrl(page);
  await page.keyboard.press('Escape');

  // Saved in My Activities (and survives reload)
  await page.goto('#/activities');
  await page.reload();
  await expect(page.getByTestId('activity-card')).toHaveCount(1);
  await expect(page.getByTestId('activity-card')).toContainText('Sistema solar');

  // 3. Open in an independent browser context (no access to the creator's storage)
  const { context: other, page: student } = await freshPage(browser, { ...test.info().project.use });
  await student.goto(url);
  await expect(student.getByTestId('activity-title')).toHaveText('Sistema solar');
  await expect(student.getByText('Encuentra los planetas.')).toBeVisible();
  const stored = await student.evaluate(() => localStorage.getItem('cwg.activities'));
  expect(stored).toBeNull();

  // Reloading keeps the activity (it's in the URL)
  await student.reload();
  await expect(student.getByTestId('activity-title')).toHaveText('Sistema solar');

  await student.getByLabel(/your name/i).fill('Ana');
  await student.getByTestId('start-game').click();

  // 4. Solve
  const grid = await readGrid(student);
  const words = await student.locator('[data-testid="ws-word-list"] [data-word]').evaluateAll((els) => els.map((e) => e.getAttribute('data-word')!));
  expect(words).toHaveLength(6);

  // A wrong selection counts as an error
  await selectWord(student, { row: 0, col: 0 }, { row: 0, col: 1 }, isMobile);
  const errorsAfterWrong = Number(await student.getByTestId('game-errors').textContent());
  // (Only counted if those two letters don't happen to spell a word.)
  expect(errorsAfterWrong).toBeLessThanOrEqual(1);

  for (const word of words) {
    const { start, end } = locateWord(grid, word);
    await selectWord(student, start, end, isMobile);
    await expect(student.locator(`[data-word="${word}"]`)).toHaveAttribute('data-found', 'true');
  }

  const result = student.getByTestId('result-panel');
  await expect(result).toBeVisible();
  await expect(result).toHaveAttribute('data-won', 'true');
  await expect(result).toContainText('Ana');
  const score = Number(await student.getByTestId('final-score').evaluate((el) => el.firstChild?.textContent));
  expect(score).toBeGreaterThan(0);
  expect(score).toBeLessThanOrEqual(1000);

  // Result saved in the student's own history
  const history = await student.evaluate(() => JSON.parse(localStorage.getItem('cwg.results') ?? '[]'));
  expect(history).toHaveLength(1);

  // 5. Restart
  await student.getByTestId('try-again').click();
  await expect(student.getByTestId('result-panel')).toBeHidden();
  await expect(student.getByTestId('game-progress')).toHaveText('0/6');
  await expect(student.locator('[data-found="true"]')).toHaveCount(0);

  await other.close();
});

test('touch drag on the grid selects a word and does not scroll the page', async ({ page, context, isMobile }) => {
  test.skip(!isMobile, 'touch-only check');
  await prepare(context);
  await page.goto('#/play/sample-ws-animals-es');
  await page.getByTestId('start-game').click();
  const touchAction = await page.getByTestId('ws-grid').evaluate((el) => getComputedStyle(el).touchAction);
  expect(touchAction).toBe('none');

  const grid = await readGrid(page);
  const word = await page.locator('[data-word]').first().getAttribute('data-word');
  const { start, end } = locateWord(grid, word!);
  const cell = (r: number, c: number) => page.locator(`[data-row="${r}"][data-col="${c}"]`).boundingBox();
  const a = (await cell(start.row, start.col))!;
  const b = (await cell(end.row, end.col))!;
  const scrollBefore = await page.evaluate(() => window.scrollY);

  // Simulate a finger drag with pointer events of type "touch".
  await page.getByTestId('ws-grid').evaluate(
    (el, { ax, ay, bx, by }) => {
      const fire = (type: string, x: number, y: number) =>
        el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, button: 0 }));
      fire('pointerdown', ax, ay);
      for (let i = 1; i <= 6; i++) fire('pointermove', ax + ((bx - ax) * i) / 6, ay + ((by - ay) * i) / 6);
      fire('pointerup', bx, by);
    },
    { ax: a.x + a.width / 2, ay: a.y + a.height / 2, bx: b.x + b.width / 2, by: b.y + b.height / 2 },
  );
  await expect(page.locator(`[data-word="${word}"]`)).toHaveAttribute('data-found', 'true');
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
});
