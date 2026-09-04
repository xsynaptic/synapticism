import type { ContentEntry } from '../shared/astro-content.js';
import type { ValidationIssue } from './validation-result.js';

import { findComponentTags, getTagProp } from './component-tags.js';
import { toValidationResult } from './validation-result.js';

// The catalog is flat across every collection, so any Entry is a valid target
export function validateLinkIds(entries: Array<ContentEntry>, rootPath: string) {
	const validIds = new Set(entries.map((entry) => entry.id));
	const issues: Array<ValidationIssue> = [];

	let brokenCount = 0;

	for (const entry of entries) {
		const details = collectBrokenLinkIds(entry, validIds, rootPath);

		if (details.length === 0) continue;

		issues.push({ details, message: entry.filePath ?? entry.id });
		brokenCount += details.length;
	}

	return toValidationResult(issues, {
		fail: `Found ${String(brokenCount)} broken link ID(s)`,
		pass: 'Link IDs valid',
	});
}

function collectBrokenLinkIds(
	entry: ContentEntry,
	validIds: ReadonlySet<string>,
	rootPath: string,
) {
	const details: Array<string> = [];

	const tags = findComponentTags(entry, ['Link'], rootPath);

	for (const tag of tags) {
		const id = getTagProp(tag, 'id');

		// A missing id is the mdx check's finding, not this one's
		if (!id || validIds.has(id)) continue;

		details.push(`Line ${String(tag.lineNumber)}: broken link ID "${id}"`);
	}

	return details;
}
