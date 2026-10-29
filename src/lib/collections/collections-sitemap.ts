import type { SitemapLastmodEntry } from '@xsynaptic/astro-sitemap-lastmod/write';
import type { Loader } from 'astro/loaders';
import type { CollectionKey } from 'astro:content';

import { sitemapLastmodPath } from '@synapticism/shared/constants';
import {
	createCommitDateReader,
	createSitemapLastmodWriter,
} from '@xsynaptic/astro-sitemap-lastmod/write';
import { z } from 'zod';

import { getContentPath, getSitePath } from '#lib/utils/routing.ts';

const sitemapLastmodWriter = createSitemapLastmodWriter({ filePath: sitemapLastmodPath });

const readCommitDates = createCommitDateReader({ rootPath: process.cwd() });

const ReferenceListSchema = z.array(z.object({ id: z.string() })).default([]);

function getReferencePaths(collection: 'projects' | 'tags', references: unknown) {
	return ReferenceListSchema.parse(references).map(({ id }) => getContentPath(collection, id));
}

const sitemapPathsByCollection = {
	pages: (entry) => [getContentPath('pages', entry.id)],
	posts: (entry) => [
		getContentPath('posts', entry.id),
		getContentPath('posts'),
		getSitePath(),
		...getReferencePaths('tags', entry.data.tags),
		...getReferencePaths('projects', entry.data.projects),
	],
	projects: (entry) => [
		getContentPath('projects', entry.id),
		getContentPath('projects'),
		...getReferencePaths('tags', entry.data.tags),
	],
	tags: (entry) => [getContentPath('tags', entry.id), getContentPath('tags')],
} satisfies Record<CollectionKey, (entry: SitemapLastmodEntry) => Array<string>>;

export function withSitemapLastmod(collection: CollectionKey, loader: Loader): Loader {
	return sitemapLastmodWriter.wrap(loader, async (entries) => {
		const commitDates = await readCommitDates(entries);

		return entries.flatMap((entry) => {
			const date = entry.filePath === undefined ? undefined : commitDates.get(entry.filePath);

			if (date === undefined) return [];

			return sitemapPathsByCollection[collection](entry).map(
				(pathname) => [pathname, date] as const,
			);
		});
	});
}
