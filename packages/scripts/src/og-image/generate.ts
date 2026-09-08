import { mediaDir, openGraphImageHeight, openGraphImageWidth } from '@synapticism/shared/constants';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { render, setGlyphCacheMaxBytes } from 'takumi-js';
import { Renderer } from 'takumi-js/node';

import { findWorkspaceRoot } from '#shared/utils.js';

import type { OpenGraphEntryItem } from './types.js';

import { openGraphJpegQuality, openGraphPanelWidth } from './constants.js';
import { getOpenGraphElement } from './element.js';
import { loadOpenGraphFonts } from './fonts.js';

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

	return async function renderCard(entry: OpenGraphEntryItem) {
		return render(getOpenGraphElement(entry, await loadImage(entry.imageId)), {
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

// Originals are gitignored and may be absent; a card without its art still beats no card
async function loadImage(imageId: string | undefined): Promise<ProcessedImage | undefined> {
	if (imageId === undefined) return undefined;

	const imagePath = resolveMediaPath(imageId);

	if (!existsSync(imagePath)) return undefined;

	// The panel is a tall crop of a wide source, so let sharp pick the region of interest
	// Raw RGBA hands off to Takumi without an encode, so the card takes one lossy pass instead of two
	const { data, info } = await sharp(imagePath)
		.resize({
			fit: 'cover',
			height: openGraphImageHeight,
			position: 'attention',
			width: openGraphPanelWidth,
		})
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });

	return { data, height: info.height, width: info.width };
}
