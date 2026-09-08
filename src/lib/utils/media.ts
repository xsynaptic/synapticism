import type { ImageMetadata } from 'astro';

import { mediaDir } from '@synapticism/shared/constants';
import { readFileSync } from 'node:fs';
import path from 'node:path';

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

// The LQIP script regenerates this gitignored cache before each build
// Read once via fs so a missing file (fresh checkout) degrades to no placeholder
function loadLqipMap(): Record<string, { lqip: string }> {
	try {
		const cachePath = path.resolve(process.cwd(), '.cache/media-lqip.json');
		return JSON.parse(readFileSync(cachePath, 'utf8')) as Record<string, { lqip: string }>;
	} catch {
		return {};
	}
}

const lqipMap = loadLqipMap();

export function getMediaLqip(mediaPath: string): string | undefined {
	return lqipMap[mediaPath]?.lqip;
}
