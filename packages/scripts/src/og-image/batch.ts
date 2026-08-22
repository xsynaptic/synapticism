import type { OgImageEntry } from './content.js';

export interface ImageBatch {
	entries: Array<OgImageEntry>;
	imageId?: string;
}

// One decode serves every entry sharing a source image, so no raw RGBA outlives its batch
export function batchEntriesBySourceImage(entries: Array<OgImageEntry>): Array<ImageBatch> {
	const batches = new Map<string, ImageBatch>();

	for (const entry of entries) {
		const batchKey = entry.imageId ?? '';
		const batch = batches.get(batchKey);

		if (batch) {
			batch.entries.push(entry);
			continue;
		}

		batches.set(batchKey, {
			entries: [entry],
			...(entry.imageId ? { imageId: entry.imageId } : {}),
		});
	}

	return [...batches.values()];
}
