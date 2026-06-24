import type { Font } from 'satori';

import { createOgRenderer } from '@xsynaptic/og-image-generator';

import { OG_HEIGHT, OG_JPEG_QUALITY, OG_WIDTH } from './constants.js';
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

	return function generate(title: string): Promise<Buffer> {
		return render(getOgElement(title));
	};
}
