import { describe, expect, it } from 'vitest';

import { moveInGrid } from '#emoji-picker/core/grid-navigation.ts';

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
