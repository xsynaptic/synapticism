import { existsSync } from 'node:fs';
import path from 'node:path';

import { getDataStoreCollection, loadDataStore } from './data-store.js';

// Singular labels for the card's meta line; kept local because the site's i18n strings
// sit behind an Astro path alias this script can't resolve
const ogCollections = {
	notes: 'note',
	pages: 'page',
	posts: 'post',
	projects: 'project',
} as const;

export interface OgImageEntry {
	collection: string;
	// Content hash from the data store; drives output cache freshness
	digest: string;
	id: string;
	// Media id relative to the media directory; a stable cache key, unlike an absolute path
	imageId?: string;
	label: string;
	title: string;
}

export function getOgImageEntries({
	dataStorePath,
	mediaPath,
}: {
	dataStorePath: string;
	mediaPath: string;
}): Array<OgImageEntry> {
	const collections = loadDataStore(dataStorePath);
	const entries: Array<OgImageEntry> = [];

	for (const [collection, label] of Object.entries(ogCollections)) {
		for (const entry of getDataStoreCollection(collections, collection)) {
			const title = entry.data.title;

			if (typeof title === 'string') {
				const imageId = resolveImageId(entry.data, mediaPath);

				entries.push({
					collection,
					digest: entry.digest ?? '',
					id: entry.id,
					label,
					title,
					...(imageId ? { imageId } : {}),
				});
			}
		}
	}

	return entries;
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
