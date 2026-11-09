import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';

import { contentCollectionsPath } from '#constants.ts';
import { withSitemapLastmod } from '#lib/collections/collections-sitemap.ts';
import { projectSchema } from '#lib/schemas/content.ts';

export const projects = defineCollection({
	loader: withSitemapLastmod(
		'projects',
		glob({ base: `${contentCollectionsPath}/projects`, pattern: '**/[^_]*.(md|mdx)' }),
	),
	schema: projectSchema,
});
