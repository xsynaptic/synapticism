import type { APIContext } from 'astro';

import rss from '@astrojs/rss';

import { generateFeedItems } from '#lib/utils/rss.ts';

const FEED_EXCLUDE_FOOTNOTES = true as boolean;
const FEED_ITEM_COUNT = 20;

export async function GET(context: APIContext): Promise<Response> {
	const items = await generateFeedItems({
		debug: false,
		excludeFootnotes: FEED_EXCLUDE_FOOTNOTES,
		itemCount: FEED_ITEM_COUNT,
	});

	return rss({
		customData: '<language>en-us</language>',
		description: 'A technical blog about web development, design, and creative coding.',
		items,
		site: context.site ?? '',
		title: 'Synapticism',
	});
}
