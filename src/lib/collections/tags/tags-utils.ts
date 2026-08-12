import type { CollectionEntry } from 'astro:content';

import * as R from 'remeda';

import { getCatalog } from '#lib/catalog/catalog-data.ts';
import { sortCatalogByDate } from '#lib/catalog/catalog-utils.ts';
import { getNotesCollection } from '#lib/collections/notes/notes-data.ts';
import { getPostsCollection } from '#lib/collections/posts/posts-data.ts';
import { getProjectsCollection } from '#lib/collections/projects/projects-data.ts';
import { getTagsCollection } from '#lib/collections/tags/tags-data.ts';
import {
	createCollectionLookupByIds,
	filterHasEntries,
	sortByEntryCount,
} from '#lib/utils/collections.ts';

export const createTagsByIdsFunction = createCollectionLookupByIds('Tags', getTagsCollection);

export async function queryTagsEntryContent(entry: CollectionEntry<'tags'>) {
	const [{ entries: posts }, { entries: notes }, { entries: projects }] = await Promise.all([
		getPostsCollection(),
		getNotesCollection(),
		getProjectsCollection(),
	]);
	const catalog = await getCatalog();

	const tagged = [...posts, ...notes, ...projects].filter(({ data }) =>
		data.tags?.some(({ id }) => id === entry.id),
	);

	return R.pipe(catalog.resolve(tagged), R.sort(sortCatalogByDate));
}

export async function queryTagsIndex() {
	const { entries } = await getTagsCollection();

	return R.pipe(entries, R.filter(filterHasEntries), R.sort(sortByEntryCount));
}

const NON_ALPHABETIC_GROUP = '#';

export function groupTagsByLetter(tags: Array<CollectionEntry<'tags'>>) {
	const groups = new Map<string, Array<CollectionEntry<'tags'>>>();

	for (const tag of tags) {
		const initial = tag.data.title.charAt(0).toUpperCase();
		const letter = /[A-Z]/.test(initial) ? initial : NON_ALPHABETIC_GROUP;

		const group = groups.get(letter);

		if (group) {
			group.push(tag);
		} else {
			groups.set(letter, [tag]);
		}
	}

	const groupList = [...groups].map(([letter, groupTags]) => ({
		letter,
		tags: R.sortBy(groupTags, (tag) => tag.data.title.toLowerCase()),
	}));

	// Alphabetic buckets in order, then the non-alphabetic bucket last
	const alphabetic = groupList
		.filter((group) => group.letter !== NON_ALPHABETIC_GROUP)
		.sort((groupA, groupB) => groupA.letter.localeCompare(groupB.letter));
	const nonAlphabetic = groupList.filter((group) => group.letter === NON_ALPHABETIC_GROUP);

	return [...alphabetic, ...nonAlphabetic];
}
