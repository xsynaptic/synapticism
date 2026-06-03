import type { CollectionEntry } from 'astro:content';

import * as R from 'remeda';

import type { Thing } from '#lib/utils/structured-data.ts';

import { getPostsCollection } from '#lib/collections/posts/posts-data.ts';
import {
	createContentMetadataItems,
	sortContentMetadataByDate,
} from '#lib/metadata/metadata-utils.ts';
import { createCollectionLookupByIds } from '#lib/utils/collections.ts';
import { buildArticleSchema, buildAuthorSchema } from '#lib/utils/structured-data.ts';

export const createPostsByIdsFunction = createCollectionLookupByIds('Posts', getPostsCollection);

export function getPostSchema(
	entry: CollectionEntry<'posts'>,
	props: { url: string; authorName: string },
): Array<Thing> {
	return [
		buildArticleSchema({
			title: entry.data.title,
			description: entry.data.description,
			dateCreated: entry.data.dateCreated,
			dateUpdated: entry.data.dateUpdated,
			url: props.url,
			imageUrl: undefined,
		}),
		buildAuthorSchema(props.authorName),
	];
}

export async function queryPostsIndex() {
	const { entries } = await getPostsCollection();

	return R.pipe(entries, createContentMetadataItems, R.sort(sortContentMetadataByDate));
}
