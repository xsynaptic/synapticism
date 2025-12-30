import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'zod';

import { CONTENT_COLLECTIONS_PATH } from '#constants.js';
import { DateStringSchema, DescriptionSchema, StylizedTextSchema } from '#lib/schemas/content.js';

// Note: pages do not have a flat structure; the URL will reflect the location on the file system
export const pages = defineCollection({
	loader: glob({ base: `${CONTENT_COLLECTIONS_PATH}/pages`, pattern: '**/[^_]*.(md|mdx)' }),
	schema: z
		.object({
			title: StylizedTextSchema,
			description: DescriptionSchema,
			dateCreated: DateStringSchema,
			dateUpdated: DateStringSchema.optional(),
			imageFeatured: z.string().optional(),
			imageHero: z.string().optional(),
			hideSearch: z.boolean().optional(),
		})
		.strict(),
});
