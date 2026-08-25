import type { Font } from 'takumi-js';

import sharp from 'sharp';
import { render, setGlyphCacheMaxBytes } from 'takumi-js';
import { Renderer } from 'takumi-js/node';

import type { OgImageEntry } from './content.js';

import { ogHeight, ogJpegQuality, ogPanelWidth, ogWidth } from './constants.js';
import { getOgElement } from './element.js';

// The 8 MiB default evicts outlines mid-run once a corpus draws more than about a thousand glyphs
const glyphCacheBytes = 64 * 1024 * 1024;

export interface ProcessedImage {
	data: Buffer;
	height: number;
	width: number;
}

// Fonts and glyph outlines live on the renderer, so build one and reuse it for every card
export function createRenderer(fonts: Array<Font>) {
	// Read when a cache is first used, so this has to run before the first render
	setGlyphCacheMaxBytes(glyphCacheBytes);

	const renderer = new Renderer();

	return function renderCard(entry: OgImageEntry, image?: ProcessedImage) {
		return render(getOgElement(entry, image), {
			fonts,
			format: 'jpeg',
			height: ogHeight,
			quality: ogJpegQuality,
			renderer,
			width: ogWidth,
		});
	};
}

// The panel is a tall crop of a wide source, so let sharp pick the region of interest
// Raw RGBA hands off to Takumi without an encode, so the card takes one lossy pass instead of two
export async function processImage(imagePath: string): Promise<ProcessedImage> {
	const { data, info } = await sharp(imagePath)
		.resize({ fit: 'cover', height: ogHeight, position: 'attention', width: ogPanelWidth })
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });

	return { data, height: info.height, width: info.width };
}
