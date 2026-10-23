import type { CollectionEntry } from 'astro:content';

import { postReadingTimeMinimumMinutes } from '#constants.ts';
import { getPostsCollection } from '#lib/collections/posts/posts-data.ts';
import { sortByDateReverseChronological } from '#lib/utils/date.ts';

export async function queryPostEntries(): Promise<Array<CollectionEntry<'posts'>>> {
	const { entries } = await getPostsCollection();

	return entries.toSorted(sortByDateReverseChronological);
}

export function getPostMinutesRead(remarkPluginFrontmatter: Record<string, unknown>) {
	const { minutesRead } = remarkPluginFrontmatter;

	if (typeof minutesRead !== 'number' || minutesRead < postReadingTimeMinimumMinutes) return;

	return minutesRead;
}
