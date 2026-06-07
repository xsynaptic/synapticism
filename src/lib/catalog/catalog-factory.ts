import type { CollectionEntry } from 'astro:content';

import type {
	CatalogCaption,
	CatalogCollectionKey,
	CatalogItem,
} from '#lib/catalog/catalog-types.ts';

import { sortCatalogByDate } from '#lib/catalog/catalog-utils.ts';

export interface Catalog {
	all: () => ReadonlyArray<CatalogItem>;
	backlinksOf: (id: string) => Array<CatalogItem>;
	byCollection: (...collections: Array<CatalogCollectionKey>) => Array<CatalogItem>;
	getById: (id: string) => CatalogItem | undefined;
	getCaption: (id: string) => CatalogCaption | undefined;
	resolve: <T extends CatalogCollectionKey = CatalogCollectionKey>(
		entries: Array<CollectionEntry<T>>,
	) => Array<CatalogItem<T>>;
}

// Only dated content surfaces as a backlink; pages and tags are link targets, not sources
const backlinkCollections = new Set<CatalogCollectionKey>(['notes', 'posts', 'projects']);
const backlinkLimit = 10;

export function createCatalog(items: ReadonlyArray<CatalogItem>): Catalog {
	const itemsById = new Map(items.map((item) => [item.id, item] as const));

	function getById(id: string): CatalogItem | undefined {
		return itemsById.get(id);
	}

	function getCaption(id: string): CatalogCaption | undefined {
		const item = itemsById.get(id);

		if (!item) return undefined;

		return { id: item.id, title: item.title, url: item.url };
	}

	function backlinksOf(id: string): Array<CatalogItem> {
		const item = itemsById.get(id);

		if (!item) return [];

		const backlinks: Array<CatalogItem> = [];

		for (const backlinkId of item.backlinks) {
			const backlink = itemsById.get(backlinkId);

			if (backlink && backlinkCollections.has(backlink.collection)) {
				backlinks.push(backlink);
			}
		}

		return backlinks.sort(sortCatalogByDate).slice(0, backlinkLimit);
	}

	function resolve<T extends CatalogCollectionKey = CatalogCollectionKey>(
		entries: Array<CollectionEntry<T>>,
	): Array<CatalogItem<T>> {
		return entries.map(({ collection, id }) => {
			const item = itemsById.get(id);

			if (!item) {
				throw new Error(
					`[Catalog] Catalog item for "${id}" in the "${collection}" collection was not found!`,
				);
			}
			return item as CatalogItem<T>;
		});
	}

	function byCollection(...collections: Array<CatalogCollectionKey>): Array<CatalogItem> {
		const collectionSet = new Set(collections);

		return items.filter((item) => collectionSet.has(item.collection));
	}

	function all(): ReadonlyArray<CatalogItem> {
		return items;
	}

	return { all, backlinksOf, byCollection, getById, getCaption, resolve };
}
