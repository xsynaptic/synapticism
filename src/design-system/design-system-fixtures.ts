import type { Page } from 'astro';
import type { ComponentProps } from 'astro/types';
import type { z } from 'zod';

import type LabeledRow from '#components/parts/labeled-row.astro';
import type { ContentNavigationItem } from '#components/types.ts';
import type { CatalogItem } from '#lib/catalog/catalog-types.ts';
import type { LinkItemSchema, SourceSchema } from '#lib/schemas/content.ts';
import type { ImageFeaturedObject } from '#lib/schemas/image-featured.ts';

import { hasMediaImage, mediaRoot } from '#lib/utils/media.ts';

// getMediaImage throws on a path the glob never saw, so an image is the one thing a fixture cannot invent
// The media store is gitignored; a fresh checkout resolves nothing here, hence the fallback note
const sampleImagePath = '2026/05/test.jpg';

export const sampleImageId = hasMediaImage(sampleImagePath) ? sampleImagePath : undefined;

export const sampleImageMissingNote = `No image at ${mediaRoot}/${sampleImagePath}, so the media components have nothing to resolve.`;

export const sampleImageFeatured = {
	hero: true,
	id: sampleImageId ?? '',
	title: 'A caption authored on the featured image',
} satisfies ImageFeaturedObject;

export const sampleDate = '2026-04-17';
export const sampleDateTime = '2026-04-17T14:30:00Z';
export const sampleDateUpdated = '2026-08-02';

function createCatalogItem(item: Partial<CatalogItem> & Pick<CatalogItem, 'id' | 'title'>) {
	return {
		backlinks: new Set<string>(),
		collection: 'posts',
		dateCreated: new Date(sampleDateTime),
		dateUpdated: undefined,
		description: undefined,
		entryCount: undefined,
		entryQuality: 3,
		imageId: sampleImageId,
		links: undefined,
		linksExternalCount: 0,
		url: `/design-system/#${item.id}`,
		wordCount: 820,
		...item,
	} satisfies CatalogItem;
}

export const sampleCatalogItems: Array<CatalogItem> = [
	createCatalogItem({
		description: 'A <em>rendered</em> description, clipped from the opening of the body.',
		id: 'ds-sample-post',
		title: 'Reading the grain of a typeface at small sizes',
	}),
	createCatalogItem({
		collection: 'notes',
		dateCreated: new Date('2026-02-09'),
		description: 'A shorter description, the kind a Note carries.',
		id: 'ds-sample-note',
		imageId: undefined,
		title: 'Two hundred words on cascade layers',
		wordCount: 210,
	}),
	createCatalogItem({
		collection: 'projects',
		dateCreated: new Date('2025-11-24'),
		id: 'ds-sample-project',
		imageId: undefined,
		title: 'Station tile generator',
		wordCount: 1450,
	}),
];

export const sampleNavigationNewer = {
	title: 'A newer entry, one step forward in the archive',
	url: '/design-system/#newer',
} satisfies ContentNavigationItem;

export const sampleNavigationOlder = {
	title: 'An older entry, one step back',
	url: '/design-system/#older',
} satisfies ContentNavigationItem;

export const sampleLinks = [
	{ title: 'The source this note points at', url: 'https://example.com/an-article' },
	{ title: 'A second link on the same note', url: 'https://another-example.org/follow-up' },
] satisfies Array<z.infer<typeof LinkItemSchema>>;

export const sampleSource = {
	title: 'Where it was found',
	url: 'https://example.net/',
} satisfies z.infer<typeof SourceSchema>;

// LabeledRow keeps its item interface local, so reach it through the component's own props
export const sampleRowItems = [
	{ title: 'typography', url: '/design-system/#tag-typography' },
	{ title: 'creative coding', url: '/design-system/#tag-creative-coding' },
	{ title: 'css', url: '/design-system/#tag-css' },
	{ title: 'astro', url: '/design-system/#tag-astro' },
] satisfies ComponentProps<typeof LabeledRow>['items'];

export function createSamplePage(currentPage: number, lastPage: number): Page<CatalogItem> {
	return {
		currentPage,
		data: sampleCatalogItems,
		end: sampleCatalogItems.length - 1,
		lastPage,
		size: sampleCatalogItems.length,
		start: 0,
		total: sampleCatalogItems.length * lastPage,
		// Fragments, not paths: the select navigates on change and those pages do not exist
		url: {
			current: '#pagination',
			first: '#pagination',
			last: '#pagination',
			next: currentPage < lastPage ? '#pagination' : undefined,
			prev: currentPage > 1 ? '#pagination' : undefined,
		},
	};
}
