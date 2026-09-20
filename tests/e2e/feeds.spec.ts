import { siteTitle } from '@synapticism/shared/constants';

import { feedPath } from '#e2e/constants.ts';
import { expect, test } from '#e2e/test.ts';

const itemsChecked = 5;

const contentLengthMinimum = 100;

function readTag(item: string, tag: string): string {
	return new RegExp(String.raw`<${tag}>([\s\S]*?)</${tag}>`).exec(item)?.[1]?.trim() ?? '';
}

test('the feed is valid RSS carrying full Entry content', async ({ request }) => {
	const response = await request.get(feedPath);

	expect(response.status()).toBe(200);
	expect(response.headers()['content-type']).toMatch(/xml/);

	const feed = await response.text();

	expect(feed).toContain('<rss');
	expect(feed).toContain(`<title>${siteTitle}</title>`);

	const items = feed.match(/<item>[\s\S]*?<\/item>/g) ?? [];

	expect(items.length).toBeGreaterThanOrEqual(itemsChecked);

	for (const item of items.slice(0, itemsChecked)) {
		expect(readTag(item, 'title')).toBeTruthy();
		expect(readTag(item, 'link')).toBeTruthy();
		expect(readTag(item, 'content:encoded').length).toBeGreaterThan(contentLengthMinimum);
	}
});

test('the sitemap index names a non-empty url sitemap', async ({ request }) => {
	const index = await request.get('/sitemap-index.xml');

	expect(index.status()).toBe(200);
	expect(await index.text()).toMatch(/<loc>[^<]*sitemap-0\.xml<\/loc>/);

	const sitemap = await request.get('/sitemap-0.xml');
	const urls = await sitemap.text();

	expect(sitemap.status()).toBe(200);
	expect(urls.match(/<url>/g)?.length ?? 0).toBeGreaterThan(0);
});
