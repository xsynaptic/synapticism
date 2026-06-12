import { stripTags } from '@xsynaptic/unified-tools';
import * as R from 'remeda';

import { MDX_COMPONENTS_TO_STRIP } from '#constants.ts';
import { renderMarkdownInline } from '#lib/utils/markdown.ts';

export function formatNumber({
	locales,
	number,
	options,
}: {
	locales?: Intl.LocalesArgument | undefined;
	number: number | string;
	options?: Intl.NumberFormatOptions | undefined;
}) {
	return new Intl.NumberFormat(locales ?? 'en', options).format(Number(number));
}

export function formatStringTemplate(
	template: string,
	values: Record<string, number | string> = {},
): string {
	return template.replaceAll(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

export function getEntryDescription(entry: {
	body?: string | undefined;
	data: { description?: string | undefined };
}): string | undefined {
	return entry.data.description ?? sanitizeDescription(entry.body);
}

export function getSourceDomain(url: string): string {
	return new URL(url).hostname.replace(/^www\./, '');
}

// Typographic refinement for short text: smart quotes, en/em dashes, ellipses
// This negates the need for a full-blown unified pipeline for titles and such
export function refineTypography(input: string): string {
	let value = input;
	// Dashes: --- to em, -- to en (longest first)
	value = value.replaceAll('---', '—').replaceAll('--', '–');
	value = value.replaceAll('...', '…');
	// Double quotes: opening after start/space/bracket/dash, otherwise closing
	value = value.replaceAll(/(^|[\s([{<–—])"/g, '$1“').replaceAll('"', '”');
	// Single quotes: opening in the same positions, otherwise apostrophe or closing
	value = value.replaceAll(/(^|[\s([{<–—])'/g, '$1‘').replaceAll("'", '’');
	return value;
}

export function sanitizeAltAttribute(input: string): string {
	return encodeHtmlEntities(stripTags(input));
}

export function sanitizeDescription(description: string | undefined) {
	return description
		? R.pipe(
				description,
				stripFootnoteReferences,
				(description) => stripMdxComponents(description, MDX_COMPONENTS_TO_STRIP),
				renderMarkdownInline,
				stripTags,
				(stripped) => textClipper(stripped, { wordCount: 100 }),
			)
		: undefined;
}

export function stripMdxComponents(input: string, componentNames: Array<string>): string {
	const regex = new RegExp(
		componentNames.map((name) => `<${name}(?:[^>.]*)>|</${name}>`).join('|'),
		'gm',
	);

	return input.replace(regex, '').trim();
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

function textClipper(
	input: string,
	options: { trailer?: string | undefined; wordCount: number },
): string {
	const words = input.split(' ');

	if (words.length <= options.wordCount) {
		return input;
	}

	const trailer = options.trailer ?? '...';

	return words.slice(0, options.wordCount).join(' ') + trailer;
}
