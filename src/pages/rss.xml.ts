import type { APIContext } from 'astro';

import rss from '@astrojs/rss';
import { performance } from 'node:perf_hooks';

import { t } from '#lib/i18n/i18n-strings.ts';
import { getCopyrightYears } from '#lib/utils/date.ts';
import { getSiteUrl } from '#lib/utils/routing.ts';
import { generateFeedItems } from '#lib/utils/rss.ts';
import { formatStringTemplate } from '#lib/utils/text.ts';

// Provide some helpful info while debugging feed generation
const feedDebug = false as boolean;

// Should footnotes be excluded from feed content?
const feedExcludeFootnotes = true as boolean;

// How many items should be included in the feed?
const feedItemCount = 20;

export async function GET(context: APIContext): Promise<Response> {
	const startTime = performance.now();

	if (feedDebug) console.log(`[RSS] Initializing feed...`);

	const items = await generateFeedItems({
		debug: feedDebug,
		excludeFootnotes: feedExcludeFootnotes,
		itemCount: feedItemCount,
	});

	// Channel freshness tracks the newest item, not build time, so unchanged content keeps its ETag
	const lastBuildDate = items[0]?.pubDate;

	const copyright = formatStringTemplate(t('footer.copyright'), { years: getCopyrightYears() });

	const rssFeed = rss({
		customData: [
			'<language>en-us</language>',
			`<atom:link href="${getSiteUrl()}rss.xml" rel="self" type="application/rss+xml"/>`,
			...(lastBuildDate ? [`<lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>`] : []),
			`<copyright>${copyright}</copyright>`,
		].join(''),
		description: t('site.description'),
		items,
		site: context.site ?? '',
		title: t('site.title'),
		xmlns: { atom: 'http://www.w3.org/2005/Atom' },
	});

	if (feedDebug) {
		console.log(`[RSS] Generated in ${(performance.now() - startTime).toFixed(5)}ms`);

		if (items.length > 0) {
			console.log(`[RSS] Feed contains ${String(items.length)} items:`);
			for (const item of items) {
				console.log(`- ${item.title}`);
			}
		}
	}

	return rssFeed;
}
