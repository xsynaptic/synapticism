import { describe, expect, it } from 'vitest';

import type { SearchCatalog } from '#emoji-picker/core/catalog-types.ts';

import { createEmojiSearch } from '#emoji-picker/core/search.ts';
import catalog from '#emoji-picker/data/search-en.json' with { type: 'json' };

const search = createEmojiSearch(catalog satisfies SearchCatalog);

const labelByHexcode = new Map(catalog.emoji.map((item) => [item.hexcode, item.label]));

function labelsFor(query: string) {
	return search(query).map((hexcode) => labelByHexcode.get(hexcode));
}

describe('emoji search', () => {
	it('finds 😂 for the slang "lol"', () => {
		expect(labelsFor('lol')).toContain('face with tears of joy');
	});

	it.each([
		['fire', 'fire'],
		['dog', 'dog'],
		['Thumbs  Up', 'thumbs up'],
	])('puts the emoji whose label is "%s" first', (query, label) => {
		expect(labelsFor(query)[0]).toBe(label);
	});

	it('puts every emoji first when its whole label is the query, capitals included', () => {
		const misranked = catalog.emoji
			.filter((item) => search(item.label)[0] !== item.hexcode)
			.map((item) => item.label);

		expect(misranked).toEqual([]);
	});

	it.each([
		[':+1:', 'thumbs up'],
		[':thumbsup:', 'thumbs up'],
		[':Joy:', 'face with tears of joy'],
		[':)', 'slightly smiling face'],
		['<3', 'red heart'],
	])('finds %s through the exact lookup', (query, label) => {
		expect(labelsFor(query)[0]).toBe(label);
	});

	it('tolerates a typo in a longer word: "sunglases" finds 😎', () => {
		expect(labelsFor('sunglases')).toContain('smiling face with sunglasses');
	});

	it('tries fuzzy matching only when nothing matches exactly, so "robot" does not drift to "root"', () => {
		expect(labelsFor('robot')).toContain('robot');
		expect(labelsFor('robot')).not.toContain('root vegetable');
	});

	it('requires every word of a multi-word query', () => {
		expect(labelsFor('thumbs')).toContain('thumbs down');
		expect(labelsFor('thumbs up')).toContain('thumbs up');
		expect(labelsFor('thumbs up')).not.toContain('thumbs down');
	});

	it('matches a prefix as it is typed', () => {
		expect(labelsFor('sungl')).toContain('smiling face with sunglasses');
	});

	it('keeps short terms exact, so "cap" does not drift to "cat"', () => {
		expect(labelsFor('cap')).toContain('billed cap');
		expect(labelsFor('cap')).not.toContain('cat');
	});

	it('finds a local override addition', () => {
		expect(labelsFor('no cap')[0]).toBe('billed cap');
	});

	it('returns nothing for an empty query', () => {
		expect(search(' '.repeat(3))).toEqual([]);
	});
});
