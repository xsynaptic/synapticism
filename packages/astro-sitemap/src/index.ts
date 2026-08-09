import type { AstroIntegration } from 'astro';

import sitemap from '@astrojs/sitemap';

interface Options {
	excludePrefixes?: Array<string>;
}

export default function sitemapIntegration(options?: Options): AstroIntegration {
	const excludePrefixes = options?.excludePrefixes ?? [];

	return sitemap({
		filter: (page) => {
			const path = new URL(page).pathname.replace(/\/$/, '');

			return excludePrefixes.every((prefix) => !(path === prefix || path.startsWith(prefix + '/')));
		},
	});
}
