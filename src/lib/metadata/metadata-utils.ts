import type { CollectionEntry } from 'astro:content';

import type {
	ContentMetadataCollectionKey,
	ContentMetadataItem,
} from '#lib/metadata/metadata-types.ts';

import { parseContentDate } from '#lib/utils/date.ts';
import { getContentUrl } from '#lib/utils/routing.ts';
import { getEntryDescription } from '#lib/utils/text.ts';

export function createContentMetadataItems<
	T extends ContentMetadataCollectionKey = ContentMetadataCollectionKey,
>(entries: Array<CollectionEntry<T>>): Array<ContentMetadataItem<T>> {
	return entries.map((entry) => ({
		collection: entry.collection as T,
		id: entry.id,
		title: entry.data.title,
		description: getEntryDescription(entry),
		url: getContentUrl(entry.collection, entry.id),
		dateCreated: parseContentDate(entry.data.dateCreated) ?? new Date(),
		dateUpdated: parseContentDate(
			'dateUpdated' in entry.data
				? (entry.data.dateUpdated as string | Date | undefined)
				: undefined,
		),
	}));
}

export function sortContentMetadataByDate(a: ContentMetadataItem, b: ContentMetadataItem) {
	const dateA = a.dateUpdated ?? a.dateCreated;
	const dateB = b.dateUpdated ?? b.dateCreated;

	return dateB.valueOf() - dateA.valueOf();
}
