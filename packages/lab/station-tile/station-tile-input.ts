import type { TileTheme } from './station-tile-themes.ts';
import type { TileOptions } from './station-tile-types.ts';

import { DEFAULT_TILE_THEME, TILE_THEMES } from './station-tile-themes.ts';

// Loose, all-optional input shared by every surface (Astro component, custom element)
// `theme` picks a color pair; explicit colorA/colorB override it
// Everything else falls through to the generator's own defaults
export type TileInput = Partial<TileOptions> & { theme?: TileTheme };

export const defaultTileSeed = 'station-tile';

// Scalar tile options and how each parses from a string attribute
// The single source of truth for the custom element's observed attributes
// `seamless` is a boolean, handled separately
export const tileFieldsEnum = {
	bevel: 'number',
	colorA: 'string',
	colorB: 'string',
	gloss: 'number',
	glossBlend: 'string',
	glossColor: 'string',
	grain: 'number',
	grainGrout: 'number',
	grainMode: 'string',
	grout: 'string',
	groutWidth: 'number',
	height: 'number',
	jitter: 'number',
	macroLighting: 'number',
	seed: 'string',
	stagger: 'number',
	theme: 'string',
	tileSize: 'number',
	width: 'number',
} as const satisfies Record<string, 'number' | 'string'>;

// camelCase option key to kebab-case attribute name
export function camelToKebab(value: string): string {
	return value.replaceAll(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

// Drop keys whose value is undefined, narrowing the value types accordingly
export function compact<T extends object>(input: T): { [K in keyof T]?: Exclude<T[K], undefined> } {
	const output: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(input)) {
		if (value !== undefined) output[key] = value;
	}
	return output as { [K in keyof T]?: Exclude<T[K], undefined> };
}

export function resolveTileOptions(input: TileInput): TileOptions {
	const { colorA, colorB, seed, theme, ...rest } = input;
	const themeName = theme && Object.hasOwn(TILE_THEMES, theme) ? theme : DEFAULT_TILE_THEME;
	const themeColors = TILE_THEMES[themeName];
	return {
		...rest,
		colorA: colorA ?? themeColors.colorA,
		colorB: colorB ?? themeColors.colorB,
		seed: seed ?? defaultTileSeed,
	};
}
