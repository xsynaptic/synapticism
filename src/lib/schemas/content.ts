import { z } from 'zod';

import { parseFrontmatterDate } from '#lib/utils/date.ts';
import { refineTypography } from '#lib/utils/text.ts';

export const StylizedTextSchema = z.string().transform((value) => refineTypography(value).trim());

// Descriptions should meet basic SEO requirements
const DESCRIPTION_CHARACTER_LENGTH = 30;

// Markdown may be present so we don't further transform the value
const DescriptionSchema = z
	.string()
	.min(DESCRIPTION_CHARACTER_LENGTH, {
		message: `Descriptions must be ${String(DESCRIPTION_CHARACTER_LENGTH)} or more characters long.`,
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

const NumericScaleSchema = z.number().int().min(1).max(5);

// An external link: the thing a note points to
export const LinkItemSchema = z.object({
	title: z.string(),
	url: z.url(),
});

// Where a note was found; URL optional so a name-only credit works
export const SourceSchema = z.object({
	title: z.string(),
	url: z.url().optional(),
});

export const contentBaseSchema = z.object({
	dateCreated: DateStringSchema,
	dateUpdated: DateStringSchema.optional(),
	description: DescriptionSchema.optional(),
	entryQuality: NumericScaleSchema,
	imageAlt: z.string().optional(),
	imageFeatured: z.string().optional(),
	imageHero: z.string().optional(),
	title: StylizedTextSchema,
});
