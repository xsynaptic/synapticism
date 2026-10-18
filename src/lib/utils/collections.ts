import type { CollectionEntry, CollectionKey } from 'astro:content';

import { getCollection } from 'astro:content';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import pMemoize, { pMemoizeClear } from 'p-memoize';

interface CollectionEntryWithEntryCount {
	data: {
		_entryCount: number;
	};
}

interface CollectionResult<E extends { id: string }> {
	entries: Array<E>;
	entriesMap: Map<string, E>;
}

type CollectionComputeFunction<K extends CollectionKey, C extends object> = (
	entries: Array<CollectionEntry<K>>,
) => ((entry: CollectionEntry<K>) => C) | Promise<(entry: CollectionEntry<K>) => C>;

type ComputedCollectionEntry<K extends CollectionKey, C extends object> = Omit<
	CollectionEntry<K>,
	'data'
> & {
	data: C & Omit<CollectionEntry<K>['data'], keyof C>;
};

export function createCollectionData<K extends CollectionKey, C extends object>(config: {
	collection: K;
	compute: CollectionComputeFunction<K, C>;
	label?: string;
}): () => Promise<CollectionResult<ComputedCollectionEntry<K, C>>>;
export function createCollectionData<K extends CollectionKey>(config: {
	collection: K;
	label?: string;
}): () => Promise<CollectionResult<CollectionEntry<K>>>;
export function createCollectionData<K extends CollectionKey, C extends object>(config: {
	collection: K;
	compute?: CollectionComputeFunction<K, C>;
	label?: string;
}): () => Promise<CollectionResult<CollectionEntry<K> | ComputedCollectionEntry<K, C>>> {
	const getData = pMemoize(async () => {
		const startTime = performance.now();

		const rawEntries = await getCollection(config.collection);

		const entries = config.compute ? await computeEntries(rawEntries, config.compute) : rawEntries;

		const entriesMap = new Map(entries.map((entry) => [entry.id, entry]));

		console.log(
			`[${config.label ?? config.collection}] Collection data generated in ${(performance.now() - startTime).toFixed(4)}ms`,
		);

		return { entries, entriesMap };
	});

	// Astro's data-store can load empty in dev; memoizing that strands it for the whole session
	return async function () {
		const result = await getData();

		if (import.meta.env.DEV && result.entries.length === 0) {
			pMemoizeClear(getData);
		}

		return result;
	};
}

async function computeEntries<K extends CollectionKey, C extends object>(
	entries: Array<CollectionEntry<K>>,
	compute: CollectionComputeFunction<K, C>,
) {
	const computeEntry = await compute(entries);

	return entries.map((entry) => ({
		...entry,
		data: { ...entry.data, ...computeEntry(entry) },
	}));
}

const rawCollectionPromises = new Map<
	CollectionKey,
	Promise<Array<CollectionEntry<CollectionKey>>>
>();

export function createCollectionLookupByIds<E extends { id: string }>(
	label: string,
	getData: () => Promise<CollectionResult<E>>,
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
				.filter((entry): entry is E => !!entry);
		};
	};
}

export function filterHasEntries(entry: CollectionEntryWithEntryCount) {
	return entry.data._entryCount > 0;
}

// Subfolders organize content only; the id collapses to the filename so URLs stay flat
export function generateFlatId({ entry }: { entry: string }) {
	return path.basename(entry, path.extname(entry));
}

// Raw read for cross-collection assembly; bypasses the computed wrappers to avoid circular init
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
	return entryB.data._entryCount - entryA.data._entryCount;
}
