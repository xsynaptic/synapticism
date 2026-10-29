import { getCardName } from '@xsynaptic/astro-image-pipeline/names';

import { openGraphBasePath, openGraphImageFormat } from '#constants.ts';

export interface OpenGraphCardInput {
	label?: string | undefined;
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

// `pages` is absent: its cards draw with no label
const collectionLabels: Record<string, string> = {
	posts: 'post',
	projects: 'project',
	tags: 'tag',
};

export function getOpenGraphId(collection: string, id: string): string {
	return `${collection}-${id}`;
}

export function getOpenGraphLabel(collection: string): string | undefined {
	return collectionLabels[collection];
}

export function getOpenGraphCardPath({ id, imageId, input }: PageOpenGraphCard): string {
	const name = getCardName(
		{
			id,
			...(imageId === undefined ? {} : { image: { id: imageId } }),
			input: { label: input.label, title: input.title },
		},
		{ format: openGraphImageFormat },
	);

	return `/${openGraphBasePath}/${name}`;
}
