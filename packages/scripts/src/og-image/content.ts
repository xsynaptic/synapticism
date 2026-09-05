import type { CollectionKey } from 'astro:content';

import { existsSync } from 'node:fs';
import path from 'node:path';

import type { ContentEntry } from '#shared/astro-content.js';

import { getCollectionEntries, withAstroContent } from '#shared/astro-content.js';

import type { OpenGraphContentEntry, OpenGraphEntryItem } from './types.js';

// Singular labels for the card's meta line; kept local because the site's i18n strings
// sit behind an Astro path alias this script can't resolve
// The map doubles as the filter: a collection missing from it gets no card
const openGraphCollections: Record<string, string> = {
	notes: 'note',
	pages: 'page',
	posts: 'post',
	projects: 'project',
};

// `getCollection` wants the literal keys, which `Object.keys` widens back to `string`
const openGraphCollectionKeys = Object.keys(openGraphCollections) as Array<CollectionKey>;

export async function getOpenGraphContentEntries({
	mediaPath,
}: {
	mediaPath: string;
}): Promise<Array<OpenGraphContentEntry>> {
	const contentEntries = await withAstroContent((content) =>
		getCollectionEntries(content, openGraphCollectionKeys),
	);

	const entries: Array<OpenGraphContentEntry> = [];

	// Already grouped by collection, in the order they were requested
	for (const entry of contentEntries) {
		// No digest means no cache key, so a card for this Entry could never be reused
		if (!entry.digest) continue;

		const item = toOpenGraphEntryItem({ collection: entry.collection, entry, mediaPath });

		if (item) entries.push({ ...item, digest: String(entry.digest) });
	}

	return entries;
}

// The one place an Entry becomes a card, shared with the dev-only Inventory route
export function toOpenGraphEntryItem({
	collection,
	entry,
	mediaPath,
}: {
	collection: string;
	entry: Pick<ContentEntry, 'data' | 'id'>;
	mediaPath: string;
}): OpenGraphEntryItem | undefined {
	const label = openGraphCollections[collection];
	const title = entry.data.title;

	if (!label || typeof title !== 'string') return undefined;

	const imageId = resolveImageId(entry.data, mediaPath);

	return { collection, id: entry.id, imageId, label, title };
}

// Mirrored from src/lib/utils/image-featured.ts; this script can't resolve the site's path aliases
function getImageFeaturedId(imageFeatured: unknown): string | undefined {
	if (typeof imageFeatured === 'string') return imageFeatured;

	if (!Array.isArray(imageFeatured)) return undefined;

	const item: unknown = imageFeatured[0];

	if (typeof item === 'string') return item;

	if (typeof item === 'object' && item !== null && 'id' in item) {
		const { id } = item;

		if (typeof id === 'string') return id;
	}

	return undefined;
}

// A missing file degrades to the title-only card
function resolveImageId(data: Record<string, unknown>, mediaPath: string): string | undefined {
	const mediaId = getImageFeaturedId(data.imageFeatured);

	if (!mediaId) return undefined;

	return existsSync(path.join(mediaPath, mediaId)) ? mediaId : undefined;
}
