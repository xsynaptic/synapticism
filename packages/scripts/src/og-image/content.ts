import { getDataStoreCollection, loadDataStore } from './data-store.js';

const OG_COLLECTIONS = ['posts', 'projects', 'notes', 'pages'] as const;

export interface OgImageEntry {
	collection: string;
	id: string;
	title: string;
}

export function getOgImageEntries(dataStorePath: string): Array<OgImageEntry> {
	const collections = loadDataStore(dataStorePath);
	const entries: Array<OgImageEntry> = [];

	for (const collection of OG_COLLECTIONS) {
		for (const entry of getDataStoreCollection(collections, collection)) {
			const title = entry.data.title;

			if (typeof title === 'string') {
				entries.push({ collection, id: entry.id, title });
			}
		}
	}

	return entries;
}
