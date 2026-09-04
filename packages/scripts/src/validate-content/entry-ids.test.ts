import { describe, expect, test } from 'vitest';

import { collectDuplicateIdIssues } from './entry-ids.js';
import { makeEntry } from './validate-test-utils.js';

describe('collectDuplicateIdIssues', () => {
	test('accepts distinct IDs across collections', () => {
		const entries = [
			makeEntry({ collection: 'posts', id: 'urbanism' }),
			makeEntry({ collection: 'tags', id: 'architecture' }),
		];

		expect(collectDuplicateIdIssues(entries)).toEqual([]);
	});

	test('flags the same ID claimed by two collections, listing both locations', () => {
		const entries = [
			makeEntry({ collection: 'posts', filePath: 'posts/urbanism.mdx', id: 'urbanism' }),
			makeEntry({ collection: 'tags', filePath: 'tags/urbanism.mdx', id: 'urbanism' }),
		];

		expect(collectDuplicateIdIssues(entries)).toEqual([
			{ id: 'urbanism', locations: ['posts/urbanism.mdx', 'tags/urbanism.mdx'] },
		]);
	});
});
