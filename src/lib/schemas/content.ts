import { reference } from 'astro:content';
import { z } from 'zod';

import { ImageFeaturedSchema } from '#lib/schemas/image-featured.ts';
import { parseFrontmatterDate } from '#lib/utils/date.ts';
import { refineTypography } from '#lib/utils/text.ts';

export const StylizedTextSchema = z.string().transform((value) => refineTypography(value).trim());

// Descriptions should meet basic SEO requirements
const descriptionCharacterLength = 30;

// Markdown may be present so we don't further transform the value
const DescriptionSchema = z
	.string()
	.min(descriptionCharacterLength, {
		message: `Descriptions must be ${String(descriptionCharacterLength)} or more characters long.`,
	})
	.transform((value) => value.trim());

// Dates are authored in ISO 8601, ideally with a full time (e.g. 2026-06-08T14:30:00Z)
// A bare date or a missing time is allowed; the display falls back to a calendar date in that case
export const DateStringSchema = z
	.union([z.date(), z.string()])
	.refine(
		(value) =>
			!Number.isNaN((value instanceof Date ? value : parseFrontmatterDate(value)).getTime()),
		{ message: 'Invalid date. Use ISO 8601, for example 2026-06-08 or 2026-06-08T14:30:00Z.' },
	)
	.transform((value) => (value instanceof Date ? value : parseFrontmatterDate(value)));

export const contentBaseSchema = z.object({
	dateCreated: DateStringSchema,
	dateUpdated: DateStringSchema.optional(),
	description: DescriptionSchema.optional(),
	imageFeatured: ImageFeaturedSchema.optional(),
	title: StylizedTextSchema,
});

export const articleSchema = contentBaseSchema
	.extend({
		projects: reference('projects').array().optional(),
		tags: reference('tags').array().optional(),
	})
	.strict();
