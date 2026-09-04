import type { CollectionEntry, CollectionKey } from 'astro:content';

import { getCollection } from 'astro:content';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import pMemoize, { pMemoizeClear } from 'p-memoize';

export interface CollectionResult<K extends CollectionKey> {
	entries: Array<CollectionEntry<K>>;
	entriesMap: Map<string, CollectionEntry<K>>;
}

interface CollectionEntryWithEntryCount {
	data: {
		_entryCount?: number | undefined;
	};
}

type CollectionMutateFunction<K extends CollectionKey> = (
	entries: Array<CollectionEntry<K>>,
	entriesMap: Map<string, CollectionEntry<K>>,
) => Promise<void> | void;

export function createCollectionData<K extends CollectionKey>(config: {
	collection: K;
	label?: string;
	mutate?: CollectionMutateFunction<K>;
}) {
	const getData = pMemoize(async (): Promise<CollectionResult<K>> => {
		const startTime = performance.now();

		const entries = await getCollection(config.collection);

		const entriesMap = new Map<string, CollectionEntry<K>>();

		for (const entry of entries) {
			entriesMap.set(entry.id, entry);
		}

		await config.mutate?.(entries, entriesMap);

		console.log(
			`[${config.label ?? config.collection}] Collection data generated in ${(performance.now() - startTime).toFixed(4)}ms`,
		);

		return { entries, entriesMap };
	});

	// Astro's data-store can load empty in dev; memoizing that strands it for the whole session
	return async function (): Promise<CollectionResult<K>> {
		const result = await getData();

		if (import.meta.env.DEV && result.entries.length === 0) {
			pMemoizeClear(getData);
		}

		return result;
	};
}

const rawCollectionPromises = new Map<
	CollectionKey,
	Promise<Array<CollectionEntry<CollectionKey>>>
>();

export function createCollectionLookupByIds<K extends CollectionKey>(
	label: string,
	getData: () => Promise<CollectionResult<K>>,
) {
	return async function () {
		const { entriesMap } = await getData();

		return function (ids: Array<string>) {
			return ids
				.map((id) => {
					const entry = entriesMap.get(id);

					if (!entry && import.meta.env.DEV) {
						console.warn(`[${label}] Requested entry "${id}" not found!`);
					}
					return entry;
				})
				.filter((entry): entry is CollectionEntry<K> => !!entry);
		};
	};
}

export function filterHasEntries(entry: CollectionEntryWithEntryCount) {
	return (entry.data._entryCount ?? 0) > 0;
}

// Subfolders organize content only; the id collapses to the filename so URLs stay flat
export function generateFlatId({ entry }: { entry: string }) {
	return path.basename(entry, path.extname(entry));
}

// Raw read for cross-collection assembly; bypasses the enriched wrappers to avoid circular init
// Sees pristine frontmatter only, never the computed `_` fields createCollectionData stamps
export async function getRawCollection<K extends CollectionKey>(
	collection: K,
): Promise<Array<CollectionEntry<K>>> {
	let promise = rawCollectionPromises.get(collection);

	if (!promise) {
		promise = getCollection(collection);
		rawCollectionPromises.set(collection, promise);
	}

	const entries = (await promise) as Array<CollectionEntry<K>>;

	if (import.meta.env.DEV && entries.length === 0) {
		rawCollectionPromises.delete(collection);
	}

	return entries;
}

export function sortByEntryCount<T extends CollectionEntryWithEntryCount>(entryA: T, entryB: T) {
	const aTotal = entryA.data._entryCount ?? 0;
	const bTotal = entryB.data._entryCount ?? 0;

	return bTotal - aTotal;
}
