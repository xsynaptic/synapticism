import type { SearchRequest, SearchResponse } from '#emoji-picker/client/search-worker.ts';
import type { SearchEmoji } from '#emoji-picker/core/catalog-types.ts';
import type { SupportProbe } from '#emoji-picker/core/support-probes.ts';

type Answer = Extract<SearchResponse, { id: number }>;

const pending = new Map<number, (answer: Answer | undefined) => void>();

const entryCache = new Map<string, SearchEmoji | undefined>();

let nextId = 0;
let ready: Promise<boolean> | undefined;
let isReady = false;
let worker: undefined | Worker;

function settle(id: number, answer: Answer | undefined) {
	pending.get(id)?.(answer);
	pending.delete(id);
}

function discardWorker() {
	worker?.terminate();
	worker = undefined;
	ready = undefined;
	isReady = false;

	for (const id of pending.keys()) settle(id, undefined);
}

// Module state outlives ClientRouter navigation, so the index builds once per page load
// Settles false rather than rejecting, so the probe can start the worker without awaiting it
function startWorker() {
	const created = new Worker(new URL('search-worker.ts', import.meta.url), { type: 'module' });

	worker = created;
	performance.mark('emoji-picker-search-start');

	return new Promise<boolean>((resolve) => {
		created.addEventListener('message', (event: MessageEvent<SearchResponse>) => {
			const response = event.data;

			if (response.kind === 'ready') {
				isReady = true;
				performance.measure('emoji-picker-search-ready', 'emoji-picker-search-start');
				resolve(true);
				return;
			}

			if (response.kind === 'unavailable') {
				discardWorker();
				resolve(false);
				return;
			}

			settle(response.id, response);
		});
		created.addEventListener('error', () => {
			discardWorker();
			resolve(false);
		});
	});
}

async function send(build: (id: number) => SearchRequest) {
	if (!worker) return;

	const target = worker;
	const id = (nextId += 1);

	return new Promise<Answer | undefined>((resolve) => {
		pending.set(id, resolve);
		target.postMessage(build(id));
	});
}

async function ask(build: (id: number) => SearchRequest) {
	if (!(await ensureSearch())) return;

	return send(build);
}

export async function ensureSearch() {
	if (!ready) ready = startWorker();

	return ready;
}

export function isSearchReady() {
	return isReady;
}

// Infinity when the worker dies first, so nothing dims on a guess
export async function probeSupportedVersion(probes: Array<SupportProbe>, fontFamily: string) {
	void ensureSearch();

	const answer = await send((id) => ({ fontFamily, id, kind: 'probe', probes }));

	return answer?.kind === 'probe' ? answer.version : Infinity;
}

export async function searchEmoji(query: string) {
	const answer = await ask((id) => ({ id, kind: 'search', query }));

	return answer?.kind === 'search' ? answer.hexcodes : [];
}

export async function lookupEntry(hexcode: string) {
	if (entryCache.has(hexcode)) return entryCache.get(hexcode);

	const answer = await ask((id) => ({ hexcode, id, kind: 'entry' }));
	const entry = answer?.kind === 'entry' ? answer.entry : undefined;

	entryCache.set(hexcode, entry);

	return entry;
}
