export interface GridPosition {
	index: number;
	section: number;
}

export const gridMoves = {
	ArrowDown: 'down',
	ArrowLeft: 'left',
	ArrowRight: 'right',
	ArrowUp: 'up',
	End: 'end',
	Home: 'home',
} as const;

type GridMove = (typeof gridMoves)[keyof typeof gridMoves];

function rowOf(index: number, columns: number) {
	return Math.floor(index / columns);
}

function moveDown(sizes: Array<number>, from: GridPosition, columns: number): GridPosition {
	const size = sizes[from.section] ?? 0;

	if (from.index + columns < size) return { ...from, index: from.index + columns };

	// A short last row still counts as a row to land on
	if (rowOf(from.index, columns) < rowOf(size - 1, columns)) return { ...from, index: size - 1 };

	const nextSize = sizes[from.section + 1];

	if (nextSize === undefined) return from;

	return { index: Math.min(from.index % columns, nextSize - 1), section: from.section + 1 };
}

function moveUp(sizes: Array<number>, from: GridPosition, columns: number): GridPosition {
	if (from.index >= columns) return { ...from, index: from.index - columns };

	const previousSize = sizes[from.section - 1];

	if (previousSize === undefined) return from;

	const lastRowStart = rowOf(previousSize - 1, columns) * columns;

	return {
		index: Math.min(lastRowStart + (from.index % columns), previousSize - 1),
		section: from.section - 1,
	};
}

function moveAcross(sizes: Array<number>, from: GridPosition, step: -1 | 1): GridPosition {
	const index = from.index + step;
	const size = sizes[from.section] ?? 0;

	if (index >= 0 && index < size) return { ...from, index };

	const section = from.section + step;
	const neighbourSize = sizes[section];

	if (neighbourSize === undefined) return from;

	return { index: step === 1 ? 0 : neighbourSize - 1, section };
}

interface GridShape {
	columns: number;
	sizes: Array<number>;
}

// Sections arrive non-empty; the grid wraps at section ends, as the rendered rows do
export function moveInGrid(
	{ columns, sizes }: GridShape,
	from: GridPosition,
	move: GridMove,
): GridPosition {
	switch (move) {
		case 'down': {
			return moveDown(sizes, from, columns);
		}
		case 'end': {
			const section = sizes.length - 1;

			return { index: (sizes[section] ?? 1) - 1, section };
		}
		case 'home': {
			return { index: 0, section: 0 };
		}
		case 'left': {
			return moveAcross(sizes, from, -1);
		}
		case 'right': {
			return moveAcross(sizes, from, 1);
		}
		case 'up': {
			return moveUp(sizes, from, columns);
		}
	}
}
