import type { ImageFeaturedReference } from '@synapticism/shared/image-featured';
import type { OpenGraphCardInput } from '@synapticism/shared/open-graph';
import type { Page } from 'astro';
import type { ComponentProps } from 'astro/types';
import type { CollectionEntry } from 'astro:content';

import type ContentCard from '#components/content/content-card.astro';
import type ChipRow from '#components/parts/chip-row.astro';
import type LabeledRow from '#components/parts/labeled-row.astro';
import type { CatalogItem } from '#lib/catalog/catalog-types.ts';
import type { ImageFeaturedObject } from '#lib/schemas/image-featured.ts';
import type { PaginationEntry } from '#lib/utils/pagination-types.ts';

import { getPagesCollection } from '#lib/collections/pages/pages-data.ts';
import { getPostsCollection } from '#lib/collections/posts/posts-data.ts';
import { getProjectsCollection } from '#lib/collections/projects/projects-data.ts';
import { t } from '#lib/i18n/i18n-strings.ts';
import { hasMediaImage, mediaRoot } from '#lib/utils/media.ts';
import { getEntryOpenGraphCard, getIndexOpenGraphCard, homeOpenGraphCard } from '#lib/utils/seo.ts';

// getMediaImage throws on a path the glob never saw, so an image is the one thing a fixture cannot invent
// The media store is gitignored; a fresh checkout resolves nothing here, hence the fallback note
const sampleImagePath = '2026/05/test.jpg';

export const sampleImageId = hasMediaImage(sampleImagePath) ? sampleImagePath : undefined;

export const sampleImageMissingNote = `No image at ${mediaRoot}/${sampleImagePath}, so the media components have nothing to resolve.`;

export const sampleImageFeatured = sampleImageId
	? ({
			hero: true,
			id: sampleImageId,
			title: 'A caption authored on the featured image',
		} satisfies ImageFeaturedObject)
	: undefined;

export const sampleCarouselImages = sampleImageId
	? (['One', 'Two', 'Three'].map((label) => ({
			id: sampleImageId,
			title: `Slide ${label}`,
		})) satisfies Array<ImageFeaturedReference>)
	: [];

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
		imageId: sampleImageId,
		linksExternalCount: 0,
		url: `/inventory/#${item.id}`,
		wordCount: 820,
		...item,
	} satisfies CatalogItem;
}

export const sampleCatalogItems: Array<CatalogItem> = [
	createCatalogItem({
		description: 'A <em>rendered</em> description, clipped from the opening of the body.',
		id: 'sample-post',
		title: 'Reading the grain of a typeface at small sizes',
	}),
	createCatalogItem({
		collection: 'posts',
		dateCreated: new Date('2026-02-09'),
		description: 'A shorter description, the kind a short Post carries.',
		id: 'sample-short-post',
		imageId: undefined,
		title: 'Two hundred words on cascade layers',
		wordCount: 210,
	}),
	createCatalogItem({
		collection: 'projects',
		dateCreated: new Date('2025-11-24'),
		id: 'sample-project',
		imageId: undefined,
		title: 'Station tile generator',
		wordCount: 1450,
	}),
];

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

export const samplePaginationPrevious = {
	title: 'A newer entry, one step forward in the archive',
	url: '/inventory/#previous',
} satisfies PaginationEntry;

export const samplePaginationNext = {
	title: 'An older entry, one step back',
	url: '/inventory/#next',
} satisfies PaginationEntry;

// LabeledRow keeps its item interface local, so reach it through the component's own props
export const sampleRowItems = [
	{ title: 'typography', url: '/inventory/#tag-typography' },
	{ title: 'creative coding', url: '/inventory/#tag-creative-coding' },
	{ title: 'css', url: '/inventory/#tag-css' },
	{ title: 'astro', url: '/inventory/#tag-astro' },
] satisfies ComponentProps<typeof LabeledRow>['items'];

export const sampleChipItems = [
	{ count: 12, title: 'Astro', url: '/inventory/#tag-astro' },
	{ count: 5, title: 'Creative Coding', url: '/inventory/#tag-creative-coding' },
	{ count: 1, title: 'Typography', url: '/inventory/#tag-typography' },
] satisfies ComponentProps<typeof ChipRow>['items'];

// A key doubles as the route param, so `inventory-og-image.ts` resolves one back through this list
interface SampleOpenGraphCard extends OpenGraphCardInput {
	imageId?: string | undefined;
	key: string;
}

