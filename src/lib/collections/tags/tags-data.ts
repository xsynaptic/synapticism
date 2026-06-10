import { getCollection } from 'astro:content';

import { createCollectionData } from '#lib/utils/collections.ts';

export const getTagsCollection = createCollectionData({
	async augment(entries) {
		const [posts, notes, projects] = await Promise.all([
			getCollection('posts'),
			getCollection('notes'),
			getCollection('projects'),
		]);

		const tagged = [...posts, ...notes, ...projects];

		for (const entry of entries) {
			entry.data._contentCount = tagged.filter((item) =>
				item.data.tags?.some(({ id }) => id === entry.id),
			).length;
		}
	},
	collection: 'tags',
	label: 'Tags',
});
