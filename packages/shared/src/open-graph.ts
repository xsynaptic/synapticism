import { getCardName } from '@xsynaptic/astro-image-pipeline/names';

import { openGraphBasePath, openGraphImageFormat } from '#constants.ts';

export interface OpenGraphCardInput {
	description?: string | undefined;
	title: string;
}

export interface PageOpenGraphCard {
	id: string;
	imageId?: string | undefined;
	input: OpenGraphCardInput;
}

// Kept free of node and image dependencies so production layouts can import it
export const openGraphIndexIds = {
	default: 'index-default',
	home: 'index-home',
	posts: 'index-posts',
	projects: 'index-projects',
	tags: 'index-tags',
} as const;

export function getOpenGraphId(collection: string, id: string): string {
	return `${collection}-${id}`;
}

export function getOpenGraphCardPath({ id, imageId, input }: PageOpenGraphCard): string {
	const name = getCardName(
		{
			id,
			...(imageId === undefined ? {} : { image: { id: imageId } }),
			input: { description: input.description, title: input.title },
		},
		{ format: openGraphImageFormat },
	);

	return `/${openGraphBasePath}/${name}`;
}
