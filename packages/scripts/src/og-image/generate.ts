import type { OpenGraphCardInput } from '@synapticism/shared/open-graph';

import { mediaDir, openGraphImageHeight, openGraphImageWidth } from '@synapticism/shared/constants';
import { openImageSource } from '@xsynaptic/astro-image-pipeline/node';
import { findWorkspaceRoot } from '@xsynaptic/astro-scripts';
import path from 'node:path';
import { render, setGlyphCacheMaxBytes } from 'takumi-js';
import { Renderer } from 'takumi-js/node';

import { openGraphBandHeight, openGraphJpegQuality } from '#og-image/constants.ts';
import { getOpenGraphElement } from '#og-image/element.tsx';
import { loadOpenGraphFonts } from '#og-image/fonts.ts';

// The 8 MiB default evicts outlines mid-run once a corpus draws more than about a thousand glyphs
const glyphCacheBytes = 64 * 1024 * 1024;

export interface ProcessedImage {
	data: Buffer;
	height: number;
	width: number;
}

// Fonts and glyph outlines live on the renderer, so build one and reuse it for every card
export async function createCardRenderer() {
	// Read when a cache is first used, so this has to run before the first render
	setGlyphCacheMaxBytes(glyphCacheBytes);

	const fonts = await loadOpenGraphFonts();
	const renderer = new Renderer();

	return async function renderCard(card: OpenGraphCardInput, image?: ProcessedImage) {
		return render(getOpenGraphElement(card, image), {
			fonts,
			format: 'jpeg',
			height: openGraphImageHeight,
			quality: openGraphJpegQuality,
			renderer,
			width: openGraphImageWidth,
		});
	};
}

export function resolveMediaPath(imageId: string): string {
	return path.join(findWorkspaceRoot(), mediaDir, imageId);
}

// The band is a short strip of a wide source, so let sharp pick the region of interest
// Raw RGBA hands off to Takumi without an encode, so the card takes one lossy pass instead of two
export async function decodeImage(filePath: string): Promise<ProcessedImage> {
	const { data, info } = await openImageSource(filePath)
		.resize({
			fit: 'cover',
			height: openGraphBandHeight,
			position: 'attention',
			width: openGraphImageWidth,
		})
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });

	return { data, height: info.height, width: info.width };
}
