import type { APIContext } from 'astro';

import rss from '@astrojs/rss';

import { generateFeedItems } from '#lib/utils/rss.ts';

const FEED_EXCLUDE_FOOTNOTES = true as boolean;
const FEED_ITEM_COUNT = 20;

export async function GET(context: APIContext): Promise<Response> {
	const items = await generateFeedItems({
		itemCount: FEED_ITEM_COUNT,
		excludeFootnotes: FEED_EXCLUDE_FOOTNOTES,
		debug: false,
	});

	return rss({
		customData: '<language>en-us</language>',
		title: 'Synapticism',
		description: 'A technical blog about web development, design, and creative coding.',
		site: context.site ?? '',
		items,
	});
}
