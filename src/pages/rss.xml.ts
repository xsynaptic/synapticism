import type { APIRoute } from 'astro';

import { getRssResponse } from '@xsynaptic/astro-syndication/rss';

import { getAbsoluteUrl, getBasePath } from '#lib/utils/routing.ts';
import { getSyndicationItems, getSyndicationPublication } from '#lib/utils/syndication.ts';

export const GET = (async (context) =>
	getRssResponse({
		items: await getSyndicationItems(),
		publication: getSyndicationPublication(context.site),
		selfUrl: getAbsoluteUrl(getBasePath('rss.xml')),
	})) satisfies APIRoute;
