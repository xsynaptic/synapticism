import type { Loader } from 'astro/loaders';
import type { CollectionKey } from 'astro:content';

import { sitemapLastmodPath } from '@synapticism/shared/constants';
import {
	createCommitDateReader,
	createSitemapLastmodWriter,
} from '@xsynaptic/astro-sitemap-lastmod/write';

import { getContentPath, getSitePath } from '#lib/utils/routing.ts';

const sitemapLastmodWriter = createSitemapLastmodWriter({ filePath: sitemapLastmodPath });

const readCommitDates = createCommitDateReader({ rootPath: process.cwd() });

// Listings take their newest member's date (the writer keeps the newer); unrecorded paths get the build time on every deploy
const listingPaths = {
	pages: [],
	posts: [getSitePath(), getContentPath('posts')],
	projects: [getContentPath('projects')],
	tags: [getContentPath('tags')],
} as const satisfies Record<CollectionKey, ReadonlyArray<string>>;

export function withSitemapLastmod(collection: CollectionKey, loader: Loader): Loader {
	return sitemapLastmodWriter.wrap(loader, async (entries) => {
		const dates = await readCommitDates(entries);

		return entries.flatMap((entry) => {
			const date = dates.get(entry.filePath ?? '');

			return [getContentPath(collection, entry.id), ...listingPaths[collection]].map(
				(pathname) => [pathname, date] as const,
			);
		});
	});
}
