import type { IntBuffer } from '@thi.ng/pixel';

import { create } from 'zustand';

import type { Graph } from '../graph/graph-types.ts';

import { run } from '../engine/run.ts';
import { useGraphStore } from '../graph/graph-store.ts';
import { getModelOrder } from '../graph/graph-utils.ts';
import { decodeImage, frameToObjectUrl } from './frame-image.ts';

interface OutputResult {
	id: string;
	name: string;
	url: string;
}

interface RunInputs {
	graph: Graph;
	seed: number;
	source: IntBuffer;
}

interface RunState {
	error: string | undefined;
	loadSource: (blob: Blob) => Promise<void>;
	ranWith: RunInputs | undefined;
	results: Array<OutputResult>;
	runGraph: () => Promise<void>;
	source: IntBuffer | undefined;
	status: 'idle' | 'loading' | 'running';
}

export const useRunStore = create<RunState>()((set, get) => ({
	error: undefined,
	loadSource: async (blob) => {
		set({ error: undefined, status: 'loading' });

		try {
			set({ source: await decodeImage(blob), status: 'idle' });
		} catch {
			set({ error: 'That file could not be read as an image.', status: 'idle' });
		}
	},
	ranWith: undefined,
	results: [],
	runGraph: async () => {
		const { results: previous, source } = get();

		if (source === undefined) return;

		set({ error: undefined, status: 'running' });

		try {
			const { graph, seed } = useGraphStore.getState();
			const frames = await run(graph, source, seed);
			const outputs = getModelOrder(graph).flatMap((id) => {
				const frame = frames.get(id);
				const node = graph.nodes[id];

				return frame === undefined || node?.kind !== 'output'
					? []
					: [{ frame, id, name: node.name }];
			});
			const results = await Promise.all(
				outputs.map(async ({ frame, id, name }) => ({
					id,
					name,
					url: await frameToObjectUrl(frame),
				})),
			);

			for (const result of previous) URL.revokeObjectURL(result.url);

			set({ ranWith: { graph, seed, source }, results, status: 'idle' });
		} catch {
			set({ error: 'The run failed.', status: 'idle' });
		}
	},
	source: undefined,
	status: 'idle',
}));

export function useIsStale() {
	const ranWith = useRunStore((state) => state.ranWith);
	const source = useRunStore((state) => state.source);
	const graph = useGraphStore((state) => state.graph);
	const seed = useGraphStore((state) => state.seed);

	if (ranWith === undefined) return false;

	return ranWith.graph !== graph || ranWith.seed !== seed || ranWith.source !== source;
}
