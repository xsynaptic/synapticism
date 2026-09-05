import type { ContentEntry } from '#shared/astro-content.js';

export function makeEntry(
	overrides: Partial<ContentEntry> & Pick<ContentEntry, 'id'>,
): ContentEntry {
	return { collection: 'posts', data: {}, ...overrides };
}

// References are stored as `{ id, collection }` records, which is what the walker looks for
export function makeRefs(collection: string, ids: Array<string>) {
	return ids.map((id) => ({ collection, id }));
}
