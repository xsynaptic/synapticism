import type { SearchCatalog, SearchEmoji } from '#emoji-picker/core/catalog-types.ts';
import type { SupportProbe } from '#emoji-picker/core/support-probes.ts';

import { highestSupportedVersion } from '#emoji-picker/client/support-probe.ts';
import { createEmojiSearch } from '#emoji-picker/core/search.ts';
import searchDataUrl from '#emoji-picker/data/search-en.json?url';

export type SearchRequest =
	| { fontFamily: string; id: number; kind: 'probe'; probes: Array<SupportProbe> }
	| { hexcode: string; id: number; kind: 'entry' }
	| { id: number; kind: 'search'; query: string };

export type SearchResponse =
	| { entry: SearchEmoji | undefined; id: number; kind: 'entry' }
	| { hexcodes: Array<string>; id: number; kind: 'search' }
	| { id: number; kind: 'probe'; version: number }
	| { kind: 'ready' }
	| { kind: 'unavailable' };

async function load() {
	const response = await fetch(searchDataUrl);

	if (!response.ok) throw new Error(`Search data answered ${String(response.status)}`);

	const catalog = (await response.json()) as SearchCatalog;

	return {
		entries: new Map(catalog.emoji.map((item) => [item.hexcode, item])),
		search: createEmojiSearch(catalog),
	};
}

function post(response: SearchResponse) {
	globalThis.postMessage(response);
}

globalThis.addEventListener('message', (event: MessageEvent<SearchRequest>) => {
	void respond(event.data);
});

// The index takes over 100 ms to build on a throttled mid-range profile, so it never runs on the main thread
const ready = load();

// The probe needs no index, so it answers while the search data is still in flight
async function respond(request: SearchRequest) {
	if (request.kind === 'probe') {
		post({
			id: request.id,
			kind: 'probe',
			version: highestSupportedVersion(request.probes, request.fontFamily),
		});
		return;
	}

	const index = await ready;

	if (request.kind === 'entry') {
		post({ entry: index.entries.get(request.hexcode), id: request.id, kind: 'entry' });
		return;
	}

	post({ hexcodes: index.search(request.query), id: request.id, kind: 'search' });
}

try {
	await ready;
	post({ kind: 'ready' });
} catch {
	post({ kind: 'unavailable' });
}
