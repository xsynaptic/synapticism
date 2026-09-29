import { describe, expect, it } from 'vitest';

import { generateTileSvg } from '#station-tile/core/render.ts';

describe('generateTileSvg', () => {
	it('gives the same seed an identical SVG', () => {
		const input = { seed: 'admiralty', stagger: 0.25, theme: 'teal', tileSize: 26 } as const;

		expect(generateTileSvg(input).svg).toBe(generateTileSvg(input).svg);
	});

	it('gives a different seed a different SVG', () => {
		expect(generateTileSvg({ seed: 'admiralty' }).svg).not.toBe(
			generateTileSvg({ seed: 'causeway-bay' }).svg,
		);
	});
});
