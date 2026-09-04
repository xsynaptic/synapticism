import { describe, expect, test } from 'vitest';

import type { OpenGraphContentEntry } from './types.js';

import { batchEntriesBySourceImage } from './batch.js';

function makeOgEntry(overrides: Partial<OpenGraphContentEntry> = {}): OpenGraphContentEntry {
	return {
		collection: 'posts',
		digest: 'digest',
		id: 'entry',
		imageId: 'image/entry.jpg',
		label: 'post',
		title: 'Title',
		...overrides,
	};
}

describe('batchEntriesBySourceImage', () => {
	test('groups entries sharing a source image into one batch carrying that image', () => {
		const batches = batchEntriesBySourceImage([
			makeOgEntry({ id: 'a' }),
			makeOgEntry({ id: 'b' }),
			makeOgEntry({ id: 'c', imageId: 'image/other.jpg' }),
		]);

		expect(batches).toEqual([
			{
				entries: [expect.objectContaining({ id: 'a' }), expect.objectContaining({ id: 'b' })],
				imageId: 'image/entry.jpg',
			},
			{ entries: [expect.objectContaining({ id: 'c' })], imageId: 'image/other.jpg' },
		]);
	});

	test('collects the image-less entries into a batch with no image to decode', () => {
		const batches = batchEntriesBySourceImage([
			makeOgEntry({ id: 'a', imageId: undefined }),
			makeOgEntry({ id: 'b', imageId: undefined }),
		]);

		expect(batches).toHaveLength(1);
		expect(batches[0]).not.toHaveProperty('imageId');
		expect(batches[0]?.entries.map((entry) => entry.id)).toEqual(['a', 'b']);
	});
});
