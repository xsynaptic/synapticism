import type { Cell } from './layout.ts';
import type { ResolvedOptions, TileInput } from './options.ts';

import { BEVEL, GEOMETRY, GLOSS, GRAIN, TILT } from './appearance.ts';
import { layoutTiles } from './layout.ts';
import { resolveOptions } from './options.ts';
import { formatSvgCoord, formatSvgNumber, toHex } from './utils.ts';

export interface GeneratedTile {
	height: number;
	seamless: boolean;
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

	// Every cell shares one geometry, so body (#t) and gloss (#g) are defined once and instanced
	// Per-cell colour rides in on `fill`/`fill-opacity`, which inherit through <use>
	// Defs are centred on their own origin so each instance transform is just translate + rotate
	const cornerRadius = Math.max(1, options.tileSize * GEOMETRY.cornerRadiusRatio);
	const halfTile = options.tileSize / 2;
	const cellGeometry =
		` x="${formatSvgNumber(-halfTile)}" y="${formatSvgNumber(-halfTile)}"` +
		` width="${formatSvgNumber(options.tileSize)}" height="${formatSvgNumber(options.tileSize)}"` +
		` rx="${formatSvgNumber(cornerRadius)}" ry="${formatSvgNumber(cornerRadius)}"`;

	const defs =
		`<clipPath id="tile-clip"><rect width="${formatSvgNumber(width)}" height="${formatSvgNumber(height)}"/></clipPath>` +
		`<g id="t"><rect${cellGeometry}/>${renderBevel(options.tileSize, cornerRadius, options.bevel)}</g>` +
		(showGloss ? `<rect id="g"${cellGeometry} fill="#fff"/>` : '') +
		(showTileGrain ? buildTileGrainFilter(options, turbulenceSeed) : '') +
		(showGloss
			? buildGlossFilter(options, turbulenceSeed, 0) + buildGlossFilter(options, turbulenceSeed, 1)
			: '') +
		(showGroutGrain ? buildGroutGrainFilter(options, turbulenceSeed) : '');

	const tileBodyParts: Array<string> = [];
	const glossAlphaParts: Array<Array<string>> = [[], []];

	for (const cell of cells) {
		const transform = buildCellTransform(cell, halfTile);

		tileBodyParts.push(`<use href="#t" fill="${toHex(cell.baseColor)}"${transform}/>`);

		if (showGloss && cell.glossIntensity > 0) {
			glossAlphaParts[cell.glossClumpVariant]!.push(
				`<use href="#g" fill-opacity="${formatSvgNumber(cell.glossIntensity)}"${transform}/>`,
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

	// The SVG is only ever painted as a background image, which needs a natural size to scale against
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${formatSvgNumber(width)} ${formatSvgNumber(height)}"` +
		` width="${formatSvgNumber(width)}" height="${formatSvgNumber(height)}">` +
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

	return { height, seamless, svg, width };
}

// Shared by the Astro component and the custom element so both paint identically
// Seamless repeats its unit at 1:1; otherwise `cover` + centring stands in for the
// `xMidYMid slice` the SVG used to carry itself
// Both modes set the same keys so reassigning the style never leaves a stale one behind
export function tileBackgroundStyle(tile: GeneratedTile): Record<string, string> {
	const image = `url("data:image/svg+xml;utf8,${encodeURIComponent(tile.svg)}")`;

	if (tile.seamless) {
		return {
			backgroundImage: image,
			backgroundPosition: '0 0',
			backgroundRepeat: 'repeat',
			backgroundSize: `${formatSvgNumber(tile.width)}px ${formatSvgNumber(tile.height)}px`,
		};
	}

	return {
		backgroundImage: image,
		backgroundPosition: 'center',
		backgroundRepeat: 'no-repeat',
		backgroundSize: 'cover',
	};
}

// Translate lives in the transform, not in <use x y>: the spec composes those as
// `transform ∘ translate(x,y)`, so the rotation would resolve in the wrong space
function buildCellTransform(cell: Cell, halfTile: number): string {
	const position = `translate(${formatSvgCoord(cell.x + halfTile)},${formatSvgCoord(cell.y + halfTile)})`;
	const degrees = Math.round((cell.tiltX - cell.tiltY) * TILT.degrees * 10) / 10;
	if (degrees === 0) return ` transform="${position}"`;
	return ` transform="${position}rotate(${formatSvgCoord(degrees)})"`;
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
function renderBevel(size: number, radius: number, strength: number): string {
	if (strength <= 0) return '';
	const inset = Math.max(0.5, size * BEVEL.insetRatio);
	const near = inset - size / 2;
	const far = size / 2 - inset;
	const innerRadius = Math.max(0, radius - inset * BEVEL.radiusFalloff);
	const stroke = ` stroke-width="${formatSvgNumber(inset)}" stroke-linecap="round"`;

	const topLeftEdge =
		`<path fill="none" stroke="#fff" stroke-opacity="${formatSvgNumber(BEVEL.lightAlpha * strength)}"${stroke}` +
		` d="M${formatSvgNumber(near)} ${formatSvgNumber(far - innerRadius)}` +
		` L${formatSvgNumber(near)} ${formatSvgNumber(near + innerRadius)}` +
		` Q${formatSvgNumber(near)} ${formatSvgNumber(near)} ${formatSvgNumber(near + innerRadius)} ${formatSvgNumber(near)}` +
		` L${formatSvgNumber(far - innerRadius)} ${formatSvgNumber(near)}"/>`;

	const bottomRightEdge =
		`<path fill="none" stroke="#000" stroke-opacity="${formatSvgNumber(BEVEL.darkAlpha * strength)}"${stroke}` +
		` d="M${formatSvgNumber(near + innerRadius)} ${formatSvgNumber(far)}` +
		` L${formatSvgNumber(far - innerRadius)} ${formatSvgNumber(far)}` +
		` Q${formatSvgNumber(far)} ${formatSvgNumber(far)} ${formatSvgNumber(far)} ${formatSvgNumber(far - innerRadius)}` +
		` L${formatSvgNumber(far)} ${formatSvgNumber(near + innerRadius)}"/>`;

	return topLeftEdge + bottomRightEdge;
}
