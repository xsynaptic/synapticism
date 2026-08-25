import { glob } from 'astro/loaders';
import { defineCollection, reference } from 'astro:content';
import path from 'node:path';
import { z } from 'zod';

import { contentCollectionsPath } from '#constants.js';
import { contentBaseSchema } from '#lib/schemas/content.js';

// Subfolders are for organization only; the id collapses to the filename so URLs stay flat
export const pages = defineCollection({
	loader: glob({
		base: `${contentCollectionsPath}/pages`,
		generateId: ({ entry }) => path.basename(entry, path.extname(entry)),
		pattern: '**/[^_]*.(md|mdx)',
	}),
	schema: contentBaseSchema
		.extend({ hideSearch: z.boolean().optional(), tags: reference('tags').array().optional() })
		.strict(),
});
