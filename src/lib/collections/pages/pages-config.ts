import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';

import { contentCollectionsPath } from '#constants.ts';
import { withSitemapLastmod } from '#lib/collections/collections-sitemap.ts';
import { contentBaseSchema, TemplateSchema } from '#lib/schemas/content.ts';
import { generateFlatId } from '#lib/utils/collections.ts';

export const pages = defineCollection({
	loader: withSitemapLastmod(
		'pages',
		glob({
			base: `${contentCollectionsPath}/pages`,
			generateId: generateFlatId,
			pattern: '**/[^_]*.(md|mdx)',
		}),
	),
	schema: contentBaseSchema.extend({ template: TemplateSchema.default('sidebar') }).strict(),
});
