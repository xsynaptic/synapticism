import type { CollectionEntry } from 'astro:content';

import * as R from 'remeda';

import type { Thing } from '#lib/utils/structured-data.ts';

import { getNotesCollection } from '#lib/collections/notes/notes-data.ts';
import {
	createContentMetadataItems,
	sortContentMetadataByDate,
} from '#lib/metadata/metadata-utils.ts';
import { buildArticleSchema, buildAuthorSchema } from '#lib/utils/structured-data.ts';
import { getEntryDescription } from '#lib/utils/text.ts';

export function getNoteSchema(
	entry: CollectionEntry<'notes'>,
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

export async function queryNotesIndex() {
	const { entries } = await getNotesCollection();

	return R.pipe(entries, createContentMetadataItems, R.sort(sortContentMetadataByDate));
}
