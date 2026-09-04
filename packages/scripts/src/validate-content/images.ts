import type { ContentEntry } from '../shared/astro-content.js';
import type { ValidationResult } from './validation-result.js';

import {
	collectMediaFiles,
	extractImageFeaturedIds,
	extractMdxImageIds,
} from '../shared/images.js';
import { toValidationResult } from './validation-result.js';

export function validateImages(entries: Array<ContentEntry>, mediaPath: string): ValidationResult {
	const mediaFiles = collectMediaFiles(mediaPath);

	if (mediaFiles.size === 0) {
		return { issues: [], status: 'warn', summary: `No image files found in ${mediaPath}` };
	}

	const issues = entries.flatMap((entry) =>
		collectMissingImageIds(entry, mediaFiles).map((imageId) => ({
			message: `${entry.filePath ?? entry.id}: missing image "${imageId}"`,
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
