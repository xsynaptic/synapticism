import type { Page } from '@playwright/test';

import { routes } from '#e2e/constants.ts';
import { expect, getSentEvents, navigateClientSide, stubUmami, test, visit } from '#e2e/test.ts';
import { t } from '#lib/i18n/i18n-strings.ts';

const resultTimeout = 10_000;

test('Pagefind returns a known Post first', { tag: '@smoke' }, async ({ page, site }) => {
	await visit(page, '/');

	expect(await page.evaluate(() => customElements.get('pagefind-modal') === undefined)).toBe(true);

	await page.getByRole('button', { name: t('site.search.toggle.label') }).click();

	const searchInput = page.locator('pagefind-input input');

	await expect(searchInput).toBeVisible();
	await searchInput.fill(site.postTitle);

	const resultLink = page.locator('.pf-result-link').first();

	await expect(resultLink).toBeVisible({ timeout: resultTimeout });
	await expect(resultLink).toHaveText(site.postTitle);
});

async function searchFor(page: Page, query: string) {
	const searchInput = page.locator('pagefind-input input');
	const summary = page.locator('pagefind-summary');

	await page.getByRole('button', { name: t('site.search.toggle.label') }).click();
	await expect(searchInput).toBeFocused();
	await searchInput.pressSequentially(query, { delay: 30 });
	await expect(summary).toContainText(query, { timeout: resultTimeout });
	await expect(summary).not.toContainText('Searching');
}

test('search analytics survive client-side navigation', async ({ page, site }) => {
	await stubUmami(page);
	await visit(page, '/');

	const searchToggle = page.getByRole('button', { name: t('site.search.toggle.label') });

	// The tracker reads this attribute itself, so the stub never records the open
	await expect(searchToggle).toHaveAttribute('data-umami-event', 'search-open');
	await searchToggle.click();
	await page.keyboard.press('Escape');
	await navigateClientSide(page, routes.postsIndex);

	await searchFor(page, site.postTitle);
	await page.keyboard.press('Escape');

	await expect
		.poll(() => getSentEvents(page, 'search-query'))
		.toEqual([
			{
				data: { clicked: false, query: site.postTitle, results: expect.any(Number) },
				name: 'search-query',
			},
		]);
	expect(await getSentEvents(page, 'search-empty')).toEqual([]);
});

test('search analytics mark a result click', async ({ page, site }) => {
	await stubUmami(page);
	await visit(page, '/');
	await searchFor(page, site.postTitle);

	// Navigating away would discard the tracked events before they are read
	await page.evaluate(() => {
		window.addEventListener(
			'click',
			(event) => {
				event.preventDefault();
			},
			{ capture: true },
		);
	});
	await page.locator('.pf-result-link').first().click();

	await expect
		.poll(() => getSentEvents(page, 'search-query'))
		.toEqual([
			{
				data: { clicked: true, query: site.postTitle, results: expect.any(Number) },
				name: 'search-query',
			},
		]);
});

test('search analytics flag a search with no results', async ({ page }) => {
	const query = 'qqqqqqqq';

	await stubUmami(page);
	await visit(page, '/');
	await searchFor(page, query);
	await page.keyboard.press('Escape');

	await expect
		.poll(() => getSentEvents(page, 'search-empty'))
		.toEqual([{ data: { query }, name: 'search-empty' }]);
	expect(await getSentEvents(page, 'search-query')).toEqual([
		{ data: { clicked: false, query, results: 0 }, name: 'search-query' },
	]);
});
