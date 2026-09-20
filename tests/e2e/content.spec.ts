import type { Page } from '@playwright/test';

import { routes } from '#e2e/constants.ts';
import { expect, test, visit } from '#e2e/test.ts';
import { t } from '#lib/i18n/i18n-strings.ts';

const bodyLengthMinimum = 50;

async function expectEntryRenders(page: Page): Promise<void> {
	const heading = page.getByRole('heading', { level: 1 });

	await expect(heading).toBeVisible();
	await expect(heading).not.toBeEmpty();
	await expect(page.locator('article time').first()).toBeVisible();

	const body = page.locator('article p').first();

	await expect(body).toBeVisible();

	const bodyText = await body.innerText();

	expect(bodyText.trim().length).toBeGreaterThan(bodyLengthMinimum);
}

test('a Post renders', async ({ page, site }) => {
	await visit(page, site.postDetail);
	await expectEntryRenders(page);
});

test('a Note renders', async ({ page, site }) => {
	await visit(page, site.noteDetail);
	await expectEntryRenders(page);
});

test('a List Page reaches a Project that renders', async ({ page }) => {
	await visit(page, routes.projectsIndex);
	await page.locator('main a').first().click();

	await expectEntryRenders(page);
});

test('a Page renders', async ({ page }) => {
	await visit(page, '/');
	await page
		.getByRole('navigation', { name: t('aria.headerNavigation') })
		.getByRole('link', { exact: true, name: t('navigation.about.label') })
		.click();

	await expectEntryRenders(page);
});
