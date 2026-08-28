import { glob } from 'astro/loaders';
import { defineCollection, reference } from 'astro:content';
import { z } from 'zod';

import { contentCollectionsPath } from '#constants.js';
import { contentBaseSchema } from '#lib/schemas/content.js';
import { generateFlatId } from '#lib/utils/collections.ts';

export const pages = defineCollection({
	loader: glob({
		base: `${contentCollectionsPath}/pages`,
		generateId: generateFlatId,
		pattern: '**/[^_]*.(md|mdx)',
	}),
	schema: contentBaseSchema
		.extend({ hideSearch: z.boolean().optional(), tags: reference('tags').array().optional() })
		.strict(),
});
