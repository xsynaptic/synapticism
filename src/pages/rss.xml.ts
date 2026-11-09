import type { APIRoute } from 'astro';

import { getRssResponse } from '@xsynaptic/astro-syndication/rss';
import { performance } from 'node:perf_hooks';

import { t } from '#lib/i18n/i18n-strings.ts';
import { getCopyrightYears } from '#lib/utils/date.ts';
import { getAbsoluteUrl, getBasePath } from '#lib/utils/routing.ts';
import { getSyndicationItems } from '#lib/utils/syndication.ts';
import { formatStringTemplate } from '#lib/utils/text.ts';

// Provide some helpful info while debugging feed generation
const feedDebug = false as boolean;

// Should footnotes be excluded from feed content?
const feedExcludeFootnotes = true as boolean;

// How many items should be included in the feed?
const feedItemCount = 20;

export const GET = (async (context) => {
	const startTime = performance.now();

	if (feedDebug) console.log(`[RSS] Initializing feed...`);

	const items = await getSyndicationItems({
		debug: feedDebug,
		excludeFootnotes: feedExcludeFootnotes,
		itemCount: feedItemCount,
	});

	const rssFeed = await getRssResponse({
		items,
		publication: {
			copyright: formatStringTemplate(t('footer.copyright'), { years: getCopyrightYears() }),
			description: t('site.description'),
			language: 'en-us',
			site: context.site,
			title: t('site.title'),
		},
		selfUrl: getAbsoluteUrl(getBasePath('rss.xml')),
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
}) satisfies APIRoute;
