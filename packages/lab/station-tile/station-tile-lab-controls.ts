interface ColorSpec {
	key: 'glossColor' | 'grout';
	label: string;
	value: string;
}

type NumericOption =
	| 'bevel'
	| 'gloss'
	| 'grain'
	| 'grainGrout'
	| 'groutWidth'
	| 'jitter'
	| 'macroLighting'
	| 'stagger'
	| 'tileSize'
	| 'unitCells';

interface RangeSpec {
	key: NumericOption;
	label: string;
	max: number;
	min: number;
	step: number;
	value: number;
}

// Matches `.preview` in station-tile-lab.css so the canvas fills the box without cropping
export const LAB_ASPECT_RATIO = 4 / 3;

// Paint cost scales with cell count; a frame takes ~100 ms at size 16 and ~275 ms at 10 (GPU Chrome, DPR 2)
export const LAB_RANGES: ReadonlyArray<RangeSpec> = [
	{ key: 'tileSize', label: 'Tile size', max: 64, min: 16, step: 1, value: 28 },
	{ key: 'jitter', label: 'Jitter', max: 1, min: 0, step: 0.05, value: 0.8 },
	{ key: 'gloss', label: 'Gloss', max: 1, min: 0, step: 0.05, value: 0.25 },
	{ key: 'bevel', label: 'Bevel', max: 1, min: 0, step: 0.05, value: 0.35 },
	{ key: 'macroLighting', label: 'Macro light', max: 1, min: 0, step: 0.05, value: 0.3 },
	{ key: 'stagger', label: 'Stagger', max: 0.5, min: 0, step: 0.05, value: 0 },
	{ key: 'unitCells', label: 'Unit cells', max: 24, min: 4, step: 1, value: 12 },
	{ key: 'groutWidth', label: 'Grout width', max: 8, min: 1, step: 0.5, value: 2 },
	{ key: 'grain', label: 'Tile grain', max: 0.3, min: 0, step: 0.01, value: 0.05 },
	{ key: 'grainGrout', label: 'Grout grain', max: 1, min: 0, step: 0.05, value: 0.5 },
];

export const LAB_COLORS: ReadonlyArray<ColorSpec> = [
	{ key: 'grout', label: 'Grout', value: '#8a8a85' },
	{ key: 'glossColor', label: 'Gloss tint', value: '#ffffff' },
];

export function formatRangeValue(value: number): string {
	return Number.isSafeInteger(value) ? value.toString() : value.toFixed(2);
}
