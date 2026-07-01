import type { Cell, GlossBlend, RgbColor, TileOptions } from './station-tile-types.ts';

import {
	cellSeed,
	hashSeed,
	jitterHsl,
	lerp,
	mulberry32,
	parseHex,
	shiftLightness,
	signed,
} from './station-tile-math.ts';

const MACRO_GRID_COLS = 4;
const MACRO_GRID_ROWS = 3;

export interface ResolvedOptions {
	bevel: number;
	colorA: RgbColor;
	colorB: RgbColor;
	gloss: number;
	glossBlend: GlossBlend;
	glossColor: RgbColor;
	grain: number;
	grainGrout: number;
	grout: string;
	groutWidth: number;
	height: number;
	jitter: number;
	macroLighting: number;
	rootSeed: number;
	seamless: boolean;
	stagger: number;
	tileSize: number;
	width: number;
}

interface MacroField {
	samples: Array<number>;
}

export function layoutTiles(options: ResolvedOptions): Array<Cell> {
	const { groutWidth, height, rootSeed, seamless, stagger, tileSize, width } = options;
	const cellSize = tileSize + groutWidth;

	// Seamless: exact integer grid
	// Non-seamless: over-provision by 2 on each axis so partial tiles bleed off the edges
	const colStart = seamless ? 0 : -1;
	const rowStart = seamless ? 0 : -1;
	const colEnd = seamless ? Math.floor(width / cellSize) : Math.ceil(width / cellSize) + 1;
	const rowEnd = seamless ? Math.floor(height / cellSize) : Math.ceil(height / cellSize) + 1;

	const macroField = seamless ? undefined : buildMacroField(rootSeed);
	const cells: Array<Cell> = [];

	for (let row = rowStart; row < rowEnd; row += 1) {
		const staggerOffsetX = ((row % 2) + 2) % 2 === 1 ? cellSize * stagger : 0;
		for (let col = colStart; col < colEnd; col += 1) {
			const rng = mulberry32(cellSeed(rootSeed, col, row));

			const colorMixT = rng();
			const baseMix = lerp(options.colorA, options.colorB, colorMixT);

			const hueShift = signed(rng) * 2 * options.jitter;
			const saturationShift = signed(rng) * 0.08 * options.jitter;
			const lightnessShift = signed(rng) * 0.05 * options.jitter;
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
				const macroDelta = (macroValue - 0.5) * 0.12 * options.macroLighting;
				baseColor = shiftLightness(jittered, macroDelta);
			}

			const tiltX = signed(rng) * 0.5;
			const tiltY = signed(rng) * 0.5;

			const glossIntensity = 0.3 + rng() * 0.7;
			const glossClumpVariant: 0 | 1 = rng() < 0.6 ? 0 : 1;

			const rowDrift = signed(rng) * groutWidth * 0.15;
			const columnDrift = signed(rng) * groutWidth * 0.15;

			cells.push({
				baseColor,
				col,
				glossClumpVariant,
				glossIntensity,
				row,
				size: tileSize,
				tiltX,
				tiltY,
				x: cellOriginX + groutWidth / 2 + rowDrift,
				y: cellOriginY + groutWidth / 2 + columnDrift,
			});
		}
	}

	return cells;
}

export function resolveOptions(input: TileOptions): ResolvedOptions {
	const tileSize = input.tileSize ?? 48;
	const groutWidth = input.groutWidth ?? Math.max(1, tileSize * 0.08);
	const seamless = input.seamless ?? false;
	let width = input.width ?? 768;
	let height = input.height ?? 512;
	// Snap viewBox to exact integer cell grid so the pattern tiles seamlessly.
	if (seamless) {
		const cellSize = tileSize + groutWidth;
		const cols = Math.max(1, Math.floor(width / cellSize));
		const rows = Math.max(1, Math.floor(height / cellSize));
		width = cols * cellSize;
		height = rows * cellSize;
	}
	return {
		bevel: input.bevel ?? 0.3,
		colorA: parseHex(input.colorA),
		colorB: parseHex(input.colorB),
		gloss: input.gloss ?? 0.2,
		glossBlend: input.glossBlend ?? 'screen',
		glossColor: parseHex(input.glossColor ?? '#ffffff'),
		grain: input.grain ?? 0.05,
		grainGrout: input.grainGrout ?? 0.5,
		grout: input.grout ?? '#8a8a85',
		groutWidth,
		height,
		jitter: input.jitter ?? 0.8,
		macroLighting: input.macroLighting ?? 0.3,
		rootSeed: hashSeed(input.seed),
		seamless,
		stagger: input.stagger ?? 0,
		tileSize,
		width,
	};
}

/** Precompute a coarse field of normalized values, sampled bilinearly per tile. */
function buildMacroField(rootSeed: number): MacroField {
	const samples: Array<number> = [];
	for (let y = 0; y <= MACRO_GRID_ROWS; y += 1) {
		for (let x = 0; x <= MACRO_GRID_COLS; x += 1) {
			const seed = (rootSeed ^ Math.imul(x + 1, 374_761_393) ^ Math.imul(y + 1, 668_265_263)) >>> 0;
			samples.push(mulberry32(seed)());
		}
	}
	return { samples };
}

function sampleMacroField(field: MacroField, normalizedX: number, normalizedY: number): number {
	const gridX = normalizedX * MACRO_GRID_COLS;
	const gridY = normalizedY * MACRO_GRID_ROWS;
	const xLow = Math.floor(gridX);
	const yLow = Math.floor(gridY);
	const xHigh = Math.min(xLow + 1, MACRO_GRID_COLS);
	const yHigh = Math.min(yLow + 1, MACRO_GRID_ROWS);
	const fractionX = gridX - xLow;
	const fractionY = gridY - yLow;
	const stride = MACRO_GRID_COLS + 1;
	const topLeft = field.samples[yLow * stride + xLow] ?? 0;
	const topRight = field.samples[yLow * stride + xHigh] ?? 0;
	const bottomLeft = field.samples[yHigh * stride + xLow] ?? 0;
	const bottomRight = field.samples[yHigh * stride + xHigh] ?? 0;
	const top = topLeft + (topRight - topLeft) * fractionX;
	const bottom = bottomLeft + (bottomRight - bottomLeft) * fractionX;
	return top + (bottom - top) * fractionY;
}
