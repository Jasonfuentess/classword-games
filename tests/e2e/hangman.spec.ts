import { expect, test } from '@playwright/test';
import { freshPage, prepare, readShareUrl } from './helpers';

test('create a custom hangman, open it from a shared link, guess it, and restart', async ({ page, context, browser, isMobile }) => {
  await prepare(context);

  await page.goto('#/create?type=hangman');
  await page.getByTestId('title-input').fill('Celebración');
  await page.getByTestId('hm-secret-input').fill('Año Nuevo');
  await page.getByTestId('hm-hint-input').fill('Se celebra el 1 de enero');
  await page.getByTestId('save-share').click();
  const url = await readShareUrl(page);
  // The answer is not readable in the link.
  expect(decodeURIComponent(url).toLowerCase()).not.toContain('nuevo');

  const { context: other, page: student } = await freshPage(browser, { ...test.info().project.use });
  await student.goto(url);
  await expect(student.getByTestId('activity-title')).toHaveText('Celebración');
  await student.getByTestId('start-game').click();
  await expect(student.getByText('Se celebra el 1 de enero')).toBeVisible();

  const press = async (letter: string) => {
    if (isMobile) await student.locator(`[data-key="${letter}"]`).click();
    else await student.keyboard.press(letter.toLowerCase());
  };

  // A wrong guess
  await press('Z');
  await expect(student.getByTestId('game-errors')).toHaveText('1');
  await expect(student.locator('[data-key="Z"]')).toBeDisabled();

  // Repeating a letter does not count again (on touch the used key is disabled instead).
  if (!isMobile) await press('Z');
  await expect(student.getByTestId('game-errors')).toHaveText('1');

  for (const l of ['A', 'O', 'N', 'U', 'E', 'V']) await press(l);
  // Ñ is its own key; N did not reveal it.
  await expect(student.getByTestId('result-panel')).toBeHidden();
  await student.locator('[data-key="Ñ"]').click();

  const result = student.getByTestId('result-panel');
  await expect(result).toBeVisible();
  await expect(result).toHaveAttribute('data-won', 'true');
  await expect(student.getByTestId('revealed-answer')).toHaveText('Año Nuevo');

  await student.getByTestId('try-again').click();
  await expect(result).toBeHidden();
  await expect(student.getByTestId('game-errors')).toHaveText('0');
  await expect(student.locator('[data-key="A"]')).toBeEnabled();
  await other.close();
});

test('losing a hangman reveals the answer', async ({ page, context }) => {
  await prepare(context);
  await page.goto('#/play/sample-hm-en');
  await page.getByTestId('start-game').click();
  for (const l of ['Q', 'W', 'X', 'Z', 'K', 'Y']) await page.locator(`[data-key="${l}"]`).click();
  const result = page.getByTestId('result-panel');
  await expect(result).toBeVisible();
  await expect(result).toHaveAttribute('data-won', 'false');
  await expect(page.getByTestId('revealed-answer')).toHaveText('Jupiter');
});
