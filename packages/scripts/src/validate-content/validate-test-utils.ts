import type { ContentEntry } from '../shared/astro-content.js';

export function makeEntry(
	overrides: Partial<ContentEntry> & Pick<ContentEntry, 'id'>,
): ContentEntry {
	return { collection: 'posts', data: {}, ...overrides };
}
