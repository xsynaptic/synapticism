import { getCollection } from 'astro:content';

import { createCollectionData } from '#lib/utils/collections.ts';

export const getTagsCollection = createCollectionData({
	async augment(entries) {
		const posts = await getCollection('posts');

		for (const entry of entries) {
			entry.data._postCount = posts.filter((post) =>
				post.data.tags?.some(({ id }) => id === entry.id),
			).length;
		}
	},
	collection: 'tags',
	label: 'Tags',
});
