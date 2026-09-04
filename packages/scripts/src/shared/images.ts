import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const imageExtensionRegex = /\.(?:avif|gif|jpe?g|png|webp)$/i;

const imgTagRegex = /<Img(?:\s+([^>]*?))?\/?>/g;
const srcPropRegex = /src=["']([^"']+)["']/;

// Keyed the way frontmatter and `<Img src>` address an Image: a path relative to the media root
export function collectMediaFiles(mediaPath: string): Set<string> {
	const files = new Set<string>();

	function walk(directory: string, prefix: string) {
		for (const entry of readdirSync(directory)) {
			const fullPath = path.join(directory, entry);
			const relativePath = prefix ? `${prefix}/${entry}` : entry;

			if (statSync(fullPath).isDirectory()) {
				walk(fullPath, relativePath);
				continue;
			}

			if (imageExtensionRegex.test(entry)) files.add(relativePath);
		}
	}

	walk(mediaPath, '');

	return files;
}

export function extractImageFeaturedIds(data: Record<string, unknown>): Array<string> {
	const { imageFeatured } = data;

	if (typeof imageFeatured === 'string') return [imageFeatured];

	if (!Array.isArray(imageFeatured)) return [];

	const ids: Array<string> = [];

	const items = imageFeatured as Array<unknown>;

	for (const item of items) {
		if (typeof item === 'string') {
			ids.push(item);
			continue;
		}

		if (typeof item !== 'object' || item === null) continue;

		const { id } = item as { id?: unknown };

		if (typeof id === 'string') ids.push(id);
	}

	return ids;
}

export function extractMdxImageIds(body: string): Array<string> {
	const ids: Array<string> = [];

	for (const match of body.matchAll(imgTagRegex)) {
		const src = srcPropRegex.exec(match[1] ?? '');

		if (src?.[1]) ids.push(src[1]);
	}

	return ids;
}
