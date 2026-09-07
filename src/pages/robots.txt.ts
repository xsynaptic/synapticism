import type { APIRoute } from 'astro';

import { getAbsoluteUrl, getBasePath } from '#lib/utils/routing.ts';

export const GET = (() => {
	const sitemapUrl = getAbsoluteUrl(getBasePath('sitemap-index.xml'));

	return new Response(`User-agent: *
Disallow: /_astro/
Disallow: /pagefind/

Sitemap: ${sitemapUrl}
`);
}) satisfies APIRoute;
