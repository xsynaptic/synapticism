import type { CatalogItem } from '#lib/catalog/catalog-types.ts';

// Shared CatalogItem factory for unit tests; pass only the fields a test cares about
export function makeCatalogItem(
	overrides: Partial<CatalogItem> & Pick<CatalogItem, 'collection' | 'id'>,
): CatalogItem {
	return {
		backlinks: new Set<string>(),
		// Local-time constructor (not an ISO string) so date-bucketing tests stay timezone stable
		dateCreated: new Date(2020, 0, 1),
		dateUpdated: undefined,
		description: undefined,
		entryCount: undefined,
		entryQuality: undefined,
		imageId: undefined,
		links: undefined,
		linksExternalCount: undefined,
		title: overrides.id,
		url: `/${overrides.id}`,
		wordCount: undefined,
		...overrides,
	};
}
