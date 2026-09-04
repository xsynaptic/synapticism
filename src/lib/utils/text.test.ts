import { describe, expect, test } from 'vitest';

import { textClipper } from '#lib/utils/text.ts';

describe('textClipper', () => {
	test('returns input untouched at exactly the word count', () => {
		expect(textClipper('one two three', { wordCount: 3 })).toBe('one two three');
	});

	test('clips at the word count and appends the default trailer', () => {
		expect(textClipper('The quick brown fox jumps over the lazy dog', { wordCount: 4 })).toBe(
			'The quick brown fox...',
		);
	});

	test('supports a custom trailer', () => {
		expect(textClipper('one two three four', { trailer: '…', wordCount: 2 })).toBe('one two…');
	});
});
