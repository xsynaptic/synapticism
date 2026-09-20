import { siteTitle } from '@synapticism/shared/constants';

import { expect, test, visit } from '#e2e/test.ts';
import { t } from '#lib/i18n/i18n-strings.ts';

test('the homepage loads with its chrome and the Stream', async ({ page }) => {
	const response = await visit(page, '/');

	expect(response?.status()).toBe(200);
	await expect(page).toHaveTitle(siteTitle);
	await expect(page.getByRole('navigation', { name: t('aria.headerNavigation') })).toBeVisible();
	await expect(page.locator('main article a').first()).toBeVisible();
});
