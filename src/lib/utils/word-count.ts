import type { CollectionEntry, CollectionKey } from 'astro:content';

import { stripTags } from '@xsynaptic/unified-tools';
import { countWords } from '@xsynaptic/word-count';
import { CUSTOM_CACHE_PATH } from 'astro:env/server';
import * as R from 'remeda';

import { mdxComponentsToStrip } from '#constants.ts';
import { getSqliteCacheInstance, hash } from '#lib/utils/cache.ts';
import { renderMarkdownInline, stripMdxComponents } from '#lib/utils/text.ts';

const cacheInstance = getSqliteCacheInstance(CUSTOM_CACHE_PATH, 'word-counts');

function computeWordCount(body: string): number {
	return R.pipe(
		body,
		(body) => stripMdxComponents(body, mdxComponentsToStrip),
		renderMarkdownInline,
		stripTags,
		countWords,
	);
}

// Bump when the counting pipeline changes to invalidate stale cached counts
const cacheVersion = 1;

export async function getWordCount(
	entry: CollectionEntry<CollectionKey>,
): Promise<number | undefined> {
	const description = 'description' in entry.data ? entry.data.description : undefined;

	const hashValue = hash({
		body: entry.body,
		description,
		id: entry.id,
		version: cacheVersion,
	});

	const cachedCount = await cacheInstance.get<number>(hashValue);

	if (cachedCount !== undefined) {
		return cachedCount;
	}

	let wordCount: number | undefined;

	if (entry.body && entry.body.length > 0) {
		wordCount = computeWordCount(entry.body);
	} else if (description && description.length > 0) {
		wordCount = computeWordCount(description);
	}

	if (wordCount !== undefined) {
		await cacheInstance.set(hashValue, wordCount);
	}

	return wordCount;
}
