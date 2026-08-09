import type { Cell } from './layout.ts';
import type { ResolvedOptions, TileInput } from './options.ts';

import { BEVEL, GEOMETRY, GLOSS, GRAIN, TILT } from './appearance.ts';
import { layoutTiles } from './layout.ts';
import { resolveOptions } from './options.ts';
import { formatSvgNumber, toHex } from './utils.ts';

export interface GeneratedTile {
	height: number;
	svg: string;
	width: number;
}

export function generateTileSvg(input: TileInput): GeneratedTile {
	const options = resolveOptions(input);
	const cells = layoutTiles(options);
	const { gloss, glossBlend, grain, grainGrout, grout, height, rootSeed, seamless, width } =
		options;

	const turbulenceSeed = rootSeed & 0xff;
	const showGloss = gloss > 0;
	const showTileGrain = grain > 0;
	const showGroutGrain = grainGrout > 0;

	const defs =
		`<clipPath id="tile-clip"><rect width="${formatSvgNumber(width)}" height="${formatSvgNumber(height)}"/></clipPath>` +
		(showTileGrain ? buildTileGrainFilter(options, turbulenceSeed) : '') +
		(showGloss
			? buildGlossFilter(options, turbulenceSeed, 0) + buildGlossFilter(options, turbulenceSeed, 1)
			: '') +
		(showGroutGrain ? buildGroutGrainFilter(options, turbulenceSeed) : '');

	const tileBodyParts: Array<string> = [];
	const glossAlphaParts: Array<Array<string>> = [[], []];
	const cornerRadius = Math.max(1, options.tileSize * GEOMETRY.cornerRadiusRatio);

	for (const cell of cells) {
		const tiltTransform = buildTiltTransform(cell);
		const rect =
			`<rect x="${formatSvgNumber(cell.x)}" y="${formatSvgNumber(cell.y)}"` +
			` width="${formatSvgNumber(cell.size)}" height="${formatSvgNumber(cell.size)}"` +
			` rx="${formatSvgNumber(cornerRadius)}" ry="${formatSvgNumber(cornerRadius)}"`;

		tileBodyParts.push(
			`<g${tiltTransform}>` +
				`${rect} fill="${toHex(cell.baseColor)}"/>` +
				renderBevel(cell, cornerRadius, options.bevel) +
				`</g>`,
		);

		if (showGloss && cell.glossIntensity > 0) {
			glossAlphaParts[cell.glossClumpVariant]!.push(
				`${rect} fill="#fff" fill-opacity="${formatSvgNumber(cell.glossIntensity)}"${tiltTransform}/>`,
			);
		}
	}

	const groutGrainOverlay = showGroutGrain
		? `<rect width="${formatSvgNumber(width)}" height="${formatSvgNumber(height)}" filter="url(#grout-grain)" style="mix-blend-mode:multiply"/>`
		: '';
	const glossBlendStyle = glossBlend === 'normal' ? '' : ` style="mix-blend-mode:${glossBlend}"`;
	const glossGroups = showGloss
		? `<g filter="url(#tile-gloss-0)"${glossBlendStyle}>${glossAlphaParts[0]!.join('')}</g>` +
			`<g filter="url(#tile-gloss-1)"${glossBlendStyle}>${glossAlphaParts[1]!.join('')}</g>`
		: '';

	// Seamless needs intrinsic px so the data URI tiles at 1:1; inline fills its box and crops
	const sizing = seamless
		? ` width="${formatSvgNumber(width)}" height="${formatSvgNumber(height)}"`
		: ` width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="display:block"`;

	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${formatSvgNumber(width)} ${formatSvgNumber(height)}"${sizing}>` +
		`<defs>${defs}</defs>` +
		`<g clip-path="url(#tile-clip)">` +
		`<rect width="${formatSvgNumber(width)}" height="${formatSvgNumber(height)}" fill="${grout}"/>` +
		groutGrainOverlay +
		(showTileGrain ? `<g filter="url(#tile-grain)">` : '<g>') +
		tileBodyParts.join('') +
		`</g>` +
		glossGroups +
		`</g>` +
		`</svg>`;

	return { height, svg, width };
}

// Shared by the Astro component and the custom element so both paint seamless mode identically
export function tileBackgroundStyle(tile: GeneratedTile): Record<string, string> {
	return {
		backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(tile.svg)}")`,
		backgroundRepeat: 'repeat',
		backgroundSize: `${formatSvgNumber(tile.width)}px ${formatSvgNumber(tile.height)}px`,
	};
}

// RGB is a constant tint; alpha varies with gamma-curved noise
// Composited "in" SourceGraphic so each tile scales by its glossIntensity
// Two variants at different baseFrequencies vary clump scale between neighbours
function buildGlossFilter(
	options: ResolvedOptions,
	turbulenceSeed: number,
	variant: 0 | 1,
): string {
	const { gloss, glossColor, height, tileSize, width } = options;
	const glossSeed = (turbulenceSeed + (variant === 0 ? 0 : 113)) & 0xff;
	const variantFrequency = variant === 0 ? 1 : GLOSS.variantFrequency;
	// Keeps clump width at ~25% of a tile across all sizes
	const clumpFrequency = (GLOSS.clumpScale / Math.max(4, tileSize)) * variantFrequency;

	const tint = [glossColor.r, glossColor.g, glossColor.b]
		.map((channel) => formatSvgNumber(channel / 255))
		.join('   0 0 0 0 ');

	return (
		`<filter id="tile-gloss-${String(variant)}"${filterRegion(width, height)}>` +
		`<feTurbulence type="fractalNoise" baseFrequency="${formatSvgNumber(clumpFrequency)}" numOctaves="3"` +
		` seed="${String(glossSeed)}" stitchTiles="stitch" result="glossNoise"/>` +
		`<feComponentTransfer in="glossNoise" result="glossCurved">` +
		`<feFuncR type="gamma" amplitude="1" exponent="${String(GLOSS.gamma)}" offset="0"/>` +
		`<feFuncG type="gamma" amplitude="1" exponent="${String(GLOSS.gamma)}" offset="0"/>` +
		`<feFuncB type="gamma" amplitude="1" exponent="${String(GLOSS.gamma)}" offset="0"/>` +
		`</feComponentTransfer>` +
		`<feColorMatrix in="glossCurved" type="matrix"` +
		` values="0 0 0 0 ${tint}   ${formatSvgNumber(gloss * GLOSS.peakAlpha)} 0 0 0 0"` +
		` result="glossTinted"/>` +
		`<feComposite in="glossTinted" in2="SourceGraphic" operator="in"/>` +
		`</filter>`
	);
}

