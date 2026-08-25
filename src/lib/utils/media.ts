import type { ImageMetadata } from 'astro';

import { readFileSync } from 'node:fs';
import path from 'node:path';

// Frontmatter stores media as paths relative to packages/content/media (e.g. 2026/05/x.jpg)
// Astro can only optimize images it discovers statically, so the glob must be a literal
const mediaRoot = '/packages/content/media';

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
