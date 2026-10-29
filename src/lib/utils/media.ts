import type { ImageMetadata } from 'astro';

import { mediaDir } from '@synapticism/shared/constants';

// Astro can only optimize images it discovers statically, so the glob below must stay a literal
export const mediaRoot = `/${mediaDir}`;

const mediaImages = import.meta.glob<{ default: ImageMetadata }>(
	'/packages/content/media/**/*.{avif,jpeg,jpg,png,webp}',
	{ eager: true },
);

export function getMediaImage(mediaPath: string): ImageMetadata {
	const key = `${mediaRoot}/${mediaPath}`;
	const image = mediaImages[key];
	if (!image) {
		throw new Error(`Media image not found: "${mediaPath}" (expected a file at ${key})`);
	}
	return image.default;
}

export function hasMediaImage(mediaPath: string): boolean {
	return Object.hasOwn(mediaImages, `${mediaRoot}/${mediaPath}`);
}
