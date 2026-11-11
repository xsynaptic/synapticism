import { describe, expect, it } from 'vitest';

import { supportProbes } from '#emoji-picker/core/support-probes.ts';

function catalogOf(...emoji: Array<[string, number]>) {
	return {
		groups: [
			{
				emoji: emoji.map(([glyph, version]) => ({
					emoji: glyph,
					hexcode: glyph,
					label: glyph,
					version,
				})),
				key: 'test',
				label: 'Test',
			},
		],
	};
}

describe('supportProbes', () => {
	it('lists one glyph per version, newest first', () => {
		const probes = supportProbes(catalogOf(['😀', 1], ['🫠', 14], ['🫨', 15], ['🥲', 13]));

		expect(probes.map((probe) => probe.version)).toEqual([15, 14, 13, 1]);
	});

	it('prefers a single code point over a sequence of the same version', () => {
		const probes = supportProbes(catalogOf(['🧑‍🦰', 12.1], ['🫠', 12.1]));

		expect(probes[0]?.emoji).toBe('🫠');
	});

	it('falls back to a sequence when the version has nothing else', () => {
		expect(supportProbes(catalogOf(['❤️‍🔥', 13.1]))[0]?.emoji).toBe('❤️‍🔥');
	});
});
