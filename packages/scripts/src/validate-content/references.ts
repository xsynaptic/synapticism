import type { ContentEntry } from '../shared/astro-content.js';

import { toValidationResult } from './validation-result.js';

interface EntryReference {
	collection: string;
	field: string;
	id: string;
}

interface ReferenceIssue extends EntryReference {
	location: string;
}

// Astro checks references itself but only logs, leaving a broken reference to ship
export function collectReferenceIssues(entries: Array<ContentEntry>) {
	const idsByCollection = getIdsByCollection(entries);

	return entries.flatMap((entry) => getEntryReferenceIssues(entry, idsByCollection));
}

export function validateReferences(entries: Array<ContentEntry>) {
	const issues = collectReferenceIssues(entries);

	return toValidationResult(
		issues.map(({ collection, field, id, location }) => ({
			message: `${location}: ${field} references "${id}", missing from "${collection}"`,
		})),
		{
			fail: `Found ${String(issues.length)} broken reference(s)`,
			pass: 'Entry references valid',
		},
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

// Every reference() here targets a collection this check covers, so an unknown collection is itself a fault
function getEntryReferenceIssues(
	entry: ContentEntry,
	idsByCollection: ReadonlyMap<string, Set<string>>,
): Array<ReferenceIssue> {
	const references: Array<EntryReference> = [];

	collectEntryReferences(entry.data, '', references);

	const location = entry.filePath ?? entry.id;

	return references
		.filter(({ collection, id }) => !idsByCollection.get(collection)?.has(id))
		.map((reference) => ({ ...reference, location }));
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
