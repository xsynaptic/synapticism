export interface ImageFeaturedReference {
	id: string;
	title?: string;
}

function getImageFeaturedObjectReference(item: object): ImageFeaturedReference | undefined {
	if (!('id' in item) || typeof item.id !== 'string') return undefined;
	if ('title' in item && typeof item.title === 'string') return { id: item.id, title: item.title };

	return { id: item.id };
}

function getImageFeaturedReference(item: unknown): ImageFeaturedReference | undefined {
	if (typeof item === 'string') return item ? { id: item } : undefined;
	if (typeof item !== 'object' || item === null) return undefined;

	return getImageFeaturedObjectReference(item);
}

export function getImageFeaturedItems(imageFeatured: unknown): Array<ImageFeaturedReference> {
	const items: Array<unknown> = Array.isArray(imageFeatured) ? imageFeatured : [imageFeatured];

	return items
		.map((item) => getImageFeaturedReference(item))
		.filter((reference) => reference !== undefined);
}

export function getImageFeaturedId(imageFeatured: unknown): string | undefined {
	return getImageFeaturedItems(imageFeatured)[0]?.id;
}
