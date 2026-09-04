import type { CollectionEntry } from 'astro:content';

import * as R from 'remeda';

import type { Thing } from '#lib/utils/structured-data.ts';

import { getCatalog } from '#lib/catalog/catalog-data.ts';
import { sortCatalogByDate } from '#lib/catalog/catalog-utils.ts';
import { getPostsCollection } from '#lib/collections/posts/posts-data.ts';
import { createCollectionLookupByIds } from '#lib/utils/collections.ts';
import { getDescriptionRenderedText } from '#lib/utils/description.ts';
import { buildArticleSchema, buildAuthorSchema } from '#lib/utils/structured-data.ts';

/** @knipignore staged for the launch design; mirrors the lookup other collections already use */
export const createPostsByIdsFunction = createCollectionLookupByIds('Posts', getPostsCollection);

export async function getPostSchema(
	entry: CollectionEntry<'posts'>,
	props: { authorName: string; url: string },
): Promise<Array<Thing>> {
	return [
		buildArticleSchema({
			dateCreated: entry.data.dateCreated,
			dateUpdated: entry.data.dateUpdated,
			description: await getDescriptionRenderedText(entry),
			imageUrl: undefined,
			title: entry.data.title,
			url: props.url,
		}),
		buildAuthorSchema(props.authorName),
	];
}

export async function queryPostsIndex() {
	const catalog = await getCatalog();

	return R.pipe(catalog.byCollection('posts'), R.sort(sortCatalogByDate));
}
