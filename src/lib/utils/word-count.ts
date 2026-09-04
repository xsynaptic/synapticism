import type { CollectionEntry, CollectionKey } from 'astro:content';
import type Keyv from 'keyv';

import { stripTags } from '@xsynaptic/unified-tools';
import { countWords } from '@xsynaptic/word-count';
import * as R from 'remeda';

import { mdxComponentsToStrip } from '#constants.ts';
import { hash } from '#lib/utils/cache.ts';
import { renderMarkdownInline, stripMdxComponents } from '#lib/utils/text.ts';

interface WordCountCached {
	count: number;
	hash: string;
}

export function createWordCountFunction({ cache }: { cache: Keyv }) {
	return async function getWordCount(entry: CollectionEntry<CollectionKey>): Promise<number> {
		const description = getDescription(entry);

		// Key by entry ID so edits overwrite the old row; the hash validates cached content
		// MDX component names participate so render-affecting code changes self-invalidate
		const contentHash = hash({
			body: entry.body,
			description,
			mdxComponentsToStrip,
			version: 1,
		});

		const cached = await cache.get<WordCountCached>(entry.id);

		if (cached?.hash === contentHash) {
			return cached.count;
		}

		const source = entry.body || description;
		const wordCount = source ? computeWordCount(source) : 0;

		await cache.set(entry.id, {
			count: wordCount,
			hash: contentHash,
		} satisfies WordCountCached);

		return wordCount;
	};
}

function computeWordCount(body: string): number {
	return R.pipe(
		body,
		(body) => stripMdxComponents(body, mdxComponentsToStrip),
		renderMarkdownInline,
		stripTags,
		countWords,
	);
}

// `''` rather than `undefined` for a missing field, so cached content hashes stay stable
function getDescription(entry: CollectionEntry<CollectionKey>): string | undefined {
	return 'description' in entry.data ? entry.data.description : '';
}
