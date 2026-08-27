import type { ResolvedOptions } from './options.ts';
import type { RgbColor } from './utils.ts';

import { GLOSS, JITTER, MACRO, TILT } from './appearance.ts';
import { cellSeed, jitterHsl, lerp, mulberry32, shiftLightness, signed } from './utils.ts';

export interface Cell {
	baseColor: RgbColor;
	glossClumpVariant: 0 | 1;
	glossIntensity: number;
	size: number;
	tiltX: number;
	tiltY: number;
	x: number;
	y: number;
}

interface GridBounds {
	colEnd: number;
	colStart: number;
	rowEnd: number;
	rowStart: number;
}

interface MacroField {
	samples: Array<number>;
}

export function layoutTiles(options: ResolvedOptions): Array<Cell> {
	const { groutWidth, rootSeed, seamless, stagger, tileSize } = options;
	const cellSize = tileSize + groutWidth;
	const bounds = getGridBounds(options, cellSize);
	const macroField = seamless ? undefined : buildMacroField(rootSeed);
	const cells: Array<Cell> = [];

	for (let row = bounds.rowStart; row < bounds.rowEnd; row += 1) {
		// `%` keeps the sign of the dividend, so negative rows need the +2 wrap to alternate
		const staggerOffsetX = ((row % 2) + 2) % 2 === 1 ? cellSize * stagger : 0;

		for (let col = bounds.colStart; col < bounds.colEnd; col += 1) {
			const cell = buildCell({ cellSize, col, macroField, options, row, staggerOffsetX });

			cells.push(...wrapCell(cell, options));
		}
	}

	return cells;
}

// Macro lighting is a slow gradient across the whole canvas, so it can't wrap a seamless unit
function applyMacroLighting(
	color: RgbColor,
	macroField: MacroField | undefined,
	options: ResolvedOptions,
	centerX: number,
	centerY: number,
): RgbColor {
	if (!macroField) return color;

	const macroValue = sampleMacroField(
		macroField,
		centerX / Math.max(1, options.width),
		centerY / Math.max(1, options.height),
	);

	return shiftLightness(color, (macroValue - 0.5) * MACRO.lightnessRange * options.macroLighting);
}

// Every draw pulls from one seeded stream, so the property order below is load-bearing
function buildCell({
	cellSize,
	col,
	macroField,
	options,
	row,
	staggerOffsetX,
}: {
	cellSize: number;
	col: number;
	macroField: MacroField | undefined;
	options: ResolvedOptions;
	row: number;
	staggerOffsetX: number;
}): Cell {
	const { groutWidth, jitter, rootSeed, tileSize } = options;
	const rng = mulberry32(cellSeed(rootSeed, col, row));

	const baseMix = lerp(options.colorA, options.colorB, rng());
	const hueShift = signed(rng) * JITTER.hueDegrees * jitter;
	const saturationShift = signed(rng) * JITTER.saturation * jitter;
	const lightnessShift = signed(rng) * JITTER.lightness * jitter;
	const jittered = jitterHsl(baseMix, hueShift, saturationShift, lightnessShift);

	const cellOriginX = col * cellSize + staggerOffsetX;
	const cellOriginY = row * cellSize;

	return {
		baseColor: applyMacroLighting(
			jittered,
			macroField,
			options,
			cellOriginX + cellSize / 2,
			cellOriginY + cellSize / 2,
		),
		glossClumpVariant: rng() < GLOSS.variantSplit ? 0 : 1,
		glossIntensity: GLOSS.intensityMin + rng() * GLOSS.intensityRange,
		size: tileSize,
		tiltX: signed(rng) * TILT.spread,
		tiltY: signed(rng) * TILT.spread,
		x: cellOriginX + groutWidth / 2 + signed(rng) * groutWidth * JITTER.drift,
		y: cellOriginY + groutWidth / 2 + signed(rng) * groutWidth * JITTER.drift,
	};
}

function buildMacroField(rootSeed: number): MacroField {
	const samples: Array<number> = [];
	for (let y = 0; y <= MACRO.rows; y += 1) {
		for (let x = 0; x <= MACRO.cols; x += 1) {
			const seed = (rootSeed ^ Math.imul(x + 1, 374_761_393) ^ Math.imul(y + 1, 668_265_263)) >>> 0;
			samples.push(mulberry32(seed)());
		}
	}
	return { samples };
}

function getGridBounds(options: ResolvedOptions, cellSize: number): GridBounds {
	const { height, seamless, width } = options;

	// Non-seamless over-provisions a ring so partial tiles bleed off the edges
	if (!seamless) {
		return {
			colEnd: Math.ceil(width / cellSize) + 1,
			colStart: -1,
			rowEnd: Math.ceil(height / cellSize) + 1,
			rowStart: -1,
		};
	}

	return {
		colEnd: Math.round(width / cellSize),
		colStart: 0,
		rowEnd: Math.round(height / cellSize),
		rowStart: 0,
	};
}

function sampleMacroField(field: MacroField, normalizedX: number, normalizedY: number): number {
	const gridX = normalizedX * MACRO.cols;
	const gridY = normalizedY * MACRO.rows;
	const xLow = Math.floor(gridX);
	const yLow = Math.floor(gridY);
	const xHigh = Math.min(xLow + 1, MACRO.cols);
	const yHigh = Math.min(yLow + 1, MACRO.rows);
	const fractionX = gridX - xLow;
	const fractionY = gridY - yLow;
	const stride = MACRO.cols + 1;
	const topLeft = field.samples[yLow * stride + xLow] ?? 0;
	const topRight = field.samples[yLow * stride + xHigh] ?? 0;
	const bottomLeft = field.samples[yHigh * stride + xLow] ?? 0;
	const bottomRight = field.samples[yHigh * stride + xHigh] ?? 0;
	const top = topLeft + (topRight - topLeft) * fractionX;
	const bottom = bottomLeft + (bottomRight - bottomLeft) * fractionX;
	return top + (bottom - top) * fractionY;
}

// Staggered rows overhang the right edge; re-emit them on the left so the unit wraps
function wrapCell(cell: Cell, options: ResolvedOptions): Array<Cell> {
	if (!options.seamless) return [cell];

	const wrapped: Array<Cell> = [];

	for (const offsetX of wrapOffsets(cell.x, cell.size, options.width)) {
		for (const offsetY of wrapOffsets(cell.y, cell.size, options.height)) {
			wrapped.push({ ...cell, x: cell.x + offsetX, y: cell.y + offsetY });
		}
	}

	return wrapped;
}

function wrapOffsets(start: number, size: number, extent: number): Array<number> {
	const offsets = [0];
	if (start < 0) offsets.push(extent);
	if (start + size > extent) offsets.push(-extent);
	return offsets;
}
