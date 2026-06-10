import { glob } from 'astro/loaders';
import { defineCollection, reference } from 'astro:content';

import { CONTENT_COLLECTIONS_PATH } from '#constants.js';
import { contentBaseSchema, LinkItemSchema, SourceSchema } from '#lib/schemas/content.js';

export const notes = defineCollection({
	loader: glob({ base: `${CONTENT_COLLECTIONS_PATH}/notes`, pattern: '**/[^_]*.(md|mdx)' }),
	schema: contentBaseSchema
		.extend({
			links: LinkItemSchema.array().optional(),
			projects: reference('projects').array().optional(),
			source: SourceSchema.optional(),
			tags: reference('tags').array().optional(),
		})
		.strict(),
});
