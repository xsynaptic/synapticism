import type { CatalogItem } from '#lib/catalog/catalog-types.ts';

export function sortCatalogByDate(a: CatalogItem, b: CatalogItem): number {
	return (b.dateUpdated ?? b.dateCreated).valueOf() - (a.dateUpdated ?? a.dateCreated).valueOf();
}
