import type { CollectionEntry } from 'astro:content';

import { getNotesCollection } from '#lib/collections/notes/notes-data.ts';
import { getPostsCollection } from '#lib/collections/posts/posts-data.ts';
import { sortByDateReverseChronological } from '#lib/utils/date.ts';

export type ArticleEntry = CollectionEntry<'notes' | 'posts'>;

const collectionData = {
	notes: getNotesCollection,
	posts: getPostsCollection,
} as const;

export async function queryArticleEntries(
	collections: Array<ArticleEntry['collection']>,
): Promise<Array<ArticleEntry>> {
	const results = await Promise.all(collections.map((collection) => collectionData[collection]()));

	return results
		.flatMap(({ entries }): Array<ArticleEntry> => entries)
		.toSorted(sortByDateReverseChronological);
}

export function getArticleMinutesRead(
	entry: ArticleEntry,
	remarkPluginFrontmatter: Record<string, unknown>,
) {
	if (entry.collection !== 'posts') return;

	const { minutesRead } = remarkPluginFrontmatter;

	return typeof minutesRead === 'number' ? minutesRead : undefined;
}
