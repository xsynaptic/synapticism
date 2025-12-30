import { stylizeText } from '@xsynaptic/unified-tools';
import { z } from 'zod';

// Stylized text schema; apply SmartyPants to arbitrary strings
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

// Date schema
export const DateStringSchema = z.string().transform((value) => new Date(value));
