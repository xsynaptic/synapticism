import type { IntBuffer } from '@thi.ng/pixel';

import type { RunRequest, RunResponse } from '#glitch-graph/engine/run-worker.ts';
import type { Graph } from '#glitch-graph/graph/graph-types.ts';

const pending = new Map<number, (response: RunResponse | undefined) => void>();

let nextId = 0;

// Created when the app chunk evaluates so the engine is loaded before the first Run
let worker: undefined | Worker = createWorker();

export async function runInWorker(graph: Graph, source: IntBuffer, seed: number) {
	const activeWorker = getWorker();
	const id = (nextId += 1);
	const response = await new Promise<RunResponse | undefined>((resolve) => {
		pending.set(id, resolve);
		activeWorker.postMessage({
			graph,
			id,
			seed,
			source: { data: source.data, height: source.height, width: source.width },
		} satisfies RunRequest);
	});

	if (response?.kind !== 'done') throw new Error('The run failed in the worker');

	return response;
}

// A crashed worker never answers, so its waiting runs fail and the next run starts a new one
function createWorker() {
	const created = new Worker(new URL('../engine/run-worker.ts', import.meta.url), {
		type: 'module',
	});

	created.addEventListener('message', (event: MessageEvent<RunResponse>) => {
		settle(event.data.id, event.data);
	});
	created.addEventListener('error', () => {
		created.terminate();
		worker = undefined;

		for (const id of pending.keys()) settle(id, undefined);
	});

	return created;
}

function getWorker() {
	if (worker !== undefined) return worker;

	worker = createWorker();

	return worker;
}

function settle(id: number, response: RunResponse | undefined) {
	pending.get(id)?.(response);
	pending.delete(id);
}
