import type { CollectionEntry } from 'astro:content';

import * as R from 'remeda';

import type { Thing } from '#lib/utils/structured-data.ts';

import { getCatalog } from '#lib/catalog/catalog-data.ts';
import { sortCatalogByDate } from '#lib/catalog/catalog-utils.ts';
import { getDescriptionRenderedText } from '#lib/utils/description.ts';
import { buildArticleSchema, buildAuthorSchema } from '#lib/utils/structured-data.ts';

export function getNoteSchema(
	entry: CollectionEntry<'notes'>,
	props: { authorName: string; url: string },
): Array<Thing> {
	return [
		buildArticleSchema({
			dateCreated: entry.data.dateCreated,
			dateUpdated: entry.data.dateUpdated,
			description: getDescriptionRenderedText(entry),
			imageUrl: undefined,
			title: entry.data.title,
			url: props.url,
		}),
		buildAuthorSchema(props.authorName),
	];
}

export async function queryNotesIndex() {
	const catalog = await getCatalog();

	return R.pipe(catalog.byCollection('notes'), R.sort(sortCatalogByDate));
}
