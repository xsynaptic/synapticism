import { stripTags, transformMarkdown } from '@xsynaptic/unified-tools';
import * as R from 'remeda';

import { MDX_COMPONENTS_TO_STRIP } from '#constants.ts';

function textClipper(
	input: string,
	options: { wordCount: number; trailer?: string | undefined },
): string {
	const words = input.split(' ');

	if (words.length <= options.wordCount) {
		return input;
	}

	const trailer = options.trailer ?? '...';

	return words.slice(0, options.wordCount).join(' ') + trailer;
}

export function stripMdxComponents(input: string, componentNames: Array<string>): string {
	const regex = new RegExp(
		componentNames.map((name) => `<${name}(?:[^>.]*)>|</${name}>`).join('|'),
		'gm',
	);

	return input.replace(regex, '').trim();
}

export function formatNumber({
	number,
	locales,
	options,
}: {
	number: string | number;
	locales?: Intl.LocalesArgument | undefined;
	options?: Intl.NumberFormatOptions | undefined;
}) {
	return new Intl.NumberFormat(locales ?? 'en', options).format(Number(number));
}

function encodeHtmlEntities(input: string): string {
	return input
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('&', '&amp;')
		.replaceAll('"', '&quot;');
}

function stripFootnoteReferences(input: string) {
	return input.replaceAll(/\[\^[^\]]+\]/g, '');
}

export function sanitizeDescription(description: string | undefined) {
	return description
		? R.pipe(
				description,
				stripFootnoteReferences,
				(description) => stripMdxComponents(description, MDX_COMPONENTS_TO_STRIP),
				(description) => transformMarkdown({ input: description }),
				stripTags,
				(stripped) => textClipper(stripped, { wordCount: 100 }),
			)
		: undefined;
}

export function sanitizeAltAttribute(input: string): string {
	return encodeHtmlEntities(stripTags(input));
}

export function formatStringTemplate(
	template: string,
	values: Record<string, string | number> = {},
): string {
	return template.replaceAll(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}
