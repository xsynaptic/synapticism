import type { Cache } from '@synapticism/shared/cache';
import type { CollectionEntry, CollectionKey } from 'astro:content';

import { stripTags } from '@xsynaptic/unified-tools';
import { countWords } from '@xsynaptic/word-count';
import { hash } from 'ohash';
import * as R from 'remeda';

import { mdxComponents } from '#constants.ts';
import { renderMarkdownInline, stripMdxComponents } from '#lib/utils/text.ts';

export function createWordCountFunction({ cache }: { cache: Cache<number> }) {
	return function getWordCount(entry: CollectionEntry<CollectionKey>) {
		const description = getDescription(entry);

		// Key by entry ID so edits overwrite the old row; the hash validates cached content
		// MDX component names participate so render-affecting code changes self-invalidate
		const contentHash = hash({
			body: entry.body,
			description,
			mdxComponents,
			version: 1,
		});

		const cached = cache.get(entry.id, contentHash);

		if (cached !== undefined) return cached;

		const source = entry.body || description;
		const wordCount = source ? computeWordCount(source) : 0;

		cache.set(entry.id, contentHash, wordCount);

		return wordCount;
	};
}

function computeWordCount(body: string): number {
	return R.pipe(
		body,
		(body) => stripMdxComponents(body, mdxComponents),
		renderMarkdownInline,
		stripTags,
		countWords,
	);
}

// `''` rather than `undefined` for a missing field, so cached content hashes stay stable
function getDescription(entry: CollectionEntry<CollectionKey>): string | undefined {
	return 'description' in entry.data ? entry.data.description : '';
}
