import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'zod';

import { CONTENT_COLLECTIONS_PATH } from '#constants.js';
import { contentBaseSchema } from '#lib/schemas/content.js';

// Note: pages do not have a flat structure; the URL will reflect the location on the file system
export const pages = defineCollection({
	loader: glob({ base: `${CONTENT_COLLECTIONS_PATH}/pages`, pattern: '**/[^_]*.(md|mdx)' }),
	schema: contentBaseSchema.extend({ hideSearch: z.boolean().optional() }).strict(),
});
