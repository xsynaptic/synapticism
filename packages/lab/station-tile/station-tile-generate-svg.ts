import type { TileOptions } from './station-tile-types.ts';

import { layoutTiles, resolveOptions } from './station-tile-layout.ts';
import { formatSvgNumber, toHex } from './station-tile-math.ts';
import {
	buildGlossFilter,
	buildGroutGrainFilter,
	buildTileGrainFilter,
	renderBevel,
} from './station-tile-svg.ts';

export interface GeneratedTile {
	height: number;
	svg: string;
	width: number;
}

export function generateTileSvg(input: TileOptions): GeneratedTile {
	const options = resolveOptions(input);
	const cells = layoutTiles(options);

	const {
		bevel,
		gloss,
		glossBlend,
		glossColor,
		grain,
		grainGrout,
		grout,
		height,
		rootSeed,
		tileSize,
		width,
	} = options;
	const cornerRadius = Math.max(1, tileSize * 0.04);
	const grainMode = input.grainMode ?? 'inline';
	const inlineGrain = grainMode === 'inline';
	const turbulenceSeed = rootSeed & 0xff;

	const showGloss = inlineGrain && gloss > 0;
	const showTileGrain = inlineGrain && grain > 0;
	const showGroutGrain = inlineGrain && grainGrout > 0;

	const clipDef = `<clipPath id="tile-clip"><rect width="${formatSvgNumber(width)}" height="${formatSvgNumber(height)}"/></clipPath>`;
	const tileGrainDef = showTileGrain ? buildTileGrainFilter({ grain, turbulenceSeed }) : '';
	const glossFilterDefs = showGloss
		? buildGlossFilter({ gloss, glossColor, tileSize, turbulenceSeed, variant: 0 }) +
			buildGlossFilter({ gloss, glossColor, tileSize, turbulenceSeed, variant: 1 })
		: '';
	const groutGrainDef = showGroutGrain ? buildGroutGrainFilter({ grainGrout, turbulenceSeed }) : '';
	const defs = clipDef + tileGrainDef + glossFilterDefs + groutGrainDef;

	const tileBodyParts: Array<string> = [];
	const glossAlphaParts: Array<Array<string>> = [[], []];

	for (const cell of cells) {
		const fill = toHex(cell.baseColor);
		const centerX = cell.x + cell.size / 2;
		const centerY = cell.y + cell.size / 2;
		const tiltDegrees = (cell.tiltX - cell.tiltY) * 0.6;
		const tiltTransform =
			Math.abs(tiltDegrees) > 0.01
				? ` transform="rotate(${formatSvgNumber(tiltDegrees)} ${formatSvgNumber(centerX)} ${formatSvgNumber(centerY)})"`
				: '';

		tileBodyParts.push(
			`<g${tiltTransform}>` +
				`<rect x="${formatSvgNumber(cell.x)}" y="${formatSvgNumber(cell.y)}" width="${formatSvgNumber(cell.size)}" height="${formatSvgNumber(cell.size)}"` +
				` rx="${formatSvgNumber(cornerRadius)}" ry="${formatSvgNumber(cornerRadius)}" fill="${fill}"/>` +
				renderBevel(cell.x, cell.y, cell.size, cornerRadius, bevel) +
				`</g>`,
		);

		if (showGloss && cell.glossIntensity > 0) {
			glossAlphaParts[cell.glossClumpVariant]!.push(
				`<rect x="${formatSvgNumber(cell.x)}" y="${formatSvgNumber(cell.y)}" width="${formatSvgNumber(cell.size)}" height="${formatSvgNumber(cell.size)}"` +
					` rx="${formatSvgNumber(cornerRadius)}" ry="${formatSvgNumber(cornerRadius)}"` +
					` fill="#fff" fill-opacity="${formatSvgNumber(cell.glossIntensity)}"${tiltTransform}/>`,
			);
		}
	}

	const groutGrainOverlay = showGroutGrain
		? `<rect width="${formatSvgNumber(width)}" height="${formatSvgNumber(height)}" filter="url(#grout-grain)" style="mix-blend-mode:multiply"/>`
		: '';
	const tileBodyGroupOpen = showTileGrain ? `<g filter="url(#tile-grain)">` : '<g>';
	const glossBlendStyle = glossBlend === 'normal' ? '' : ` style="mix-blend-mode:${glossBlend}"`;
	const glossGroups = showGloss
		? `<g filter="url(#tile-gloss-0)"${glossBlendStyle}>${glossAlphaParts[0]!.join('')}</g>` +
			`<g filter="url(#tile-gloss-1)"${glossBlendStyle}>${glossAlphaParts[1]!.join('')}</g>`
		: '';

	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${formatSvgNumber(width)} ${formatSvgNumber(height)}"` +
		` width="${formatSvgNumber(width)}" height="${formatSvgNumber(height)}" preserveAspectRatio="xMidYMid slice">` +
		`<defs>${defs}</defs>` +
		`<g clip-path="url(#tile-clip)">` +
		`<rect width="${formatSvgNumber(width)}" height="${formatSvgNumber(height)}" fill="${grout}"/>` +
		groutGrainOverlay +
		tileBodyGroupOpen +
		tileBodyParts.join('') +
		`</g>` +
		glossGroups +
		`</g>` +
		`</svg>`;

	return { height, svg, width };
}
