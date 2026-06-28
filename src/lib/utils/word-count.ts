import type { CollectionEntry, CollectionKey } from 'astro:content';

import { stripTags } from '@xsynaptic/unified-tools';
import * as R from 'remeda';

import { MDX_COMPONENTS_TO_STRIP } from '#constants.ts';
import { renderMarkdownInline } from '#lib/utils/text.ts';
import { stripMdxComponents } from '#lib/utils/text.ts';

export function getWordCount(entry: CollectionEntry<CollectionKey>): number | undefined {
	if (entry.body && entry.body.length > 0) {
		return computeWordCount(entry.body);
	}

	if (
		'description' in entry.data &&
		typeof entry.data.description === 'string' &&
		entry.data.description.length > 0
	) {
		return computeWordCount(entry.data.description);
	}

	return undefined;
}

function computeWordCount(body: string): number {
	return R.pipe(
		body,
		(body) => stripMdxComponents(body, MDX_COMPONENTS_TO_STRIP),
		renderMarkdownInline,
		stripTags,
		(text) => text.split(/\s+/).filter(Boolean).length,
	);
}
