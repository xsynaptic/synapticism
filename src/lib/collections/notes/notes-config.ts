import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';

import { contentCollectionsPath } from '#constants.ts';
import { articleSchema } from '#lib/schemas/content.ts';
import { generateFlatId } from '#lib/utils/collections.ts';

export const notes = defineCollection({
	loader: glob({
		base: `${contentCollectionsPath}/notes`,
		generateId: generateFlatId,
		pattern: '**/[^_]*.(md|mdx)',
	}),
	schema: articleSchema,
});
