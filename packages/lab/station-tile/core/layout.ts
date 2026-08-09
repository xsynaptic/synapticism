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

interface MacroField {
	samples: Array<number>;
}

export function layoutTiles(options: ResolvedOptions): Array<Cell> {
	const { groutWidth, height, rootSeed, seamless, stagger, tileSize, width } = options;
	const cellSize = tileSize + groutWidth;

	// Non-seamless over-provisions a ring so partial tiles bleed off the edges
	const colStart = seamless ? 0 : -1;
	const rowStart = seamless ? 0 : -1;
	const colEnd = seamless ? Math.round(width / cellSize) : Math.ceil(width / cellSize) + 1;
	const rowEnd = seamless ? Math.round(height / cellSize) : Math.ceil(height / cellSize) + 1;

	const macroField = seamless ? undefined : buildMacroField(rootSeed);
	const cells: Array<Cell> = [];

	for (let row = rowStart; row < rowEnd; row += 1) {
		const staggerOffsetX = ((row % 2) + 2) % 2 === 1 ? cellSize * stagger : 0;
		for (let col = colStart; col < colEnd; col += 1) {
			const rng = mulberry32(cellSeed(rootSeed, col, row));

			const baseMix = lerp(options.colorA, options.colorB, rng());

			const hueShift = signed(rng) * JITTER.hueDegrees * options.jitter;
			const saturationShift = signed(rng) * JITTER.saturation * options.jitter;
			const lightnessShift = signed(rng) * JITTER.lightness * options.jitter;
			const jittered = jitterHsl(baseMix, hueShift, saturationShift, lightnessShift);

			const cellOriginX = col * cellSize + staggerOffsetX;
			const cellOriginY = row * cellSize;

			let baseColor = jittered;
			if (macroField) {
				const macroValue = sampleMacroField(
					macroField,
					(cellOriginX + cellSize / 2) / Math.max(1, width),
					(cellOriginY + cellSize / 2) / Math.max(1, height),
				);
				const macroDelta = (macroValue - 0.5) * MACRO.lightnessRange * options.macroLighting;
				baseColor = shiftLightness(jittered, macroDelta);
			}

			const cell: Cell = {
				baseColor,
				glossClumpVariant: rng() < GLOSS.variantSplit ? 0 : 1,
				glossIntensity: GLOSS.intensityMin + rng() * GLOSS.intensityRange,
				size: tileSize,
				tiltX: signed(rng) * TILT.spread,
				tiltY: signed(rng) * TILT.spread,
				x: cellOriginX + groutWidth / 2 + signed(rng) * groutWidth * JITTER.drift,
				y: cellOriginY + groutWidth / 2 + signed(rng) * groutWidth * JITTER.drift,
			};

			// Staggered rows overhang the right edge; re-emit them on the left so the unit wraps
			const offsetsX = seamless ? wrapOffsets(cell.x, cell.size, width) : [0];
			const offsetsY = seamless ? wrapOffsets(cell.y, cell.size, height) : [0];
			for (const offsetX of offsetsX) {
				for (const offsetY of offsetsY) {
					cells.push({ ...cell, x: cell.x + offsetX, y: cell.y + offsetY });
				}
			}
		}
	}

	return cells;
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

function wrapOffsets(start: number, size: number, extent: number): Array<number> {
	const offsets = [0];
	if (start < 0) offsets.push(extent);
	if (start + size > extent) offsets.push(-extent);
	return offsets;
}
