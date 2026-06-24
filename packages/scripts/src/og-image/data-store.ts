/**
 * Reads and deserializes Astro's data-store.json outside of Astro's runtime.
 *
 * `astro:content`'s getCollection only exists inside Astro, so a standalone
 * script reads the data store directly. It uses `devalue`, matching Astro's own
 * internal serialization.
 *
 * @see https://github.com/withastro/astro/blob/main/packages/astro/src/content/data-store.ts
 */
import * as devalue from 'devalue';
import { existsSync, readFileSync } from 'node:fs';

export interface DataStoreEntry {
	data: Record<string, unknown>;
	digest?: string;
	filePath?: string;
	id: string;
}

type DataStoreCollections = Map<string, Map<string, DataStoreEntry>>;

export function getDataStoreCollection(
	collections: DataStoreCollections,
	name: string,
): Array<DataStoreEntry> {
	const collection = collections.get(name);

	if (!collection) {
		throw new Error(`Unknown collection: "${name}"`);
	}

	return [...collection.values()];
}

export function loadDataStore(dataStorePath: string): DataStoreCollections {
	if (!existsSync(dataStorePath)) {
		throw new Error(
			`Data store not found at: ${dataStorePath}\nRun \`astro sync\` first to generate it.`,
		);
	}

	return devalue.parse(readFileSync(dataStorePath, 'utf8')) as DataStoreCollections;
}
