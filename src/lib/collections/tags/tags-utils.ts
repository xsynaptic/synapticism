import type { CollectionEntry } from 'astro:content';

import * as R from 'remeda';

import { getPostsCollection } from '#lib/collections/posts/posts-data.ts';
import { getTagsCollection } from '#lib/collections/tags/tags-data.ts';
import {
	createContentMetadataItems,
	sortContentMetadataByDate,
} from '#lib/metadata/metadata-utils.ts';
import {
	createCollectionLookupByIds,
	filterWithContent,
	sortByContentCount,
} from '#lib/utils/collections.ts';

export const createTagsByIdsFunction = createCollectionLookupByIds('Tags', getTagsCollection);

export async function createPostsByTagFunction() {
	const { entries } = await getPostsCollection();

	return function getPostsByTag(entry: CollectionEntry<'tags'>): Array<CollectionEntry<'posts'>> {
		return entries.filter(({ data }) => data.tags?.find(({ id }) => id === entry.id));
	};
}

export async function queryTagsIndex() {
	const { entries } = await getTagsCollection();

	return R.pipe(entries, R.filter(filterWithContent), R.sort(sortByContentCount));
}

export async function queryTagsEntryPosts(entry: CollectionEntry<'tags'>) {
	const getPostsByTag = await createPostsByTagFunction();

	const posts = getPostsByTag(entry);

	return R.pipe(posts, createContentMetadataItems, R.sort(sortContentMetadataByDate));
}
