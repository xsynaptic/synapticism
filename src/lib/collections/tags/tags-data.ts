import type { CollectionEntry } from 'astro:content';

import { createCollectionData, getRawCollection } from '#lib/utils/collections.ts';

export const getTagsCollection = createCollectionData({
	collection: 'tags',
	async compute() {
		const [posts, notes, projects] = await Promise.all([
			getRawCollection('posts'),
			getRawCollection('notes'),
			getRawCollection('projects'),
		]);

		const tagged = [...posts, ...notes, ...projects];

		return function computeTag(entry: CollectionEntry<'tags'>) {
			return {
				_entryCount: tagged.filter((item) => item.data.tags?.some(({ id }) => id === entry.id))
					.length,
			};
		};
	},
	label: 'Tags',
});
