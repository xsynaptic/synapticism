import type { ContentEntry } from '../shared/astro-content.js';
import type { ValidationIssue } from './validation-result.js';

import { findComponentTags, getTagProp } from './component-tags.js';
import { toValidationResult } from './validation-result.js';

const requiredProps = { Img: 'src', Link: 'id', Quotation: 'author' } as const;

const componentNames = Object.keys(requiredProps);

export function validateMdxComponents(entries: Array<ContentEntry>, rootPath: string) {
	const issues: Array<ValidationIssue> = [];

	let errorCount = 0;

	for (const entry of entries) {
		const details = collectMissingProps(entry, rootPath);

		if (details.length === 0) continue;

		issues.push({ details, message: entry.filePath ?? entry.id });
		errorCount += details.length;
	}

	return toValidationResult(issues, {
		fail: `Found ${String(errorCount)} invalid component(s)`,
		pass: 'MDX components valid',
	});
}

function collectMissingProps(entry: ContentEntry, rootPath: string) {
	const details: Array<string> = [];

	for (const tag of findComponentTags(entry, componentNames, rootPath)) {
		const prop = requiredProps[tag.name as keyof typeof requiredProps];

		if (getTagProp(tag, prop)) continue;

		details.push(`Line ${String(tag.lineNumber)}: <${tag.name}> missing ${prop} prop`);
	}

	return details;
}
