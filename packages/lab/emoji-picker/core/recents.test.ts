import { describe, expect, it } from 'vitest';

import { addRecent } from '#emoji-picker/core/recents.ts';

describe('addRecent', () => {
	it('puts the newest first', () => {
		expect(addRecent(['1F600', '1F602'], '2764', 36)).toEqual(['2764', '1F600', '1F602']);
	});

	it('moves a repeat to the front instead of listing it twice', () => {
		expect(addRecent(['1F600', '1F602', '2764'], '1F602', 36)).toEqual(['1F602', '1F600', '2764']);
	});

	it('drops the oldest past the limit', () => {
		expect(addRecent(['b', 'c', 'd'], 'a', 3)).toEqual(['a', 'b', 'c']);
	});
});
