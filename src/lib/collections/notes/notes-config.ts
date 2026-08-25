import { glob } from 'astro/loaders';
import { defineCollection, reference } from 'astro:content';

import { contentCollectionsPath } from '#constants.js';
import { contentBaseSchema, LinkItemSchema, SourceSchema } from '#lib/schemas/content.js';

export const notes = defineCollection({
	loader: glob({
		base: `${contentCollectionsPath}/notes`,
		// Year folders organize content only; IDs and URLs stay flat
		generateId: ({ entry }) => entry.replace(/^.*\//, '').replace(/\.mdx?$/, ''),
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
