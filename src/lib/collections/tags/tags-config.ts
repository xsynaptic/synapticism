import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'zod';

import { CONTENT_COLLECTIONS_PATH } from '#constants.js';
import { DateStringSchema, StylizedTextSchema } from '#lib/schemas/content.js';

export const tags = defineCollection({
	loader: glob({ base: `${CONTENT_COLLECTIONS_PATH}/tags`, pattern: '**/[^_]*.(md|mdx)' }),
	schema: z
		.object({
			title: StylizedTextSchema,
			description: z.string().optional(),
			dateCreated: DateStringSchema,
			dateUpdated: DateStringSchema.optional(),
			imageFeatured: z.string().optional(),
			hideSearch: z.boolean().optional(),
			_postCount: z.number().int().optional(),
		})
		.strict(),
});
