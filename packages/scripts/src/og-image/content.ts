import { existsSync } from 'node:fs';
import path from 'node:path';

import { getDataStoreCollection, loadDataStore } from './data-store.js';

// Singular labels for the card's meta line; kept local because the site's i18n strings
// sit behind an Astro path alias this script can't resolve
const OG_COLLECTIONS = {
	notes: 'note',
	pages: 'page',
	posts: 'post',
	projects: 'project',
} as const;

export interface OgImageEntry {
	collection: string;
	id: string;
	imagePath?: string;
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

	for (const [collection, label] of Object.entries(OG_COLLECTIONS)) {
		for (const entry of getDataStoreCollection(collections, collection)) {
			const title = entry.data.title;

			if (typeof title === 'string') {
				const imagePath = resolveImagePath(entry.data, mediaPath);

				entries.push({
					collection,
					id: entry.id,
					label,
					title,
					...(imagePath ? { imagePath } : {}),
				});
			}
		}
	}

	return entries;
}

// Prefer the card image over the in-page banner; a missing file degrades to the title-only card
function resolveImagePath(data: Record<string, unknown>, mediaPath: string): string | undefined {
	const mediaId = data.imageFeatured ?? data.imageHero;

	if (typeof mediaId !== 'string') return undefined;

	const filePath = path.join(mediaPath, mediaId);

	return existsSync(filePath) ? filePath : undefined;
}