export const openGraphSampleKeys = [
	'home',
	'index',
	'description',
	'excerpt',
	'image',
	'image-overflow',
	'overflow',
	'title-only',
] as const;

type OpenGraphSampleKey = (typeof openGraphSampleKeys)[number];

const openGraphOverflowInput = {
	description:
		'A description long enough to overrun the two lines the card gives it, so the ellipsis shows where the clamp lands, whatever size the title above it settles on.',
	title:
		'A title long enough to run past the three lines the card allows, so the size bottoms out on the ramp and the clamp cuts the rest',
} satisfies OpenGraphCardInput;

async function findEntryOpenGraphCards() {
	const [pages, posts, projects] = await Promise.all([
		getPagesCollection(),
		getPostsCollection(),
		getProjectsCollection(),
	]);

	const cards = [...pages.entries, ...posts.entries, ...projects.entries].map((entry) => ({
		card: getEntryOpenGraphCard(entry),
		isAuthored: entry.data.description !== undefined,
	}));
	const textCards = cards.filter(({ card }) => card.imageId === undefined);

	return {
		authored: textCards.find(({ isAuthored }) => isAuthored)?.card,
		excerpted: textCards.find(
			({ card, isAuthored }) => !isAuthored && card.input.description !== undefined,
		)?.card,
		image: cards.find(({ card }) => card.imageId !== undefined && hasMediaImage(card.imageId))
			?.card,
	};
}

async function createSampleOpenGraphCards() {
	const { authored, excerpted, image } = await findEntryOpenGraphCards();
	const imageId = image?.imageId;

	return [
		toOpenGraphCard('home', homeOpenGraphCard.input),
		toOpenGraphCard(
			'index',
			getIndexOpenGraphCard('posts', {
				description: t('posts.description'),
				title: t('posts.title'),
			}).input,
		),
		toOpenGraphCard('description', authored?.input),
		toOpenGraphCard('excerpt', excerpted?.input),
		toOpenGraphCard('image', image?.input, imageId),
		toOpenGraphCard('image-overflow', imageId ? openGraphOverflowInput : undefined, imageId),
		toOpenGraphCard('overflow', openGraphOverflowInput),
		toOpenGraphCard('title-only', { title: 'Cascade layers' }),
	].filter((card) => card !== undefined);
}

function toOpenGraphCard(
	key: OpenGraphSampleKey,
	input: OpenGraphCardInput | undefined,
	imageId?: string,
): SampleOpenGraphCard | undefined {
	return input ? { imageId, key, ...input } : undefined;
}

// The page renders one img per card and the route re-enters here for each, so sample once
let sampleOpenGraphCards: Promise<Array<SampleOpenGraphCard>> | undefined;

export function getSampleOpenGraphCards() {
	if (!sampleOpenGraphCards) {
		sampleOpenGraphCards = createSampleOpenGraphCards();
	}

	return sampleOpenGraphCards;
}

export const sampleCardTagItems = sampleChipItems.map(({ title, url }) => ({
	title,
	url,
})) satisfies ComponentProps<typeof ContentCard>['tagItems'];

export const sampleCardDescription =
	'A <em>rendered</em> Description, authored in frontmatter or clipped from the opening of the body.';

export const sampleSubtitlePost = {
	collection: 'posts',
	data: {
		dateCreated: new Date(sampleDateTime),
		dateUpdated: new Date(sampleDateUpdated),
		title: 'A Post',
	},
	id: 'sample-post',
} satisfies CollectionEntry<'posts'>;

export const sampleSubtitleProjectOngoing = {
	collection: 'projects',
	data: {
		dateCreated: new Date(sampleDateTime),
		dateStarted: 2012,
		homeUrl: 'https://synapticism.com',
		sourceUrl: 'https://github.com/xsynaptic',
		template: 'sidebar',
		title: 'An ongoing Project',
	},
	id: 'sample-project-ongoing',
} satisfies CollectionEntry<'projects'>;

export const sampleSubtitleProjectOneOff = {
	collection: 'projects',
	data: {
		dateCreated: new Date(sampleDateTime),
		sourceUrl: 'https://codeberg.org',
		template: 'sidebar',
		title: 'A one-off Project',
	},
	id: 'sample-project-one-off',
} satisfies CollectionEntry<'projects'>;
