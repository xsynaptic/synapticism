import MiniSearch from 'minisearch';

import type { SearchCatalog, SearchEmoji } from '#emoji-picker/core/catalog-types.ts';

const fuzzyMinLength = 4;

// The tokenizer drops punctuation, so `:+1:` and `:)` never reach the index intact
function buildLookup(catalog: SearchCatalog) {
	const lookup = new Map(Object.entries(catalog.emoticons));

	for (const item of catalog.emoji) {
		for (const shortcode of item.shortcodes) {
			const key = `:${shortcode}:`;

			if (!lookup.has(key)) lookup.set(key, item.hexcode);
		}
	}

	return lookup;
}

function normalizeQuery(query: string) {
	return query.trim().toLowerCase().replaceAll(/\s+/g, ' ');
}

export function createEmojiSearch(catalog: SearchCatalog) {
	const order = new Map(catalog.emoji.map((item, index) => [item.hexcode, index]));
	const labels = new Map(catalog.emoji.map((item) => [item.hexcode, item.label]));
	const lookup = buildLookup(catalog);
	const index = new MiniSearch<SearchEmoji>({
		fields: ['label', 'keywords', 'shortcodes', 'community'],
		idField: 'hexcode',
		searchOptions: {
			boost: { community: 1, keywords: 3, label: 4, shortcodes: 2 },
			combineWith: 'AND',
			fuzzy: (term) => (term.length >= fuzzyMinLength ? 0.2 : false),
			prefix: true,
		},
	});

	index.addAll(catalog.emoji);

	function orderOf(hexcode: string) {
		return order.get(hexcode) ?? Infinity;
	}

	// Summed field scores let "fire engine" outrank 🔥 for "fire"; a label that is the query goes first
	function labelRank(hexcode: string, normalized: string) {
		return labels.get(hexcode) === normalized ? 0 : 1;
	}

	return function search(query: string): Array<string> {
		const trimmed = query.trim();

		if (trimmed === '') return [];

		// Emoticons are case-sensitive (`xD`, `:D`), shortcodes are not
		const exact = lookup.get(trimmed) ?? lookup.get(trimmed.toLowerCase());
		const normalized = normalizeQuery(trimmed);
		// Fuzzy runs only when nothing matches outright; one edit turns "robot" into "root"
		const strict = index.search(trimmed, { fuzzy: false });
		const matches = strict.length > 0 ? strict : index.search(trimmed);
		const ranked = matches
			.map((result) => ({ hexcode: String(result.id), score: result.score }))
			.sort(
				(first, second) =>
					labelRank(first.hexcode, normalized) - labelRank(second.hexcode, normalized) ||
					second.score - first.score ||
					orderOf(first.hexcode) - orderOf(second.hexcode),
			)
			.map((result) => result.hexcode);

		if (exact === undefined) return ranked;

		return [exact, ...ranked.filter((hexcode) => hexcode !== exact)];
	};
}
