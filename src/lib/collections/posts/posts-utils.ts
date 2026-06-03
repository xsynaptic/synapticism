import type { CollectionEntry } from 'astro:content';

import * as R from 'remeda';

import type { Thing } from '#lib/utils/structured-data.ts';

import { getCatalog } from '#lib/catalog/catalog-data.ts';
import { sortCatalogByDate } from '#lib/catalog/catalog-utils.ts';
import { getPostsCollection } from '#lib/collections/posts/posts-data.ts';
import { createCollectionLookupByIds } from '#lib/utils/collections.ts';
import { buildArticleSchema, buildAuthorSchema } from '#lib/utils/structured-data.ts';
import { getEntryDescription } from '#lib/utils/text.ts';

export const createPostsByIdsFunction = createCollectionLookupByIds('Posts', getPostsCollection);

export function getPostSchema(
	entry: CollectionEntry<'posts'>,
	props: { url: string; authorName: string },
): Array<Thing> {
	return [
		buildArticleSchema({
			title: entry.data.title,
			description: getEntryDescription(entry),
			dateCreated: entry.data.dateCreated,
			dateUpdated: entry.data.dateUpdated,
			url: props.url,
			imageUrl: undefined,
		}),
		buildAuthorSchema(props.authorName),
	];
}

export async function queryPostsIndex() {
	const catalog = await getCatalog();

	return R.pipe(catalog.byCollection('posts'), R.sort(sortCatalogByDate));
}
