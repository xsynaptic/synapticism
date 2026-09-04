import type { CollectionEntry } from 'astro:content';

import type { Thing } from '#lib/utils/structured-data.ts';

import { getDescriptionRenderedText } from '#lib/utils/description.ts';
import { buildArticleSchema, buildAuthorSchema } from '#lib/utils/structured-data.ts';

export async function getNoteSchema(
	entry: CollectionEntry<'notes'>,
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
