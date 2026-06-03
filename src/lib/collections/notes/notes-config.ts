import { glob } from 'astro/loaders';
import { defineCollection, reference } from 'astro:content';

import { CONTENT_COLLECTIONS_PATH } from '#constants.js';
import { contentBaseSchema } from '#lib/schemas/content.js';

export const notes = defineCollection({
	loader: glob({ base: `${CONTENT_COLLECTIONS_PATH}/notes`, pattern: '**/[^_]*.(md|mdx)' }),
	schema: contentBaseSchema.extend({ tags: reference('tags').array().optional() }).strict(),
});
