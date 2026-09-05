import { glob } from 'astro/loaders';
import { defineCollection, reference } from 'astro:content';

import { contentCollectionsPath } from '#constants.ts';
import { contentBaseSchema, LinkItemSchema, SourceSchema } from '#lib/schemas/content.ts';
import { generateFlatId } from '#lib/utils/collections.ts';

export const notes = defineCollection({
	loader: glob({
		base: `${contentCollectionsPath}/notes`,
		generateId: generateFlatId,
		pattern: '**/[^_]*.(md|mdx)',
	}),
	schema: contentBaseSchema
		.extend({
			links: LinkItemSchema.array().optional(),
			projects: reference('projects').array().optional(),
			source: SourceSchema.optional(),
			tags: reference('tags').array().optional(),
		})
		.strict(),
});
