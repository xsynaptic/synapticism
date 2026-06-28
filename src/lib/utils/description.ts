import { sanitizeHtml, stripTags } from '@xsynaptic/unified-tools';
import * as R from 'remeda';

import { MDX_COMPONENTS_TO_STRIP } from '#constants.ts';
import {
	renderMarkdownInline,
	stripFootnoteReferences,
	stripMdxComponents,
	textClipper,
} from '#lib/utils/text.ts';

interface DescriptionRendered {
	html: string;
	text: string;
}

// Word count fed into the parser, buffered so any orphan markdown syntax falls outside the final clip
const wordCountBuffer = 150;
const wordCountFinal = 100;

// Keep only inline emphasis in the display form; everything else collapses to plain text
const descriptionSchema = { tagNames: ['em', 'strong'] };

const cache = new Map<string, DescriptionRendered>();

interface DescriptionEntry {
	body?: string | undefined;
	data: { description?: string | undefined };
}

export function getDescriptionRenderedHtml(entry: DescriptionEntry): string | undefined {
	return getDescriptionRendered(entry)?.html;
}

export function getDescriptionRenderedText(entry: DescriptionEntry): string | undefined {
	return getDescriptionRendered(entry)?.text;
}

// Return the frontmatter description or derive a clipped excerpt from the body
function getDescription(
	entry: DescriptionEntry,
	options: { wordCount?: number } = {},
): string | undefined {
	if (entry.data.description) {
		return entry.data.description;
	}

	if (entry.body) {
		return R.pipe(
			entry.body,
			(body) => stripMdxComponents(body, MDX_COMPONENTS_TO_STRIP),
			stripFootnoteReferences,
			(text) => textClipper(text.trim(), { wordCount: options.wordCount ?? wordCountFinal }),
		);
	}

	return undefined;
}

// Render and cache both the HTML (display) and plain-text (SEO) forms in a single parse
function getDescriptionRendered(entry: DescriptionEntry): DescriptionRendered | undefined {
	const source = getDescription(entry, { wordCount: wordCountBuffer });

	if (!source) return undefined;

	const cached = cache.get(source);
	if (cached) return cached;

	const rawHtml = renderMarkdownInline(source);

	const html = sanitizeHtml(rawHtml, descriptionSchema);
	const stripped = stripTags(rawHtml).replaceAll(/\s+/g, ' ').trim();
	const text = textClipper(stripped, { wordCount: wordCountFinal });

	const rendered: DescriptionRendered = { html, text };

	cache.set(source, rendered);

	return rendered;
}
