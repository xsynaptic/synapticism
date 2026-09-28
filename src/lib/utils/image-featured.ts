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

function isImageFeaturedObject(item: ImageFeaturedItem): item is ImageFeaturedObject {
	return typeof item === 'object' && 'id' in item;
}
