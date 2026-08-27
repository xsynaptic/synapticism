import type { GlossBlend, TileTheme } from './appearance.ts';
import type { RgbColor } from './utils.ts';

import { DEFAULT_TILE_THEME, GEOMETRY, TILE_DEFAULTS, TILE_THEMES } from './appearance.ts';
import { hashSeed, parseHex } from './utils.ts';

export interface ResolvedOptions extends ResolvedColors, ResolvedGeometry, ResolvedGloss {
	bevel: number;
	grain: number;
	grainGrout: number;
	grout: string;
	jitter: number;
	macroLighting: number;
	rootSeed: number;
}

// `theme` picks a color pair; explicit colorA/colorB override it
// Optionals admit explicit `undefined`; Astro props destructure to it
export interface TileInput {
	bevel?: number | undefined;
	colorA?: string | undefined;
	colorB?: string | undefined;
	gloss?: number | undefined;
	glossBlend?: GlossBlend | undefined;
	glossColor?: string | undefined;
	grain?: number | undefined;
	grainGrout?: number | undefined;
	grout?: string | undefined;
	groutWidth?: number | undefined;
	jitter?: number | undefined;
	macroLighting?: number | undefined;
	// Repeat unit sized by `unitCells`; disables macro lighting, which can't wrap
	seamless?: boolean | undefined;
	seed?: number | string | undefined;
	// Horizontal row offset as a fraction of cell width: 0 = stack-bond; 0.5 = brick
	stagger?: number | undefined;
	theme?: TileTheme | undefined;
	tileSize?: number | undefined;
	// Seamless only: cells per axis in the repeat unit
	unitCells?: number | undefined;
}

interface ResolvedColors {
	colorA: RgbColor;
	colorB: RgbColor;
}

interface ResolvedGeometry {
	groutWidth: number;
	height: number;
	seamless: boolean;
	stagger: number;
	tileSize: number;
	width: number;
}

interface ResolvedGloss {
	gloss: number;
	glossBlend: GlossBlend;
	glossColor: RgbColor;
}

export function resolveOptions(input: TileInput): ResolvedOptions {
	return {
		...resolveColors(input),
		...resolveGeometry(input),
		...resolveGloss(input),
		bevel: input.bevel ?? TILE_DEFAULTS.bevel,
		grain: input.grain ?? TILE_DEFAULTS.grain,
		grainGrout: input.grainGrout ?? TILE_DEFAULTS.grainGrout,
		grout: input.grout ?? TILE_DEFAULTS.grout,
		jitter: input.jitter ?? TILE_DEFAULTS.jitter,
		macroLighting: input.macroLighting ?? TILE_DEFAULTS.macroLighting,
		rootSeed: hashSeed(input.seed ?? TILE_DEFAULTS.seed),
	};
}

function resolveCellSize(input: TileInput, seamless: boolean) {
	// Integer cells keep the repeat on whole device pixels; fractional ones resample into a seam
	const rawTileSize = input.tileSize ?? TILE_DEFAULTS.tileSize;
	const tileSize = seamless ? Math.round(rawTileSize) : rawTileSize;
	const rawGroutWidth = input.groutWidth ?? Math.max(1, tileSize * GEOMETRY.groutRatio);

	return {
		groutWidth: seamless ? Math.max(1, Math.round(rawGroutWidth)) : rawGroutWidth,
		tileSize,
	};
}

function resolveColors(input: TileInput): ResolvedColors {
	const themeName =
		input.theme && Object.hasOwn(TILE_THEMES, input.theme) ? input.theme : DEFAULT_TILE_THEME;
	const themeColors = TILE_THEMES[themeName];

	return {
		colorA: parseHex(input.colorA ?? themeColors.colorA),
		colorB: parseHex(input.colorB ?? themeColors.colorB),
	};
}

function resolveGeometry(input: TileInput): ResolvedGeometry {
	const seamless = input.seamless ?? false;
	const stagger = input.stagger ?? TILE_DEFAULTS.stagger;
	const { groutWidth, tileSize } = resolveCellSize(input, seamless);
	const canvas = seamless
		? resolveRepeatUnit(input, tileSize + groutWidth, stagger)
		: { height: GEOMETRY.canvasHeight, width: GEOMETRY.canvasWidth };

	return { groutWidth, seamless, stagger, tileSize, ...canvas };
}

function resolveGloss(input: TileInput): ResolvedGloss {
	return {
		gloss: input.gloss ?? TILE_DEFAULTS.gloss,
		glossBlend: input.glossBlend ?? TILE_DEFAULTS.glossBlend,
		glossColor: parseHex(input.glossColor ?? TILE_DEFAULTS.glossColor),
	};
}

function resolveRepeatUnit(input: TileInput, cellSize: number, stagger: number) {
	const cols = Math.max(2, Math.round(input.unitCells ?? TILE_DEFAULTS.unitCells));
	// Staggered bonds alternate per row, so the vertical period needs an even row count
	const rows = stagger > 0 ? cols + (cols % 2) : cols;

	return { height: rows * cellSize, width: cols * cellSize };
}
