import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';

import { contentCollectionsPath } from '#constants.ts';
import { withSitemapLastmod } from '#lib/collections/collections-sitemap.ts';
import { postSchema } from '#lib/schemas/content.ts';
import { generateFlatId } from '#lib/utils/collections.ts';

export const posts = defineCollection({
	loader: withSitemapLastmod(
		'posts',
		glob({
			base: `${contentCollectionsPath}/posts`,
			generateId: generateFlatId,
			pattern: '**/[^_]*.(md|mdx)',
		}),
	),
	schema: postSchema,
});
