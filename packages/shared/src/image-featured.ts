export function getImageFeaturedId(imageFeatured: unknown): string | undefined {
	const item: unknown = Array.isArray(imageFeatured) ? imageFeatured[0] : imageFeatured;

	if (typeof item === 'string') return item || undefined;

	if (typeof item === 'object' && item !== null && 'id' in item && typeof item.id === 'string') {
		return item.id;
	}

	return undefined;
}
