import type { CollectionKey } from 'astro:content';

import { getImageFeaturedId } from '@synapticism/shared/image-featured';
import { getOpenGraphId } from '@synapticism/shared/open-graph';

import type { OpenGraphContentEntry, OpenGraphEntryItem } from '#og-image/types.ts';
import type { ContentEntry } from '#shared/astro-content.ts';

import { getCollectionEntries, withAstroContent } from '#shared/astro-content.ts';

// Doubles as the collection filter; `undefined` draws the card with no label
const openGraphCollections = {
	notes: 'note',
	pages: undefined,
	posts: 'post',
	projects: 'project',
	tags: 'tag',
} satisfies Record<string, string | undefined>;

// `getCollection` wants the literal keys, which `Object.keys` widens back to `string`
const openGraphCollectionKeys = Object.keys(openGraphCollections) as Array<CollectionKey>;

export async function getOpenGraphContentEntries(): Promise<Array<OpenGraphContentEntry>> {
	const contentEntries = await withAstroContent((content) =>
		getCollectionEntries(content, openGraphCollectionKeys),
	);

	const entries: Array<OpenGraphContentEntry> = [];

	for (const entry of contentEntries) {
		// No digest means no cache key, so the card could never be reused
		if (!entry.digest) continue;

		const item = toOpenGraphEntryItem({ collection: entry.collection, entry });

		if (item) entries.push({ ...item, digest: String(entry.digest) });
	}

	return entries;
}

export function toOpenGraphEntryItem({
	collection,
	entry,
}: {
	collection: string;
	entry: Pick<ContentEntry, 'data' | 'id'>;
}): OpenGraphEntryItem | undefined {
	const title = entry.data.title;

	if (typeof title !== 'string' || !Object.hasOwn(openGraphCollections, collection))
		return undefined;

	const label = openGraphCollections[collection as keyof typeof openGraphCollections];
	const imageId = getImageFeaturedId(entry.data.imageFeatured);

	return { imageId, label, outputId: getOpenGraphId(collection, entry.id), title };
}
