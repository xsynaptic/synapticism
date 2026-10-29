import type { Loader } from 'astro/loaders';
import type { CollectionKey } from 'astro:content';

import { sitemapLastmodPath } from '@synapticism/shared/constants';
import {
	createCommitDateReader,
	createSitemapLastmodWriter,
} from '@xsynaptic/astro-sitemap-lastmod/write';

import { getContentPath } from '#lib/utils/routing.ts';

const sitemapLastmodWriter = createSitemapLastmodWriter({ filePath: sitemapLastmodPath });

const readCommitDates = createCommitDateReader({ rootPath: process.cwd() });

export function withSitemapLastmod(collection: CollectionKey, loader: Loader): Loader {
	return sitemapLastmodWriter.wrap(loader, async (entries) => {
		const dates = await readCommitDates(entries);

		return entries.map((entry) => [
			getContentPath(collection, entry.id),
			dates.get(entry.filePath ?? ''),
		]);
	});
}
