import { findComponentTags, getTagProp } from '@xsynaptic/astro-scripts';

export function extractImageFeaturedIds(data: Record<string, unknown>): Array<string> {
	const { imageFeatured } = data;

	if (typeof imageFeatured === 'string') return [imageFeatured];

	if (!Array.isArray(imageFeatured)) return [];

	const ids: Array<string> = [];

	const items = imageFeatured as Array<unknown>;

	for (const item of items) {
		if (typeof item === 'string') {
			ids.push(item);
			continue;
		}

		if (typeof item !== 'object' || item === null) continue;

		const { id } = item as { id?: unknown };

		if (typeof id === 'string') ids.push(id);
	}

	return ids;
}

export function extractMdxImageIds(body: string): Array<string> {
	return findComponentTags(body, ['Img'])
		.map((tag) => getTagProp(tag, 'src'))
		.filter((src) => src !== undefined);
}
