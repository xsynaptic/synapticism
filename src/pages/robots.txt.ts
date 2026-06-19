import type { APIRoute } from 'astro';

import { getSiteUrl } from '#lib/utils/routing.ts';

export const GET = (() => {
	const sitemapUrl = `${getSiteUrl()}sitemap-index.xml`;

	return new Response(`User-agent: *
Disallow: /_astro/
Disallow: /pagefind/

User-agent: *
Sitemap: ${sitemapUrl}
`);
}) satisfies APIRoute;