// Multiply blend so grout only darkens, never lightens (no saturation shift on colored tiles)
function buildGroutGrainFilter(options: ResolvedOptions, turbulenceSeed: number): string {
	const { grainGrout, height, width } = options;
	const lift = formatSvgNumber(GRAIN.groutLift);

	return (
		`<filter id="grout-grain"${filterRegion(width, height)}>` +
		`<feTurbulence type="fractalNoise" baseFrequency="${formatSvgNumber(GRAIN.groutFrequency)}" numOctaves="2"` +
		` seed="${String((turbulenceSeed + 17) & 0xff)}" stitchTiles="stitch" result="noise"/>` +
		`<feColorMatrix in="noise" type="matrix"` +
		` values="1 0 0 0 ${lift}  1 0 0 0 ${lift}  1 0 0 0 ${lift}  0 0 0 0 ${formatSvgNumber(grainGrout)}"/>` +
		`</filter>`
	);
}

// Masked by SourceGraphic so it stays on tiles, off the grout gaps
function buildTileGrainFilter(options: ResolvedOptions, turbulenceSeed: number): string {
	const { grain, height, width } = options;

	return (
		`<filter id="tile-grain"${filterRegion(width, height)}>` +
		`<feTurbulence type="fractalNoise" baseFrequency="${formatSvgNumber(GRAIN.tileFrequency)}" numOctaves="2"` +
		` seed="${String((turbulenceSeed + 41) & 0xff)}" stitchTiles="stitch" result="grainNoise"/>` +
		`<feColorMatrix in="grainNoise" type="matrix"` +
		` values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 ${formatSvgNumber(grain)} 0" result="grainGray"/>` +
		`<feComposite in="grainGray" in2="SourceGraphic" operator="in" result="grainMasked"/>` +
		`<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="grainMasked"/></feMerge>` +
		`</filter>`
	);
}

function buildTiltTransform(cell: Cell): string {
	const degrees = (cell.tiltX - cell.tiltY) * TILT.degrees;
	if (Math.abs(degrees) <= 0.01) return '';
	const centerX = cell.x + cell.size / 2;
	const centerY = cell.y + cell.size / 2;
	return ` transform="rotate(${formatSvgNumber(degrees)} ${formatSvgNumber(centerX)} ${formatSvgNumber(centerY)})"`;
}

// Anchor noise to the viewBox; gloss variants hold different tile subsets
// Bbox-relative regions would each stitch on their own period
function filterRegion(width: number, height: number): string {
	return (
		` filterUnits="userSpaceOnUse" x="0" y="0"` +
		` width="${formatSvgNumber(width)}" height="${formatSvgNumber(height)}"`
	);
}

// Light stroke along the top-left edge (imagined upper-left light)
// Dark stroke along the bottom-right edge (shadow)
// Polarity reads the tile as raised above the grout, not recessed
function renderBevel(cell: Cell, radius: number, strength: number): string {
	if (strength <= 0) return '';
	const inset = Math.max(0.5, cell.size * BEVEL.insetRatio);
	const innerX = cell.x + inset;
	const innerY = cell.y + inset;
	const span = cell.size - inset * 2;
	const innerRadius = Math.max(0, radius - inset * BEVEL.radiusFalloff);
	const stroke = ` stroke-width="${formatSvgNumber(inset)}" stroke-linecap="round"`;

	const topLeftEdge =
		`<path fill="none" stroke="#fff" stroke-opacity="${formatSvgNumber(BEVEL.lightAlpha * strength)}"${stroke}` +
		` d="M${formatSvgNumber(innerX)} ${formatSvgNumber(innerY + span - innerRadius)}` +
		` L${formatSvgNumber(innerX)} ${formatSvgNumber(innerY + innerRadius)}` +
		` Q${formatSvgNumber(innerX)} ${formatSvgNumber(innerY)} ${formatSvgNumber(innerX + innerRadius)} ${formatSvgNumber(innerY)}` +
		` L${formatSvgNumber(innerX + span - innerRadius)} ${formatSvgNumber(innerY)}"/>`;

	const bottomRightEdge =
		`<path fill="none" stroke="#000" stroke-opacity="${formatSvgNumber(BEVEL.darkAlpha * strength)}"${stroke}` +
		` d="M${formatSvgNumber(innerX + innerRadius)} ${formatSvgNumber(innerY + span)}` +
		` L${formatSvgNumber(innerX + span - innerRadius)} ${formatSvgNumber(innerY + span)}` +
		` Q${formatSvgNumber(innerX + span)} ${formatSvgNumber(innerY + span)} ${formatSvgNumber(innerX + span)} ${formatSvgNumber(innerY + span - innerRadius)}` +
		` L${formatSvgNumber(innerX + span)} ${formatSvgNumber(innerY + innerRadius)}"/>`;

	return topLeftEdge + bottomRightEdge;
}
