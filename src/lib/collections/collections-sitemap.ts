import type { Loader } from 'astro/loaders';
import type { CollectionKey } from 'astro:content';

import { sitemapLastmodPath } from '@synapticism/shared/constants';
import {
	createCommitDateReader,
	createSitemapLastmodWriter,
} from '@xsynaptic/astro-sitemap-lastmod/write';

import { getArchiveDateParts } from '#lib/archives/archives-utils.ts';
import { getArchivePath, getContentPath, getSitePath } from '#lib/utils/routing.ts';

const sitemapLastmodWriter = createSitemapLastmodWriter({ filePath: sitemapLastmodPath });

const readCommitDates = createCommitDateReader({ rootPath: process.cwd() });

// Listings take their newest member's date (the writer keeps the newer); unrecorded paths get the build time on every deploy
const listingPaths = {
	pages: [],
	posts: [getSitePath(), getContentPath('posts')],
	projects: [getContentPath('projects')],
	tags: [getContentPath('tags')],
} as const satisfies Record<CollectionKey, ReadonlyArray<string>>;

function getArchivePaths(collection: CollectionKey, dateCreated: unknown): Array<string> {
	if (collection !== 'posts' && collection !== 'projects') return [];
	if (!(dateCreated instanceof Date)) return [];

	return [getArchivePath(getArchiveDateParts(dateCreated).year)];
}

export function withSitemapLastmod(collection: CollectionKey, loader: Loader): Loader {
	return sitemapLastmodWriter.wrap(loader, async (entries) => {
		const dates = await readCommitDates(entries);

		return entries.flatMap((entry) => {
			const date = dates.get(entry.filePath ?? '');

			return [
				getContentPath(collection, entry.id),
				...listingPaths[collection],
				...getArchivePaths(collection, entry.data.dateCreated),
			].map((pathname) => [pathname, date] as const);
		});
	});
}
