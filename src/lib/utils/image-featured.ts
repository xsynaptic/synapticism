import type {
	ImageFeatured,
	ImageFeaturedItem,
	ImageFeaturedObject,
} from '#lib/schemas/image-featured.ts';

// Heroes are opt-in via "hero: true"; a bare string never yields one
export function getImageFeaturedHeroGroup({
	imageFeatured,
}: {
	imageFeatured: ImageFeatured | undefined;
}): Array<ImageFeaturedObject> | undefined {
	if (!imageFeatured || !Array.isArray(imageFeatured)) return undefined;

	const imageHeroObjectGroup = imageFeatured.filter(
		(item): item is ImageFeaturedObject => isImageFeaturedObject(item) && item.hero === true,
	);

	if (imageHeroObjectGroup.length === 0) return undefined;

	return imageHeroObjectGroup;
}

// The first item serves as the card, thumbnail, and social preview image
export function getImageFeaturedId({
	imageFeatured,
}: {
	imageFeatured: ImageFeatured | undefined;
}): string | undefined {
	if (!imageFeatured) return undefined;

	if (typeof imageFeatured === 'string') return imageFeatured;

	const [item] = imageFeatured;

	if (!item) return undefined;

	return isImageFeaturedObject(item) ? item.id : item;
}

function isImageFeaturedObject(item: ImageFeaturedItem): item is ImageFeaturedObject {
	return typeof item === 'object' && 'id' in item;
}
