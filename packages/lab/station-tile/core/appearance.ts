export interface TileThemeColors {
	colorA: string;
	colorB: string;
}

// colorA is the darker endpoint, colorB the lighter
export const TILE_THEMES = {
	blue: { colorA: '#245ca9', colorB: '#2d89e3' },
	brown: { colorA: '#855b49', colorB: '#a07056' },
	green: { colorA: '#2a7f5f', colorB: '#3fa07a' },
	grey: { colorA: '#5a5d61', colorB: '#74787d' },
	magenta: { colorA: '#87214c', colorB: '#c2306b' },
	navy: { colorA: '#1d3f7f', colorB: '#2a5099' },
	orange: { colorA: '#b3520a', colorB: '#d87607' },
	pink: { colorA: '#d56b8c', colorB: '#e389a4' },
	purple: { colorA: '#5b3a8c', colorB: '#7d499d' },
	red: { colorA: '#a02a32', colorB: '#c44a52' },
	sand: { colorA: '#d6d1c6', colorB: '#e8e3da' },
	teal: { colorA: '#1f6f6a', colorB: '#2f9089' },
	violet: { colorA: '#4a376e', colorB: '#6b4fa0' },
	yellow: { colorA: '#d4a542', colorB: '#e6bc5a' },
} as const satisfies Record<string, TileThemeColors>;

export type TileTheme = keyof typeof TILE_THEMES;

export const DEFAULT_TILE_THEME = 'grey' satisfies TileTheme;

export const GLOSS_BLENDS = [
	'color-dodge',
	'hard-light',
	'lighten',
	'normal',
	'overlay',
	'plus-lighter',
	'screen',
	'soft-light',
] as const;

export type GlossBlend = (typeof GLOSS_BLENDS)[number];

export const TILE_DEFAULTS = {
	bevel: 0.3,
	gloss: 0.2,
	glossBlend: 'screen',
	glossColor: '#ffffff',
	grain: 0.05,
	grainGrout: 0.5,
	grout: '#8a8a85',
	jitter: 0.8,
	macroLighting: 0.3,
	seed: 'station-tile',
	stagger: 0,
	tileSize: 48,
	unitCells: 12,
} as const satisfies Record<string, number | string>;

export const GEOMETRY = {
	// Non-seamless viewBox; slice-fit by whatever paints it, so it sets cell density, not size
	canvasHeight: 512,
	canvasWidth: 768,
	cornerRadiusRatio: 0.04,
	groutRatio: 0.08,
} as const;

export const JITTER = {
	drift: 0.15,
	hueDegrees: 2,
	lightness: 0.05,
	saturation: 0.08,
} as const;

export const TILT = {
	degrees: 0.6,
	spread: 0.5,
} as const;

export const GLOSS = {
	clumpScale: 4,
	gamma: 3,
	intensityMin: 0.3,
	intensityRange: 0.7,
	peakAlpha: 0.7,
	variantFrequency: 0.65,
	variantSplit: 0.6,
} as const;

export const GRAIN = {
	groutFrequency: 1.6,
	groutLift: 0.35,
	tileFrequency: 1.1,
} as const;

export const BEVEL = {
	darkAlpha: 0.26,
	insetRatio: 0.04,
	lightAlpha: 0.32,
	radiusFalloff: 0.6,
} as const;

export const MACRO = {
	cols: 4,
	lightnessRange: 0.12,
	rows: 3,
} as const;
