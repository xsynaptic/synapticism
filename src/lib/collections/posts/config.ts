import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

import { CONTENT_COLLECTIONS_PATH } from '#constants.js';
import { DateStringSchema, DescriptionSchema, TitleSchema } from '#lib/schemas/content.js';

export const posts = defineCollection({
	loader: glob({ base: `${CONTENT_COLLECTIONS_PATH}/posts`, pattern: '**/[^_]*.(md|mdx)' }),
	schema: z
		.object({
			title: TitleSchema,
			description: DescriptionSchema,
			dateCreated: DateStringSchema,
			dateUpdated: DateStringSchema.optional(),
			imageFeatured: z.string().optional(),
			imageHero: z.string().optional(),
		})
		.strict(),
});
