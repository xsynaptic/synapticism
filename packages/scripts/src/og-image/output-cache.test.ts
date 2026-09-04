import { describe, expect, test } from 'vitest';

import { getOutputCacheKey } from './output-cache.js';

describe('getOutputCacheKey', () => {
	const base = { digest: 'digest', imageId: 'image/entry.jpg', imageModifiedTime: 1000 };

	test('changes when the source image is edited, so a retouched photo regenerates its cards', () => {
		expect(getOutputCacheKey({ ...base, imageModifiedTime: 2000 })).not.toBe(
			getOutputCacheKey(base),
		);
	});

	test('changes when the entry content changes', () => {
		expect(getOutputCacheKey({ ...base, digest: 'other' })).not.toBe(getOutputCacheKey(base));
	});

	test('stays stable when the source image has no modified time', () => {
		const key = getOutputCacheKey({ ...base, imageModifiedTime: undefined });

		expect(key).toBe(getOutputCacheKey({ ...base, imageModifiedTime: undefined }));
		expect(key).not.toBe(getOutputCacheKey(base));
	});
});
