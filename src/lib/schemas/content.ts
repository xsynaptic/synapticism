import { stylizeText } from '@xsynaptic/unified-tools';
import { z } from 'zod';

export const StylizedTextSchema = z.string().transform((value) => stylizeText(value).trim());

// Descriptions should meet basic SEO requirements
const DESCRIPTION_CHARACTER_LENGTH = 30;

// Markdown may be present so we don't further transform the value
export const DescriptionSchema = z
	.string()
	.min(DESCRIPTION_CHARACTER_LENGTH, {
		message: `Descriptions must be ${String(DESCRIPTION_CHARACTER_LENGTH)} or more characters long.`,
	})
	.transform((value) => value.trim());

export const DateStringSchema = z.string().transform((value) => new Date(value));

export const NumericScaleSchema = z.number().int().min(1).max(5);

export const contentBaseSchema = z.object({
	title: StylizedTextSchema,
	description: DescriptionSchema.optional(),
	dateCreated: DateStringSchema,
	dateUpdated: DateStringSchema.optional(),
	imageFeatured: z.string().optional(),
	imageHero: z.string().optional(),
	entryQuality: NumericScaleSchema,
});
