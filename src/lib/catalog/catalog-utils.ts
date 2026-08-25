import type { CatalogCollectionKey, CatalogItem } from '#lib/catalog/catalog-types.ts';

// Only dated content links editorially; pages and tags are link targets, not sources
const editorialCollections = new Set<CatalogCollectionKey>(['notes', 'posts', 'projects']);

export function filterIsEditorialEntry(item: CatalogItem): boolean {
	return editorialCollections.has(item.collection);
}

export function sortCatalogByDate(a: CatalogItem, b: CatalogItem): number {
	return (b.dateUpdated ?? b.dateCreated).valueOf() - (a.dateUpdated ?? a.dateCreated).valueOf();
}
