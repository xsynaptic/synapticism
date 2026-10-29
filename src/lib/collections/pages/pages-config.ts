import { glob } from 'astro/loaders';
import { defineCollection, reference } from 'astro:content';

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
	schema: contentBaseSchema
		.extend({
			tags: reference('tags').array().optional(),
			template: TemplateSchema.default('sidebar'),
		})
		.strict(),
});
