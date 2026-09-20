import { expect, test, visit } from '#e2e/test.ts';
import { t } from '#lib/i18n/i18n-strings.ts';

const resultTimeout = 10_000;

test('Pagefind returns a known Post first', async ({ page, site }) => {
	await visit(page, '/');

	await page.getByRole('button', { name: t('site.search.toggle.label') }).click();

	const searchInput = page.locator('pagefind-input input');

	await expect(searchInput).toBeVisible();
	await searchInput.fill(site.postTitle);

	const resultLink = page.locator('.pf-result-link').first();

	await expect(resultLink).toBeVisible({ timeout: resultTimeout });
	await expect(resultLink).toHaveText(site.postTitle);
});
