import type { PageOpenGraphCard } from '@synapticism/shared/open-graph';

import { siteTagline, siteTitle } from '@synapticism/shared/constants';
import { getImageFeaturedId } from '@synapticism/shared/image-featured';
import {
	getOpenGraphCardPath,
	getOpenGraphId,
	openGraphIndexIds,
} from '@synapticism/shared/open-graph';

import { parseContentDate } from '#lib/utils/date.ts';
import { getDescriptionRenderedText } from '#lib/utils/description-data.ts';
import { getAbsoluteUrl } from '#lib/utils/routing.ts';

interface OpenGraphEntry {
	body?: string | undefined;
	collection: string;
	data: {
		description?: string | undefined;
		imageFeatured?: Parameters<typeof getImageFeaturedId>[0];
		title: string;
	};
	id: string;
}

export const defaultOpenGraphCard: PageOpenGraphCard = {
	id: openGraphIndexIds.default,
	input: { title: siteTitle },
};

export const homeOpenGraphCard: PageOpenGraphCard = {
	id: openGraphIndexIds.home,
	input: { description: siteTagline, title: siteTitle },
};

export function getEntryOpenGraphCard(entry: OpenGraphEntry): PageOpenGraphCard {
	return {
		id: getOpenGraphId(entry.collection, entry.id),
		imageId: getImageFeaturedId(entry.data.imageFeatured),
		input: {
			description: getDescriptionRenderedText(entry),
			title: entry.data.title,
		},
	};
}

export function getIndexOpenGraphCard(
	index: 'posts' | 'projects' | 'tags',
	{ description, title }: { description: string; title: string },
): PageOpenGraphCard {
	return { id: openGraphIndexIds[index], input: { description, title } };
}

export function getOpenGraphImageUrl(card: PageOpenGraphCard): string {
	return getAbsoluteUrl(getOpenGraphCardPath(card));
}

export function getSeoArticleProps({
	dateCreated,
	dateUpdated,
}: {
	dateCreated: Date;
	dateUpdated: Date | undefined;
}) {
	const publishedTime = parseContentDate(dateCreated)?.toISOString() ?? '';
	const modifiedTime = parseContentDate(dateUpdated)?.toISOString();

	return {
		article: {
			publishedTime,
			...(modifiedTime ? { modifiedTime } : {}),
		},
		ogType: 'article' as const,
	};
}
