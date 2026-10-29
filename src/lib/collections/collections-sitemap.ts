import type { Loader } from 'astro/loaders';
import type { CollectionKey } from 'astro:content';

import { sitemapLastmodPath } from '@synapticism/shared/constants';
import { createSitemapLastmodWriter } from '@xsynaptic/astro-sitemap-lastmod/write';

import { getContentPath } from '#lib/utils/routing.ts';

const sitemapLastmodWriter = createSitemapLastmodWriter({ filePath: sitemapLastmodPath });

export function withSitemapLastmod(collection: CollectionKey, loader: Loader): Loader {
	return sitemapLastmodWriter.wrap(loader, (entry) => {
		const date = entry.data.dateUpdated ?? entry.data.dateCreated;

		return [[getContentPath(collection, entry.id), date instanceof Date ? date : undefined]];
	});
}
