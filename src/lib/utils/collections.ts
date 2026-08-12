import type { CollectionEntry, CollectionKey } from 'astro:content';

import { getCollection } from 'astro:content';
import { performance } from 'node:perf_hooks';
import pMemoize from 'p-memoize';

export interface CollectionResult<K extends CollectionKey> {
	entries: Array<CollectionEntry<K>>;
	entriesMap: Map<string, CollectionEntry<K>>;
}

interface CollectionEntryWithContentCount {
	data: {
		_entryCount?: number | undefined;
	};
}

export function createCollectionData<K extends CollectionKey>(config: {
	augment?: (
		entries: Array<CollectionEntry<K>>,
		entriesMap: Map<string, CollectionEntry<K>>,
	) => Promise<void> | void;
	collection: K;
	label?: string;
}) {
	return pMemoize(async (): Promise<CollectionResult<K>> => {
		const startTime = performance.now();

		const entries = await getCollection(config.collection);

		const entriesMap = new Map<string, CollectionEntry<K>>();

		for (const entry of entries) {
			entriesMap.set(entry.id, entry);
		}

		if (config.augment) {
			await config.augment(entries, entriesMap);
		}

		console.log(
			`[${config.label ?? config.collection}] Collection data generated in ${(performance.now() - startTime).toFixed(4)}ms`,
		);

		return { entries, entriesMap };
	});
}

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

export function filterWithContent(entry: CollectionEntryWithContentCount) {
	return (entry.data._entryCount ?? 0) > 0;
}

export function sortByContentCount<T extends CollectionEntryWithContentCount>(
	entryA: T,
	entryB: T,
) {
	const aTotal = entryA.data._entryCount ?? 0;
	const bTotal = entryB.data._entryCount ?? 0;

	return bTotal - aTotal;
}
