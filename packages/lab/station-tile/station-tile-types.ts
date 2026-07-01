export interface Cell {
	baseColor: RgbColor;
	col: number;
	glossClumpVariant: 0 | 1;
	glossIntensity: number;
	row: number;
	size: number;
	tiltX: number;
	tiltY: number;
	x: number;
	y: number;
}

export type GlossBlend =
	| 'color-dodge'
	| 'hard-light'
	| 'lighten'
	| 'normal'
	| 'overlay'
	| 'plus-lighter'
	| 'screen'
	| 'soft-light';

export type GrainMode = 'external' | 'inline' | 'none';

export interface RgbColor {
	b: number;
	g: number;
	r: number;
}

export interface TileOptions {
	bevel?: number;
	colorA: string;
	colorB: string;
	gloss?: number;
	glossBlend?: GlossBlend;
	glossColor?: string;
	grain?: number;
	grainGrout?: number;
	grainMode?: GrainMode;
	grout?: string;
	groutWidth?: number;
	height?: number;
	jitter?: number;
	macroLighting?: number;
	// When true: snap the viewBox to the exact integer cell grid, drop edge over-provision, so the SVG tiles seamlessly
	// Macro-lighting drift is disabled in this mode (can't wrap cleanly)
	// Default false
	seamless?: boolean;
	seed: number | string;
	// Horizontal row offset as a fraction of cell width: 0 = stack-bond (default); 0.5 = brick
	stagger?: number;
	tileSize?: number;
	width?: number;
}
