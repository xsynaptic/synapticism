import type { CollectionEntry, CollectionKey } from 'astro:content';

import { performance } from 'node:perf_hooks';

import type { Catalog } from '#lib/catalog/catalog-factory.ts';
import type { CatalogItem } from '#lib/catalog/catalog-types.ts';

import { siteYearFounded } from '#constants.ts';
import { createCatalog } from '#lib/catalog/catalog-factory.ts';
import { getNotesCollection } from '#lib/collections/notes/notes-data.ts';
import { getPagesCollection } from '#lib/collections/pages/pages-data.ts';
import { getPostsCollection } from '#lib/collections/posts/posts-data.ts';
import { getProjectsCollection } from '#lib/collections/projects/projects-data.ts';
import { getTagsCollection } from '#lib/collections/tags/tags-data.ts';
import { parseContentDate } from '#lib/utils/date.ts';
import { getDescriptionRenderedHtml } from '#lib/utils/description.ts';
import { getImageFeaturedId } from '#lib/utils/image-featured.ts';
import { getContentUrl } from '#lib/utils/routing.ts';
import { getWordCount } from '#lib/utils/word-count.ts';

function getLinksExternalCount(entry: CollectionEntry<CollectionKey>): number {
	if (!entry.body) return 0;

	return (entry.body.match(/\[[^\]]*\]\(https?:\/\/[^)]+\)/g) ?? []).length;
}

const backlinkLinkPattern = /<Link id="([^"]+)"/g;

async function buildCatalogItems(): Promise<Array<CatalogItem>> {
	const startTime = performance.now();

	const catalogItemsById = new Map<string, CatalogItem>();

	const { entries: notes } = await getNotesCollection();
	const { entries: pages } = await getPagesCollection();
	const { entries: posts } = await getPostsCollection();
	const { entries: projects } = await getProjectsCollection();
	const { entries: tags } = await getTagsCollection();

	const collections = [pages, posts, notes, projects, tags];

	const wordCountsById = new Map(
		await Promise.all(
			collections.flat().map(async (entry) => [entry.id, await getWordCount(entry)] as const),
		),
	);

	for (const collection of collections) {
		for (const entry of collection) {
			if (catalogItemsById.has(entry.id)) {
				throw new Error(
					`[Catalog] Duplicate ID found for "${entry.id}" across different collections!`,
				);
			}

			catalogItemsById.set(entry.id, {
				backlinks: new Set<string>(),
				collection: entry.collection,
				dateCreated: parseContentDate(entry.data.dateCreated) ?? new Date(String(siteYearFounded)),
				dateUpdated: parseContentDate(
					'dateUpdated' in entry.data ? entry.data.dateUpdated : undefined,
				),
				description: getDescriptionRenderedHtml(entry),
				entryCount: '_entryCount' in entry.data ? entry.data._entryCount : undefined,
				entryQuality: 'entryQuality' in entry.data ? entry.data.entryQuality : undefined,
				id: entry.id,
				imageId:
					'imageFeatured' in entry.data
						? getImageFeaturedId({ imageFeatured: entry.data.imageFeatured })
						: undefined,
				links: 'links' in entry.data ? entry.data.links : undefined,
				linksExternalCount: getLinksExternalCount(entry),
				title: entry.data.title,
				url: getContentUrl(entry.collection, entry.id),
				wordCount: wordCountsById.get(entry.id),
			});
		}
	}

	for (const collection of collections) {
		for (const entry of collection) {
			generateContentBacklinksFromMdxComponents(entry, catalogItemsById);
		}
	}

	console.log(`[Catalog] Generated in ${(performance.now() - startTime).toFixed(4)}ms`);

	return [...catalogItemsById.values()];
}

function generateContentBacklinksFromMdxComponents(
	entry: CollectionEntry<CollectionKey>,
	catalogItemsById: Map<string, CatalogItem>,
) {
	if (!entry.body?.includes('<Link ')) return;

	for (const [, backlinkId] of entry.body.matchAll(backlinkLinkPattern)) {
		if (!backlinkId || backlinkId === entry.id) continue;

		const backlinkSet = catalogItemsById.get(backlinkId)?.backlinks;

		if (backlinkSet) backlinkSet.add(entry.id);
	}
}

async function loadCatalog(): Promise<Catalog> {
	return createCatalog(await buildCatalogItems());
}

let catalogInstance: Promise<Catalog> | undefined;

export async function getCatalog(): Promise<Catalog> {
	if (!catalogInstance) {
		catalogInstance = loadCatalog();
	}
	return catalogInstance;
}
