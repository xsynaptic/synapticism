import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';

import type { GridPosition } from '#emoji-picker/core/grid-navigation.ts';

import { gridMoves, moveInGrid } from '#emoji-picker/core/grid-navigation.ts';

// Two sections at 4 columns: 10 cells (rows of 4, 4, 2), then 3 cells
const sizes = [10, 3];

describe('moveInGrid', () => {
	it('moves down a row within a section', () => {
		expect(moveInGrid({ columns: 4, sizes: sizes }, { index: 1, section: 0 }, 'down')).toEqual({
			index: 5,
			section: 0,
		});
	});

	it('lands on the last cell of a short final row', () => {
		expect(moveInGrid({ columns: 4, sizes: sizes }, { index: 7, section: 0 }, 'down')).toEqual({
			index: 9,
			section: 0,
		});
	});

	it('crosses into the next section keeping the column where it can', () => {
		expect(moveInGrid({ columns: 4, sizes: sizes }, { index: 9, section: 0 }, 'down')).toEqual({
			index: 1,
			section: 1,
		});
		expect(moveInGrid({ columns: 4, sizes: [10, 2] }, { index: 8, section: 0 }, 'down')).toEqual({
			index: 0,
			section: 1,
		});
	});

	it('crosses up into the last row of the previous section', () => {
		expect(moveInGrid({ columns: 4, sizes: sizes }, { index: 1, section: 1 }, 'up')).toEqual({
			index: 9,
			section: 0,
		});
		expect(moveInGrid({ columns: 4, sizes: sizes }, { index: 2, section: 1 }, 'up')).toEqual({
			index: 9,
			section: 0,
		});
	});

	it('wraps left and right across section ends', () => {
		expect(moveInGrid({ columns: 4, sizes: sizes }, { index: 9, section: 0 }, 'right')).toEqual({
			index: 0,
			section: 1,
		});
		expect(moveInGrid({ columns: 4, sizes: sizes }, { index: 0, section: 1 }, 'left')).toEqual({
			index: 9,
			section: 0,
		});
	});

	it('stays put at the edges of the grid', () => {
		expect(moveInGrid({ columns: 4, sizes: sizes }, { index: 0, section: 0 }, 'up')).toEqual({
			index: 0,
			section: 0,
		});
		expect(moveInGrid({ columns: 4, sizes: sizes }, { index: 2, section: 1 }, 'right')).toEqual({
			index: 2,
			section: 1,
		});
	});

	it('jumps to the first and last cell', () => {
		expect(moveInGrid({ columns: 4, sizes: sizes }, { index: 5, section: 0 }, 'end')).toEqual({
			index: 2,
			section: 1,
		});
		expect(moveInGrid({ columns: 4, sizes: sizes }, { index: 1, section: 1 }, 'home')).toEqual({
			index: 0,
			section: 0,
		});
	});
});

type Grid = Parameters<typeof moveInGrid>[0];

const grids = fc.record(
	{
		columns: fc.integer({ max: 6, min: 1 }),
		sizes: fc.array(fc.integer({ max: 10, min: 1 }), { maxLength: 4, minLength: 1 }),
	},
	{ noNullPrototype: true },
);

const gridsWithCell = grids.chain((grid) =>
	fc.nat({ max: grid.sizes.length - 1 }).chain((section) =>
		fc.record(
			{
				from: fc.record(
					{ index: fc.nat({ max: (grid.sizes[section] ?? 1) - 1 }), section: fc.constant(section) },
					{ noNullPrototype: true },
				),
				grid: fc.constant(grid),
			},
			{ noNullPrototype: true },
		),
	),
);

function isCell({ sizes }: Grid, { index, section }: GridPosition) {
	const size = sizes[section];

	return size !== undefined && Number.isSafeInteger(index) && index >= 0 && index < size;
}

function isSameCell(first: GridPosition, second: GridPosition) {
	return first.index === second.index && first.section === second.section;
}

function cellsInReadingOrder({ sizes }: Grid) {
	return sizes.flatMap((size, section) =>
		Array.from({ length: size }, (_, index) => ({ index, section })),
	);
}

function rowWidth({ columns, sizes }: Grid, { index, section }: GridPosition) {
	const rowStart = Math.floor(index / columns) * columns;

	return Math.min(columns, (sizes[section] ?? 0) - rowStart);
}

function rowAcrossSections({ columns, sizes }: Grid, { index, section }: GridPosition) {
	const rowsBefore = sizes
		.slice(0, section)
		.reduce((total, size) => total + Math.ceil(size / columns), 0);

	return rowsBefore + Math.floor(index / columns);
}

describe('moveInGrid over generated grids', () => {
	it.prop([gridsWithCell, fc.constantFrom(...Object.values(gridMoves))])(
		'lands on a cell that exists after every move',
		({ from, grid }, move) => {
			expect(isCell(grid, moveInGrid(grid, from, move))).toBe(true);
		},
	);

	it.prop([grids])('visits every cell once, in reading order, stepping right from Home', (grid) => {
		const cells = cellsInReadingOrder(grid);
		let position = moveInGrid(grid, { index: 0, section: 0 }, 'home');

		for (const cell of cells) {
			expect(position).toEqual(cell);
			position = moveInGrid(grid, position, 'right');
		}

		expect(position).toEqual(cells.at(-1));
	});

	it.prop([gridsWithCell])('undoes a step right with a step left', ({ from, grid }) => {
		const right = moveInGrid(grid, from, 'right');

		fc.pre(!isSameCell(right, from));

		expect(moveInGrid(grid, right, 'left')).toEqual(from);
	});

	it.prop([gridsWithCell])(
		'moves up or down exactly one row, counting rows across sections',
		({ from, grid }) => {
			const row = rowAcrossSections(grid, from);
			const lastRow = rowAcrossSections(grid, moveInGrid(grid, from, 'end'));

			expect(rowAcrossSections(grid, moveInGrid(grid, from, 'down'))).toBe(
				Math.min(row + 1, lastRow),
			);
			expect(rowAcrossSections(grid, moveInGrid(grid, from, 'up'))).toBe(Math.max(row - 1, 0));
		},
	);

	it.prop([gridsWithCell, fc.constantFrom('down' as const, 'up' as const)], { numRuns: 1000 })(
		'keeps its column moving up or down, or takes the last cell of a narrower row',
		({ from, grid }, move) => {
			const to = moveInGrid(grid, from, move);

			fc.pre(!isSameCell(to, from));

			expect(to.index % grid.columns).toBe(
				Math.min(from.index % grid.columns, rowWidth(grid, to) - 1),
			);
		},
	);
});
