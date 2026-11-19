import type { ContentEntry, ValidationResult } from '@xsynaptic/astro-scripts';

import { listImageSources } from '@xsynaptic/astro-image-pipeline/node';
import { toValidationResult } from '@xsynaptic/astro-scripts';

import { extractImageFeaturedIds, extractMdxImageIds } from '#shared/images.ts';

export async function validateImages(
	entries: Array<ContentEntry>,
	mediaPath: string,
): Promise<ValidationResult> {
	const mediaFiles = await listImageSources(mediaPath);

	if (mediaFiles.size === 0) {
		return { issues: [], status: 'warn', summary: `No image files found in ${mediaPath}` };
	}

	const issues = entries.flatMap((entry) =>
		collectMissingImageIds(entry, mediaFiles).map((imageId) => ({
			location: entry.filePath ?? entry.id,
			message: `missing image "${imageId}"`,
		})),
	);

	return toValidationResult(issues, {
		fail: `Found ${String(issues.length)} missing image reference(s)`,
		pass: `Image references valid against ${String(mediaFiles.size)} media file(s)`,
	});
}

function collectMissingImageIds(entry: ContentEntry, mediaFiles: ReadonlySet<string>) {
	const imageIds = new Set([
		...extractImageFeaturedIds(entry.data),
		...(entry.body ? extractMdxImageIds(entry.body) : []),
	]);

	return [...imageIds.difference(mediaFiles)];
}
