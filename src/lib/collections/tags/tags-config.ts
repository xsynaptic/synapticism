import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'zod';

import { contentCollectionsPath } from '#constants.ts';
import { DateStringSchema, StylizedTextSchema } from '#lib/schemas/content.ts';
import { ImageFeaturedSchema } from '#lib/schemas/image-featured.ts';

export const tags = defineCollection({
	loader: glob({ base: `${contentCollectionsPath}/tags`, pattern: '**/[^_]*.(md|mdx)' }),
	schema: z
		.object({
			_entryCount: z.number().int().optional(),
			dateCreated: DateStringSchema,
			dateUpdated: DateStringSchema.optional(),
			description: z.string().optional(),
			hideSearch: z.boolean().optional(),
			imageFeatured: ImageFeaturedSchema.optional(),
			title: StylizedTextSchema,
		})
		.strict(),
});
