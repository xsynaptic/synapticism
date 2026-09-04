import { describe, expect, test } from 'vitest';

import { validateEntryIds } from './entry-ids.js';
import { makeEntry } from './validate-test-utils.js';

describe('validateEntryIds', () => {
	test('accepts distinct IDs across collections', () => {
		const result = validateEntryIds([
			makeEntry({ collection: 'posts', id: 'urbanism' }),
			makeEntry({ collection: 'tags', id: 'architecture' }),
		]);

		expect(result.status).toBe('pass');
		expect(result.issues).toEqual([]);
	});

	test('flags the same ID claimed by two collections, listing both locations', () => {
		const result = validateEntryIds([
			makeEntry({ collection: 'posts', filePath: 'posts/urbanism.mdx', id: 'urbanism' }),
			makeEntry({ collection: 'tags', filePath: 'tags/urbanism.mdx', id: 'urbanism' }),
		]);

		expect(result.status).toBe('fail');
		expect(result.issues).toEqual([
			{
				details: ['posts/urbanism.mdx', 'tags/urbanism.mdx'],
				message: 'duplicate entry ID "urbanism"',
			},
		]);
	});
});
