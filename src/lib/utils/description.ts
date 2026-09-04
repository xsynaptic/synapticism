import type Keyv from 'keyv';

import { sanitizeHtml, stripTags } from '@xsynaptic/unified-tools';
import * as R from 'remeda';

import { mdxComponentsToStrip } from '#constants.ts';
import { hash } from '#lib/utils/cache.ts';
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

interface DescriptionCached extends DescriptionRendered {
	hash: string;
}

interface DescriptionRendered {
	html: string;
	text: string;
}

// Word count fed into the parser, buffered so any orphan markdown syntax falls outside the final clip
const wordCountBuffer = 150;
const wordCountFinal = 100;

// Keep only inline emphasis in the display form; everything else collapses to plain text
const descriptionSchema = { tagNames: ['em', 'strong'] };

export function createDescriptionRenderers({ cache }: { cache: Keyv }) {
	// Render and cache both the HTML (display) and plain-text (SEO) forms in a single parse
	async function getDescriptionRendered(
		entry: DescriptionEntry,
	): Promise<DescriptionRendered | undefined> {
		const source = getDescription(entry, { wordCount: wordCountBuffer });

		if (!source) return undefined;

		// Key by entry ID so edits overwrite the old row; the hash validates cached content
		// MDX component names participate so render-affecting code changes self-invalidate
		const sourceHash = hash({ mdxComponentsToStrip, source, version: 1 });

		const cached = await cache.get<DescriptionCached>(entry.id);

		if (cached?.hash === sourceHash) return { html: cached.html, text: cached.text };

		const rawHtml = renderMarkdownInline(source);

		const html = sanitizeHtml(rawHtml, descriptionSchema);
		const stripped = stripTags(rawHtml).replaceAll(/\s+/g, ' ').trim();
		const text = textClipper(stripped, { wordCount: wordCountFinal });

		const rendered: DescriptionRendered = { html, text };

		await cache.set(entry.id, { hash: sourceHash, ...rendered } satisfies DescriptionCached);

		return rendered;
	}

	async function getDescriptionRenderedHtml(entry: DescriptionEntry): Promise<string | undefined> {
		const rendered = await getDescriptionRendered(entry);

		return rendered?.html;
	}

	async function getDescriptionRenderedText(entry: DescriptionEntry): Promise<string | undefined> {
		const rendered = await getDescriptionRendered(entry);

		return rendered?.text;
	}

	return { getDescriptionRendered, getDescriptionRenderedHtml, getDescriptionRenderedText };
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
			(body) => stripMdxComponents(body, mdxComponentsToStrip),
			stripFootnoteReferences,
			(text) => textClipper(text.trim(), { wordCount: options.wordCount ?? wordCountFinal }),
		);
	}

	return undefined;
}
