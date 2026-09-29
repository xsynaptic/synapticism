import { describe, expect, it } from 'vitest';

import { resolveOptions } from '#station-tile/core/options.ts';

function repeatRows(unitCells: number, stagger: number) {
	const { groutWidth, height, tileSize } = resolveOptions({ seamless: true, stagger, unitCells });

	return height / (tileSize + groutWidth);
}

describe('resolveOptions', () => {
	it.each([3, 5, 12])(
		'gives a staggered repeat unit of %i cells an even row count',
		(unitCells) => {
			expect(repeatRows(unitCells, 0.5) % 2).toBe(0);
		},
	);

	it('leaves an unstaggered repeat unit square', () => {
		expect(repeatRows(5, 0)).toBe(5);
	});
});
