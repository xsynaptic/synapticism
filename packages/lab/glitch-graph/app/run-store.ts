import type { IntBuffer } from '@thi.ng/pixel';

import { create } from 'zustand';

import { run } from '../engine/run.ts';
import { useGraphStore } from '../graph/graph-store.ts';
import { getModelOrder } from '../graph/graph-utils.ts';
import { decodeImage, frameToObjectUrl } from './frame-image.ts';

interface OutputResult {
	id: string;
	url: string;
}

interface RunState {
	error: string | undefined;
	loadSource: (blob: Blob) => Promise<void>;
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

				return frame === undefined ? [] : [{ frame, id }];
			});
			const results = await Promise.all(
				outputs.map(async ({ frame, id }) => ({ id, url: await frameToObjectUrl(frame) })),
			);

			for (const result of previous) URL.revokeObjectURL(result.url);

			set({ results, status: 'idle' });
		} catch {
			set({ error: 'The run failed.', status: 'idle' });
		}
	},
	source: undefined,
	status: 'idle',
}));
