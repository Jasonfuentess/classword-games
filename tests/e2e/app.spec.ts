import { expect, test } from '@playwright/test';
import { prepare } from './helpers';

test('broken and truncated links show a friendly error', async ({ page, context }) => {
  await prepare(context);
  await page.goto('#/p/this-is-not-valid');
  await expect(page.getByTestId('link-error')).toBeVisible();
  await page.goto('#/p/N4Igxg');
  await expect(page.getByTestId('link-error')).toBeVisible();
});

test('edit, duplicate and delete activities in My Activities', async ({ page, context }) => {
  await prepare(context);
  await page.goto('#/activities');
  await page.getByTestId('load-examples').click();
  await expect(page.getByTestId('activity-card')).toHaveCount(4);

  // Edit
  const first = page.getByTestId('activity-card').first();
  const originalTitle = (await first.locator('h2').textContent())!;
  await first.getByRole('button', { name: 'Edit' }).click();
  await page.getByTestId('title-input').fill(`${originalTitle} v2`);
  await page.getByTestId('save-activity').click();
  await page.goto('#/activities');
  await expect(page.getByText(`${originalTitle} v2`)).toBeVisible();

  // Duplicate
  await page.getByTestId('activity-card').first().getByRole('button', { name: 'Duplicate' }).click();
  await expect(page.getByTestId('activity-card')).toHaveCount(5);

  // Delete with confirmation
  await page.getByTestId('activity-card').first().getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByTestId('activity-card')).toHaveCount(4);

  // Persisted after reload
  await page.reload();
  await expect(page.getByTestId('activity-card')).toHaveCount(4);
});

test('editor shows validation messages', async ({ page, context }) => {
  await prepare(context);
  await page.goto('#/create?type=wordsearch');
  await page.getByTestId('save-activity').click();
  await expect(page.getByText('Give your activity a title.')).toBeVisible();
  await expect(page.getByText('Add at least 3 words.')).toBeVisible();
  await page.getByTestId('ws-words-input').fill('Sol\nLuna\nElectromagnetismo');
  await page.getByTestId('ws-grid-size').selectOption('10');
  await expect(page.getByText(/won’t fit the grid/)).toBeVisible();
});

test('interface switches between English and Spanish', async ({ page, context }) => {
  await prepare(context);
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Turn any lesson into a game');
  await page.getByTestId('language-toggle').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Convierte cualquier lección en un juego');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Convierte cualquier lección en un juego');
});

test('first visit shows the tutorial and it can be dismissed', async ({ page }) => {
  await page.goto('./');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /skip|omitir/i }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(page.getByRole('dialog')).toBeHidden();
});
