import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'zod';

import { contentCollectionsPath } from '#constants.js';
import { DateStringSchema, StylizedTextSchema } from '#lib/schemas/content.js';
import { ImageFeaturedSchema } from '#lib/schemas/image-featured.js';

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
