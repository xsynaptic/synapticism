import { openGraphBasePath, openGraphImageFormat } from '#constants.ts';

// The one definition of a card's identity, read by the generator and by the page that links it
// Kept free of node and image dependencies so production layouts can import it
export const openGraphIndexIds = {
	default: 'index-default',
	home: 'index-home',
	notes: 'index-notes',
	posts: 'index-posts',
	projects: 'index-projects',
	tags: 'index-tags',
} as const;

export function getOpenGraphId(collection: string, id: string): string {
	return `${collection}-${id}`;
}

export function getOpenGraphPath(outputId: string): string {
	return `/${openGraphBasePath}/${outputId}.${openGraphImageFormat}`;
}
