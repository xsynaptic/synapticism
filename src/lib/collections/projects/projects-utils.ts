import type { CollectionEntry } from 'astro:content';

import * as R from 'remeda';

import { getCatalog } from '#lib/catalog/catalog-data.ts';
import { sortCatalogByDate } from '#lib/catalog/catalog-utils.ts';
import { getNotesCollection } from '#lib/collections/notes/notes-data.ts';
import { getPostsCollection } from '#lib/collections/posts/posts-data.ts';
import { getProjectsCollection } from '#lib/collections/projects/projects-data.ts';
import { createCollectionLookupByIds } from '#lib/utils/collections.ts';

export const createProjectsByIdsFunction = createCollectionLookupByIds(
	'Projects',
	getProjectsCollection,
);

export async function queryProjectEntryContent(entry: CollectionEntry<'projects'>) {
	const [{ entries: posts }, { entries: notes }] = await Promise.all([
		getPostsCollection(),
		getNotesCollection(),
	]);
	const catalog = await getCatalog();

	const members = [...posts, ...notes].filter(({ data }) =>
		data.projects?.some(({ id }) => id === entry.id),
	);

	return R.pipe(catalog.resolve(members), R.sort(sortCatalogByDate));
}

export async function queryProjectsIndex() {
	const catalog = await getCatalog();

	return R.pipe(catalog.byCollection('projects'), R.sort(sortCatalogByDate));
}
