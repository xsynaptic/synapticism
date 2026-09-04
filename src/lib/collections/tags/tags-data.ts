import { createCollectionData, getRawCollection } from '#lib/utils/collections.ts';

export const getTagsCollection = createCollectionData({
	collection: 'tags',
	label: 'Tags',
	async mutate(entries) {
		const [posts, notes, projects] = await Promise.all([
			getRawCollection('posts'),
			getRawCollection('notes'),
			getRawCollection('projects'),
		]);

		const tagged = [...posts, ...notes, ...projects];

		for (const entry of entries) {
			entry.data._entryCount = tagged.filter((item) =>
				item.data.tags?.some(({ id }) => id === entry.id),
			).length;
		}
	},
});
