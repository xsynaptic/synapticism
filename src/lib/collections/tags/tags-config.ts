import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'zod';

import { contentCollectionsPath } from '#constants.ts';
import { withSitemapLastmod } from '#lib/collections/collections-sitemap.ts';
import { DateStringSchema, StylizedTextSchema } from '#lib/schemas/content.ts';
import { ImageFeaturedSchema } from '#lib/schemas/image-featured.ts';

export const tags = defineCollection({
	loader: withSitemapLastmod(
		'tags',
		glob({ base: `${contentCollectionsPath}/tags`, pattern: '**/[^_]*.(md|mdx)' }),
	),
	schema: z
		.object({
			dateCreated: DateStringSchema,
			dateUpdated: DateStringSchema.optional(),
			description: z.string().optional(),
			imageFeatured: ImageFeaturedSchema.optional(),
			title: StylizedTextSchema,
		})
		.strict(),
});
