import type { Page } from '@playwright/test';

import { routes } from '#e2e/constants.ts';
import { expect, navigateClientSide, test, visit } from '#e2e/test.ts';

const pickerPath = '/projects/emoji-picker/';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

function getParts(page: Page) {
	const picker = page.locator('emoji-picker');

	return {
		bubble: picker.getByText('Copied', { exact: true }),
		picker,
		recents: picker.getByRole('region', { name: 'Recently used' }).getByRole('button'),
		results: picker.getByRole('region', { name: 'Search results' }).getByRole('button'),
		search: picker.getByRole('searchbox', { name: 'Search emoji' }),
		tones: picker.getByRole('group', { name: 'Skin tones' }),
	};
}

function getGridCell(page: Page, label: string) {
	return page.locator('emoji-picker .ep-group').getByRole('button', { exact: true, name: label });
}

function readClipboard(page: Page) {
	return page.evaluate(() => navigator.clipboard.readText());
}

test('searching "robot" returns only the robot', async ({ page }) => {
	const { results, search } = getParts(page);

	await visit(page, pickerPath);
	await search.fill('robot');

	await expect(results).toHaveText(['🤖']);
});

test('copying an emoji adds it to recents, which survive a reload', async ({ page }) => {
	const { bubble, recents } = getParts(page);

	await visit(page, pickerPath);
	await getGridCell(page, 'robot').click();

	await expect(bubble).toHaveText('Copied');
	expect(await readClipboard(page)).toBe('🤖');
	await expect(recents).toHaveText(['🤖']);

	await page.reload();

	await expect(recents).toHaveText(['🤖']);
});

test('a mouse long-press opens the tone popover, and the chosen tone is remembered', async ({
	page,
}) => {
	const { recents, tones } = getParts(page);
	const wave = getGridCell(page, 'waving hand');

	await visit(page, pickerPath);
	await wave.scrollIntoViewIfNeeded();

	const box = await wave.boundingBox();

	if (!box) throw new Error('The waving hand cell has no box');

	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	await expect(tones).toBeVisible();
	await page.mouse.up();

	await expect(tones).toBeVisible();
	await expect(recents).toHaveCount(0);

	await tones.getByRole('button', { name: 'Medium skin tone' }).click();

	await expect(tones).toBeHidden();
	await expect(wave).toHaveText('👋🏽');
	expect(await readClipboard(page)).toBe('👋🏽');

	await page.reload();

	await expect(wave).toHaveText('👋🏽');
});

test('a right-click opens the tone popover and Escape closes it', async ({ page }) => {
	const { recents, tones } = getParts(page);
	const wave = getGridCell(page, 'waving hand');

	await visit(page, pickerPath);
	await wave.click({ button: 'right' });

	await expect(tones).toBeVisible();
	await expect(recents).toHaveCount(0);

	await page.keyboard.press('Escape');

	await expect(tones).toBeHidden();
});

test('the size toggle persists and applies before the element upgrades', async ({ page }) => {
	const { picker } = getParts(page);
	const large = picker.getByRole('button', { name: 'Large emoji' });

	await visit(page, pickerPath);
	await large.click();

	await expect(large).toHaveAttribute('aria-pressed', 'true');

	await page.addInitScript(() => {
		const define = customElements.define.bind(customElements);

		customElements.define = (name, ...rest) => {
			if (name === 'emoji-picker') {
				Object.assign(globalThis, {
					sizeAtDefine: document
						.querySelector(
							'emoji-picker [role="group"][aria-label="Emoji size"] [aria-pressed="true"]',
						)
						?.getAttribute('aria-label'),
				});
			}

			define(name, ...rest);
		};
	});
	await page.reload();

	expect(await page.evaluate(() => (globalThis as { sizeAtDefine?: string }).sizeAtDefine)).toBe(
		'Large emoji',
	);
	await expect(large).toHaveAttribute('aria-pressed', 'true');
});

test('retyping the same query after a client-side navigation still shows results', async ({
	page,
}) => {
	const { results, search } = getParts(page);

	await visit(page, pickerPath);
	await search.pressSequentially('robot');
	await expect(results).toHaveText(['🤖']);

	await navigateClientSide(page, routes.projectsIndex);
	await navigateClientSide(page, pickerPath);

	await search.pressSequentially('robot');
	await expect(results).toHaveText(['🤖']);
});
