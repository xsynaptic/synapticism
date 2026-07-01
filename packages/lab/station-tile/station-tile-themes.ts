export interface TileThemeColors {
	colorA: string;
	colorB: string;
}

// Named tile color schemes
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
