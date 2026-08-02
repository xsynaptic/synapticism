import type { RgbColor } from './station-tile-types.ts';

import { formatSvgNumber } from './station-tile-math.ts';

interface GlossFilterInput {
	gloss: number;
	glossColor: RgbColor;
	tileSize: number;
	turbulenceSeed: number;
	variant: 0 | 1;
}

interface GroutGrainFilterInput {
	grainGrout: number;
	turbulenceSeed: number;
}

interface TileGrainFilterInput {
	grain: number;
	turbulenceSeed: number;
}

// Clumpy gloss over a group of white per-tile alpha rects
// RGB is a constant tint; alpha varies with gamma-curved noise
// Composited "in" SourceGraphic so each tile scales by its glossIntensity
// Two variants at different baseFrequencies vary clump scale between neighbours
export function buildGlossFilter(input: GlossFilterInput): string {
	const { gloss, glossColor, tileSize, turbulenceSeed, variant } = input;
	const glossSeed = (turbulenceSeed + (variant === 0 ? 0 : 113)) & 0xff;
	const peakAlpha = gloss * 0.7;
	const variantFrequencyMultiplier = variant === 0 ? 1 : 0.65;
	// baseFrequency = 4 / tileSize keeps clump width at ~25% of a tile across all sizes
	const clumpBaseFrequency = (4 / Math.max(4, tileSize)) * variantFrequencyMultiplier;

	const glossRed = formatSvgNumber(glossColor.r / 255);
	const glossGreen = formatSvgNumber(glossColor.g / 255);
	const glossBlue = formatSvgNumber(glossColor.b / 255);
	const peakAlphaText = formatSvgNumber(peakAlpha);

	return (
		`<filter id="tile-gloss-${String(variant)}" x="0" y="0" width="100%" height="100%">` +
		`<feTurbulence type="fractalNoise" baseFrequency="${formatSvgNumber(clumpBaseFrequency)}" numOctaves="3"` +
		` seed="${String(glossSeed)}" stitchTiles="stitch" result="glossNoise"/>` +
		`<feComponentTransfer in="glossNoise" result="glossCurved">` +
		`<feFuncR type="gamma" amplitude="1" exponent="3" offset="0"/>` +
		`<feFuncG type="gamma" amplitude="1" exponent="3" offset="0"/>` +
		`<feFuncB type="gamma" amplitude="1" exponent="3" offset="0"/>` +
		`</feComponentTransfer>` +
		`<feColorMatrix in="glossCurved" type="matrix"` +
		` values="0 0 0 0 ${glossRed}   0 0 0 0 ${glossGreen}   0 0 0 0 ${glossBlue}   ${peakAlphaText} 0 0 0 0"` +
		` result="glossTinted"/>` +
		`<feComposite in="glossTinted" in2="SourceGraphic" operator="in"/>` +
		`</filter>`
	);
}

// Coarse grain between the grout fill and the tile bodies
// Multiply blend so grout only darkens, never lightens (no saturation shift on colored tiles)
export function buildGroutGrainFilter(input: GroutGrainFilterInput): string {
	const { grainGrout, turbulenceSeed } = input;
	const grainSeed = (turbulenceSeed + 17) & 0xff;

	return (
		`<filter id="grout-grain" x="0" y="0" width="100%" height="100%">` +
		`<feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2"` +
		` seed="${String(grainSeed)}" stitchTiles="stitch" result="noise"/>` +
		`<feColorMatrix in="noise" type="matrix"` +
		` values="1 0 0 0 0.35  1 0 0 0 0.35  1 0 0 0 0.35  0 0 0 0 ${formatSvgNumber(grainGrout)}"/>` +
		`</filter>`
	);
}

// Fine grain on tile bodies
// Masked by SourceGraphic so it stays on tiles, off the grout gaps
export function buildTileGrainFilter(input: TileGrainFilterInput): string {
	const { grain, turbulenceSeed } = input;
	const grainSeed = (turbulenceSeed + 41) & 0xff;

	return (
		`<filter id="tile-grain" x="0" y="0" width="100%" height="100%">` +
		`<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2"` +
		` seed="${String(grainSeed)}" stitchTiles="stitch" result="grainNoise"/>` +
		`<feColorMatrix in="grainNoise" type="matrix"` +
		` values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 ${formatSvgNumber(grain)} 0" result="grainGray"/>` +
		`<feComposite in="grainGray" in2="SourceGraphic" operator="in" result="grainMasked"/>` +
		`<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="grainMasked"/></feMerge>` +
		`</filter>`
	);
}

// Ceramic bevel for one tile
// Light stroke along the top-left edge (imagined upper-left light)
// Dark stroke along the bottom-right edge (shadow)
// Polarity reads the tile as raised above the grout, not recessed
export function renderBevel(
	x: number,
	y: number,
	size: number,
	radius: number,
	strength: number,
): string {
	if (strength <= 0) return '';
	const inset = Math.max(0.5, size * 0.04);
	const lightAlpha = 0.32 * strength;
	const darkAlpha = 0.26 * strength;
	const innerX = x + inset;
	const innerY = y + inset;
	const innerWidth = size - inset * 2;
	const innerHeight = size - inset * 2;
	const innerRadius = Math.max(0, radius - inset * 0.6);

	const topLeftEdge =
		`<path fill="none" stroke="#fff" stroke-opacity="${formatSvgNumber(lightAlpha)}" stroke-width="${formatSvgNumber(inset)}"` +
		` stroke-linecap="round" d="M${formatSvgNumber(innerX)} ${formatSvgNumber(innerY + innerHeight - innerRadius)}` +
		` L${formatSvgNumber(innerX)} ${formatSvgNumber(innerY + innerRadius)} Q${formatSvgNumber(innerX)} ${formatSvgNumber(innerY)} ${formatSvgNumber(innerX + innerRadius)} ${formatSvgNumber(innerY)}` +
		` L${formatSvgNumber(innerX + innerWidth - innerRadius)} ${formatSvgNumber(innerY)}"/>`;

	const bottomRightEdge =
		`<path fill="none" stroke="#000" stroke-opacity="${formatSvgNumber(darkAlpha)}" stroke-width="${formatSvgNumber(inset)}"` +
		` stroke-linecap="round" d="M${formatSvgNumber(innerX + innerRadius)} ${formatSvgNumber(innerY + innerHeight)}` +
		` L${formatSvgNumber(innerX + innerWidth - innerRadius)} ${formatSvgNumber(innerY + innerHeight)} Q${formatSvgNumber(innerX + innerWidth)} ${formatSvgNumber(innerY + innerHeight)} ${formatSvgNumber(innerX + innerWidth)} ${formatSvgNumber(innerY + innerHeight - innerRadius)}` +
		` L${formatSvgNumber(innerX + innerWidth)} ${formatSvgNumber(innerY + innerRadius)}"/>`;

	return topLeftEdge + bottomRightEdge;
}
