import { stripTags } from '@xsynaptic/unified-tools';
import { markdownToHtml } from 'satteri';

// Locale-independent word segmentation; split(' ') counts space-free scripts (CJK, Thai) as one word
const wordSegmenter = new Intl.Segmenter(undefined, { granularity: 'word' });

/** @knipignore staged for the launch design; no view formats counts yet */
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

export function stripFootnoteReferences(input: string) {
	return input.replaceAll(/\[\^[^\]]+\]/g, '');
}

// Strip rendered footnotes from HTML: the `sup` back-references and the trailing footnotes section
export function stripFootnotes(input: string): string {
	let result = input.replaceAll(/<sup><a[^>]*data-footnote-ref[^>]*>.*?<\/a><\/sup>/gi, '');

	result = result.replaceAll(/<section[^>]*data-footnotes[^>]*>.*?<\/section>/gis, '');

	return result;
}

// Lookahead on the opening tag prevents prefix collisions; "Img" would otherwise match "<ImgGroup>"
export function stripMdxComponents(input: string, componentNames: Array<string>): string {
	const regex = new RegExp(
		componentNames.map((name) => String.raw`<${name}(?=[\s/>])[^>]*>|</${name}>`).join('|'),
		'gm',
	);

	return input.replace(regex, '').trim();
}

export function textClipper(
	input: string,
	options: { trailer?: string | undefined; wordCount: number },
): string {
	let wordIndex = 0;

	for (const segment of wordSegmenter.segment(input)) {
		if (!segment.isWordLike) continue;

		if (wordIndex === options.wordCount) {
			return input.slice(0, segment.index).trimEnd() + (options.trailer ?? '...');
		}

		wordIndex += 1;
	}

	return input;
}

function encodeHtmlEntities(input: string): string {
	return input
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('&', '&amp;')
		.replaceAll('"', '&quot;');
}

// Render a short markdown string (descriptions, notices, teasers) to inline HTML
// Stripping or sanitizing is left to callers that need it
const markdownCache = new Map<string, string>();

export function renderMarkdownInline(input: string): string {
	const cached = markdownCache.get(input);
	if (cached !== undefined) return cached;

	const { html } = markdownToHtml(input, {
		features: { smartPunctuation: true },
	});
	const result = html.trim();

	markdownCache.set(input, result);
	return result;
}
