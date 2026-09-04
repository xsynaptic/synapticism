import type { OpenGraphContentEntry } from './types.js';

export interface ImageBatch {
	entries: Array<OpenGraphContentEntry>;
	imageId?: string;
}

// One decode serves every entry sharing a source image, so no raw RGBA outlives its batch
export function batchEntriesBySourceImage(
	entries: Array<OpenGraphContentEntry>,
): Array<ImageBatch> {
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
