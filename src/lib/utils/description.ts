import type { Cache } from '@synapticism/shared/cache';

import { sanitizeHtml, stripTags } from '@xsynaptic/unified-tools';
import { hash } from 'ohash';
import * as R from 'remeda';

import { mdxComponents } from '#constants.ts';
import {
	renderMarkdownInline,
	stripFootnoteReferences,
	stripMdxComponents,
	textClipper,
} from '#lib/utils/text.ts';

export interface DescriptionEntry {
	body?: string | undefined;
	data: { description?: string | undefined };
	id: string;
}

export interface DescriptionRendered {
	html: string;
	text: string;
}

const wordCount = 100;

// Keep only inline emphasis in the display form; everything else collapses to plain text
const descriptionSchema = { tagNames: ['em', 'strong'] };

export function createDescriptionRenderers({ cache }: { cache: Cache<DescriptionRendered> }) {
	// Render and cache both the HTML (display) and plain-text (SEO) forms in a single parse
	function getDescriptionRendered(entry: DescriptionEntry): DescriptionRendered | undefined {
		const source = getDescription(entry);

		if (!source) return undefined;

		// Key by entry ID so edits overwrite the old row; the hash validates cached content
		// MDX component names participate so render-affecting code changes self-invalidate
		const sourceHash = hash({ mdxComponents, source, version: 2 });

		const cached = cache.get(entry.id, sourceHash);

		if (cached) return cached;

		const rawHtml = renderMarkdownInline(source);

		const html = sanitizeHtml(rawHtml, descriptionSchema);
		const text = stripTags(rawHtml).replaceAll(/\s+/g, ' ').trim();

		const rendered: DescriptionRendered = { html, text };

		cache.set(entry.id, sourceHash, rendered);

		return rendered;
	}

	function getDescriptionRenderedHtml(entry: DescriptionEntry) {
		return getDescriptionRendered(entry)?.html;
	}

	function getDescriptionRenderedText(entry: DescriptionEntry) {
		return getDescriptionRendered(entry)?.text;
	}

	return { getDescriptionRendered, getDescriptionRenderedHtml, getDescriptionRenderedText };
}

// Return the frontmatter description or derive a clipped excerpt from the body
function getDescription(entry: DescriptionEntry): string | undefined {
	if (entry.data.description) {
		return entry.data.description;
	}

	if (entry.body) {
		return R.pipe(
			entry.body,
			(body) => stripMdxComponents(body, mdxComponents),
			stripFootnoteReferences,
			(text) => textClipper(text.trim(), { wordCount }),
		);
	}

	return undefined;
}
