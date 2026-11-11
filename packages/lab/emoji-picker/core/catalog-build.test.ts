import type { Emoji } from 'emojibase';

import { describe, expect, it } from 'vitest';

import type { CatalogSources } from '#emoji-picker/core/catalog-build.ts';

import { buildCatalog, parseOverrides } from '#emoji-picker/core/catalog-build.ts';

function fixtureEmoji(fields: Partial<Emoji> & Pick<Emoji, 'emoji' | 'hexcode' | 'label'>): Emoji {
	return { group: 0, order: 1, tags: [], text: '', type: 1, version: 1, ...fields };
}

const heart = fixtureEmoji({
	emoji: '❤️',
	emoticon: '<3',
	hexcode: '2764',
	label: 'red heart',
	order: 2,
	tags: ['Love', 'heart', 'red'],
});

const joy = fixtureEmoji({
	emoji: '😂',
	hexcode: '1F602',
	label: 'face with tears of joy',
	tags: ['laugh', 'lol'],
});

const swatch = fixtureEmoji({ emoji: '🏻', group: 2, hexcode: '1F3FB', label: 'light skin tone' });

function fixtureSources(overrides: CatalogSources['overrides'] = {}): CatalogSources {
	return {
		community: {
			'❤': ['red_heart', 'love', 'valentines'],
			'😂': ['face_with_tears_of_joy', 'lmao'],
		},
		emoji: [heart, joy, swatch],
		groups: [
			{ key: 'smileys-emotion', message: 'smileys & emotion', order: 0 },
			{ key: 'component', message: 'components', order: 2 },
		],
		overrides,
		shortcodes: [{ '1F602': 'joy', '2764': 'heart' }, { '1F602': ['joy', 'lol'] }],
	};
}

function searchEntry(sources: CatalogSources, hexcode: string) {
	return buildCatalog(sources).search.emoji.find((item) => item.hexcode === hexcode);
}

describe('buildCatalog', () => {
	it('lists the grid in emojibase order and leaves out the component group', () => {
		const { grid } = buildCatalog(fixtureSources());

		expect(grid.groups.map((group) => group.label)).toEqual(['Smileys & emotion']);
		expect(grid.groups[0]?.emoji.map((item) => item.hexcode)).toEqual(['1F602', '2764']);
	});

	it('keeps each layer in its own field, deduplicating community words a higher layer holds', () => {
		expect(searchEntry(fixtureSources({ '❤️': { add: ['amor'] } }), '2764')).toEqual({
			community: ['valentines'],
			hexcode: '2764',
			keywords: ['love', 'heart', 'red', 'amor'],
			label: 'red heart',
			shortcodes: ['heart'],
		});
	});

	it('merges shortcode presets in order without repeats', () => {
		expect(searchEntry(fixtureSources(), '1F602')?.shortcodes).toEqual(['joy', 'lol']);
	});

	it('joins emojilib entries whose key lacks the variation selector', () => {
		expect(searchEntry(fixtureSources(), '2764')?.community).toContain('valentines');
	});

	it('matches an override key with or without the variation selector', () => {
		const withoutSelector = searchEntry(fixtureSources({ '❤': { add: ['amor'] } }), '2764');

		expect(withoutSelector?.keywords).toContain('amor');
	});

	it('strips a removed word from every lower layer but keeps additions', () => {
		const entry = searchEntry(
			fixtureSources({ '😂': { add: ['lol'], remove: ['lol', 'lmao', 'laugh'] } }),
			'1F602',
		);

		expect(entry?.keywords).toEqual(['lol']);
		expect(entry?.shortcodes).toEqual(['joy']);
		expect(entry?.community).not.toContain('lmao');
	});

	it('fails on an override for an emoji the catalog does not list', () => {
		expect(() => buildCatalog(fixtureSources({ '🏻': { add: ['pale'] } }))).toThrow(/🏻/);
	});

	it('ships emoticons for an exact lookup', () => {
		expect(buildCatalog(fixtureSources()).search.emoticons).toEqual({ '<3': '2764' });
	});
});

describe('parseOverrides', () => {
	it('rejects a key other than add or remove', () => {
		expect(() => parseOverrides('😂:\n  hidden: true\n')).toThrow();
	});

	it('reads an empty file as no overrides', () => {
		expect(parseOverrides('')).toEqual({});
	});
});
