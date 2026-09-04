import type { ContentEntry } from '../shared/astro-content.js';
import type { ValidationIssue } from './validation-result.js';

import { toValidationResult } from './validation-result.js';

interface EntryReference {
	collection: string;
	field: string;
	id: string;
}

// Astro checks references itself but only logs, leaving a broken reference to ship
export function validateReferences(entries: Array<ContentEntry>) {
	const idsByCollection = getIdsByCollection(entries);
	const issues: Array<ValidationIssue> = [];

	for (const entry of entries) {
		for (const message of collectBrokenReferences(entry, idsByCollection)) {
			issues.push({ message });
		}
	}

	return toValidationResult(issues, {
		fail: `Found ${String(issues.length)} broken reference(s)`,
		pass: 'Entry references valid',
	});
}

function collectBrokenReferences(
	entry: ContentEntry,
	idsByCollection: ReadonlyMap<string, Set<string>>,
) {
	const references: Array<EntryReference> = [];

	collectEntryReferences(entry.data, '', references);

	const location = entry.filePath ?? entry.id;

	return references
		.filter(({ collection, id }) => !idsByCollection.get(collection)?.has(id))
		.map(
			({ collection, field, id }) =>
				`${location}: ${field} references "${id}", missing from "${collection}"`,
		);
}

// Walking for the `{id, collection}` shape avoids a hand-maintained list of reference fields
function collectEntryReferences(value: unknown, field: string, references: Array<EntryReference>) {
	if (value === null || typeof value !== 'object') return;

	if (Array.isArray(value)) {
		const items = value as Array<unknown>;

		for (const [index, item] of items.entries()) {
			collectEntryReferences(item, `${field}[${String(index)}]`, references);
		}
		return;
	}

	const record = value as Record<string, unknown>;
	const reference = toEntryReference(record, field);

	if (reference) {
		references.push(reference);
		return;
	}

	for (const [key, item] of Object.entries(record)) {
		collectEntryReferences(item, field ? `${field}.${key}` : key, references);
	}
}

function getIdsByCollection(entries: Array<ContentEntry>) {
	const idsByCollection = new Map<string, Set<string>>();

	for (const entry of entries) {
		const ids = idsByCollection.get(entry.collection) ?? new Set<string>();

		ids.add(entry.id);
		idsByCollection.set(entry.collection, ids);
	}

	return idsByCollection;
}

function toEntryReference(
	record: Record<string, unknown>,
	field: string,
): EntryReference | undefined {
	if (typeof record.collection !== 'string' || typeof record.id !== 'string') return undefined;

	return { collection: record.collection, field, id: record.id };
}
