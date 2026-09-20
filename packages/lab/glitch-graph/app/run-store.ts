import type { IntBuffer } from '@thi.ng/pixel';

import { create } from 'zustand';

import type { RunInputs } from '#glitch-graph/app/run-staleness.ts';

import { decodeImage } from '#glitch-graph/app/frame-image.ts';
import { runInWorker } from '#glitch-graph/app/run-client.ts';
import { isStale } from '#glitch-graph/app/run-staleness.ts';
import { useGraphStore } from '#glitch-graph/graph/graph-store.ts';
import { getOutputs } from '#glitch-graph/graph/graph-utils.ts';

interface OutputResult {
	id: string;
	name: string;
	url: string;
}

interface RunState {
	clearResults: () => void;
	loadDefaultSource: (url: string) => Promise<void>;
	loadSource: (file: File) => Promise<void>;
	ranWith: RunInputs | undefined;
	results: Array<OutputResult>;
	runDuration: number | undefined;
	runError: string | undefined;
	runGraph: () => Promise<void>;
	source: IntBuffer | undefined;
	sourceError: string | undefined;
	status: 'idle' | 'loading' | 'running';
}

const supportedFormats = 'Try a PNG, JPEG, WebP or GIF.';

export const useRunStore = create<RunState>()((set, get) => ({
	clearResults: () => {
		for (const result of get().results) URL.revokeObjectURL(result.url);

		set({ ranWith: undefined, results: [], runDuration: undefined, runError: undefined });
	},
	loadDefaultSource: async (url) => {
		await decodeSource(
			() => fetchImage(url),
			'The default image did not load.',
			'Open an image to start.',
		);
	},
	loadSource: async (file) => {
		// An empty type means the browser does not know the extension, so let the decoder decide
		if (file.type !== '' && !file.type.startsWith('image/')) {
			set({ sourceError: `“${file.name}” is not an image. ${supportedFormats}` });

			return;
		}

		await decodeSource(
			() => Promise.resolve(file),
			`“${file.name}” could not be opened in this browser.`,
			supportedFormats,
		);
	},
	ranWith: undefined,
	results: [],
	runDuration: undefined,
	runError: undefined,
	runGraph: async () => {
		const { results: previous, source } = get();

		if (source === undefined) return;

		set({ runError: undefined, status: 'running' });

		try {
			const { graph, seed } = useGraphStore.getState();
			const { duration, images } = await runInWorker(graph, source, seed);
			const results = getOutputs(graph).flatMap(({ id, name }) => {
				const image = images.get(id);

				return image === undefined ? [] : [{ id, name, url: URL.createObjectURL(image) }];
			});

			for (const result of previous) URL.revokeObjectURL(result.url);

			set({ ranWith: { graph, seed, source }, results, runDuration: duration, status: 'idle' });
		} catch {
			set({ runError: 'The run failed. Run again, or Reset the graph.', status: 'idle' });
		}
	},
	source: undefined,
	sourceError: undefined,
	status: 'idle',
}));

export function useIsStale() {
	const ranWith = useRunStore((state) => state.ranWith);
	const source = useRunStore((state) => state.source);

	return useGraphStore(({ graph, seed }) => isStale(ranWith, { graph, seed, source }));
}

async function decodeSource(read: () => Promise<Blob>, failure: string, advice: string) {
	useRunStore.setState({ sourceError: undefined, status: 'loading' });

	try {
		useRunStore.setState({ source: await decodeImage(await read()), status: 'idle' });
	} catch {
		const kept =
			useRunStore.getState().source === undefined ? '' : ' The previous image is still loaded.';

		useRunStore.setState({ sourceError: `${failure}${kept} ${advice}`, status: 'idle' });
	}
}

async function fetchImage(url: string) {
	const response = await fetch(url);

	if (!response.ok) throw new Error(`Default image returned ${String(response.status)}`);

	return response.blob();
}
