import { glob } from 'astro/loaders';
import { defineCollection, reference } from 'astro:content';

import { contentCollectionsPath } from '#constants.ts';
import { contentBaseSchema } from '#lib/schemas/content.ts';
import { generateFlatId } from '#lib/utils/collections.ts';

export const posts = defineCollection({
	loader: glob({
		base: `${contentCollectionsPath}/posts`,
		generateId: generateFlatId,
		pattern: '**/[^_]*.(md|mdx)',
	}),
	schema: contentBaseSchema
		.extend({
			projects: reference('projects').array().optional(),
			tags: reference('tags').array().optional(),
		})
		.strict(),
});
