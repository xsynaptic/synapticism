import type { Font } from 'satori';

import { createOgRenderer, encodeDataUrl, resizeCover } from '@xsynaptic/og-image-generator';

import type { OgImageEntry } from './content.js';

import { OG_HEIGHT, OG_JPEG_QUALITY, OG_PANEL_WIDTH, OG_WIDTH } from './constants.js';
import { getOgElement } from './element.js';

// Build the renderer once and reuse it: font parsing and Yoga init are expensive.
export function createGenerator(fonts: Array<Font>) {
	const render = createOgRenderer({
		fonts,
		format: 'jpeg',
		height: OG_HEIGHT,
		quality: OG_JPEG_QUALITY,
		width: OG_WIDTH,
	});

	// Source imagery is reused across entries, and imageFeatured often equals imageHero
	const imageCache = new Map<string, string>();

	return async function generate(entry: OgImageEntry): Promise<Buffer> {
		let imageDataUrl: string | undefined;

		if (entry.imagePath) {
			imageDataUrl = imageCache.get(entry.imagePath);

			if (!imageDataUrl) {
				imageDataUrl = await processImage(entry.imagePath);
				imageCache.set(entry.imagePath, imageDataUrl);
			}
		}

		return render(getOgElement(entry, imageDataUrl));
	};
}

// The panel is a tall crop of a wide source, so let sharp pick the region of interest
async function processImage(imagePath: string): Promise<string> {
	const buffer = await resizeCover(imagePath, {
		height: OG_HEIGHT,
		position: 'attention',
		width: OG_PANEL_WIDTH,
	}).toBuffer();

	return encodeDataUrl(buffer, 'jpeg');
}
