import { describe, expect, it } from 'vitest';

import type { Cell } from '#station-tile/core/layout.ts';
import type { TileInput } from '#station-tile/core/options.ts';

import { layoutTiles } from '#station-tile/core/layout.ts';
import { resolveOptions } from '#station-tile/core/options.ts';

function layout(input: TileInput) {
	const options = resolveOptions({ seed: 'layout-test', ...input });

	return { cells: layoutTiles(options), options };
}

function positionKey(cell: Cell) {
	return `${String(cell.x)},${String(cell.y)}`;
}

describe('layoutTiles', () => {
	it('keeps each cell colour when the grid grows', () => {
		const small = layout({ seamless: true, unitCells: 4 }).cells;
		const large = new Map(
			layout({ seamless: true, unitCells: 8 }).cells.map((cell) => [positionKey(cell), cell]),
		);

		for (const cell of small) {
			expect(large.get(positionKey(cell))?.baseColor).toEqual(cell.baseColor);
		}
	});

	it('emits a wrapped twin for every cell overhanging a seamless unit', () => {
		const { cells, options } = layout({ seamless: true, stagger: 0.5, unitCells: 6 });
		const overhanging = cells.filter((cell) => cell.x < 0 || cell.x + cell.size > options.width);

		expect(overhanging.length).toBeGreaterThan(0);

		for (const cell of overhanging) {
			const twinX = cell.x < 0 ? cell.x + options.width : cell.x - options.width;
			const twin = cells.find((candidate) => candidate.x === twinX && candidate.y === cell.y);

			expect(twin?.baseColor).toEqual(cell.baseColor);
		}
	});
});
