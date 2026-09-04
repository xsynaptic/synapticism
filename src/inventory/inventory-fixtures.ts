import type { OpenGraphMetadataItem } from '@synapticism/scripts/og-image';
import type { Page } from 'astro';
import type { ComponentProps } from 'astro/types';
import type { z } from 'zod';

import { mediaDir, toOpenGraphEntryItem } from '@synapticism/scripts/og-image';
import path from 'node:path';

import type LabeledRow from '#components/parts/labeled-row.astro';
import type { ContentNavigationItem } from '#components/types.ts';
import type { CatalogItem } from '#lib/catalog/catalog-types.ts';
import type { LinkItemSchema, SourceSchema } from '#lib/schemas/content.ts';
import type { ImageFeaturedObject } from '#lib/schemas/image-featured.ts';

import { getNotesCollection } from '#lib/collections/notes/notes-data.ts';
import { getPagesCollection } from '#lib/collections/pages/pages-data.ts';
import { getPostsCollection } from '#lib/collections/posts/posts-data.ts';
import { getProjectsCollection } from '#lib/collections/projects/projects-data.ts';
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
		url: `/inventory/#${item.id}`,
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
	url: '/inventory/#newer',
} satisfies ContentNavigationItem;

export const sampleNavigationOlder = {
	title: 'An older entry, one step back',
	url: '/inventory/#older',
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
	{ title: 'typography', url: '/inventory/#tag-typography' },
	{ title: 'creative coding', url: '/inventory/#tag-creative-coding' },
	{ title: 'css', url: '/inventory/#tag-css' },
	{ title: 'astro', url: '/inventory/#tag-astro' },
] satisfies ComponentProps<typeof LabeledRow>['items'];

// The OG card is drawn by a batch script (`packages/scripts/src/og-image`), never by Astro
// A key doubles as the route param, so `inventory-og-image.ts` resolves one back through this list
interface OpenGraphCard {
	entry: OpenGraphMetadataItem;
	imagePath: string | undefined;
}

interface SampleOpenGraphCard extends OpenGraphCard {
	key: string;
}

const mediaPath = path.resolve(mediaDir);

// Written rather than found: the corpus is small enough that every real title lands on one step
// Lengths ride the thresholds in `titleFontSize`, measured against the full-width text column
const openGraphTitleSamples = [
	{ key: 'title-short', title: 'Cascade layers, in brief' },
	{ key: 'title-medium', title: 'Reading the grain of a typeface at small sizes' },
	{
		key: 'title-clamped',
		title:
			'A title long enough to run past the four lines the card allows, which is what the clamp is for: the words keep coming, the size has already bottomed out on the ramp, and the last of it is dropped rather than allowed to push the wordmark off the foot of the frame',
	},
];

// Borrowed by the split-layout card, whose column is barely half the width the ramp is tuned against
const openGraphImageTitle = 'Drawing a social preview card without a browser anywhere in the loop';

async function createSampleOpenGraphCards() {
	const [notes, pages, posts, projects] = await Promise.all([
		getNotesCollection(),
		getPagesCollection(),
		getPostsCollection(),
		getProjectsCollection(),
	]);

	const candidates = [
		...notes.entries,
		...pages.entries,
		...posts.entries,
		...projects.entries,
	].flatMap<OpenGraphCard>((entry) => {
		const item = toOpenGraphEntryItem({ collection: entry.collection, entry, mediaPath });

		if (!item) return [];

		return [
			{ entry: item, imagePath: item.imageId ? path.join(mediaPath, item.imageId) : undefined },
		];
	});

	const titleCards = openGraphTitleSamples.map(({ key, title }) => ({
		entry: { collection: 'inventory', id: key, label: 'inventory', title },
		imagePath: undefined,
		key,
	}));

	const imageCard = candidates.find((card) => card.imagePath);

	return [
		...toOpenGraphCard('image-split', imageCard),
		...toOpenGraphCard(
			'image-long',
			imageCard
				? {
						entry: {
							collection: 'inventory',
							id: 'image-long',
							label: 'inventory',
							title: openGraphImageTitle,
						},
						imagePath: imageCard.imagePath,
					}
				: undefined,
		),
		...toOpenGraphCard(
			'title-only',
			candidates.find((card) => !card.imagePath),
		),
		...titleCards,
	];
}

function toOpenGraphCard(key: string, card: OpenGraphCard | undefined): Array<SampleOpenGraphCard> {
	return card ? [{ key, ...card }] : [];
}

// The page renders one img per card and the route re-enters here for each, so sample once
let sampleOpenGraphCards: Promise<Array<SampleOpenGraphCard>> | undefined;

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

export function getSampleOpenGraphCards() {
	if (!sampleOpenGraphCards) {
		sampleOpenGraphCards = createSampleOpenGraphCards();
	}

	return sampleOpenGraphCards;
}
