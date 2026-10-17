import { siteTitle } from '@synapticism/shared/constants';

import { feedPath } from '#e2e/constants.ts';
import { expect, test } from '#e2e/test.ts';

const itemsChecked = 5;

const contentLengthMinimum = 100;

function readTag(item: string, tag: string): string {
	return new RegExp(String.raw`<${tag}>([\s\S]*?)</${tag}>`).exec(item)?.[1]?.trim() ?? '';
}

test(
	'the feed is valid RSS carrying full Entry content',
	{ tag: '@smoke' },
	async ({ request }) => {
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
	},
);
