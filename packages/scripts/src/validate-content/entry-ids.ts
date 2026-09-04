import type { ContentEntry } from '../shared/astro-content.js';

import { toValidationResult } from './validation-result.js';

// IDs form one flat namespace, so a collision silently shadows one Entry with another
export function validateEntryIds(entries: Array<ContentEntry>) {
	const locationsById = new Map<string, Array<string>>();

	for (const entry of entries) {
		const locations = locationsById.get(entry.id) ?? [];

		locations.push(entry.filePath ?? entry.id);
		locationsById.set(entry.id, locations);
	}

	const issues = [...locationsById]
		.filter(([, locations]) => locations.length > 1)
		.map(([id, locations]) => ({ details: locations, message: `duplicate entry ID "${id}"` }));

	return toValidationResult(issues, {
		fail: `Found ${String(issues.length)} duplicate entry ID(s)`,
		pass: `${String(entries.length)} entry IDs unique`,
	});
}
