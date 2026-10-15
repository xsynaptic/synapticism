import type { IntBuffer } from '@thi.ng/pixel';

import { create } from 'zustand';

import type { TriggerState } from '#glitch-graph/app/run-trigger.ts';
import type { Graph } from '#glitch-graph/graph/graph-types.ts';

import { decodeImage, defaultResolution } from '#glitch-graph/app/frame-image.ts';
import { runInWorker } from '#glitch-graph/app/run-client.ts';
import { createRunQueue } from '#glitch-graph/app/run-queue.ts';
import { shouldRerun } from '#glitch-graph/app/run-trigger.ts';
import { useGraphStore } from '#glitch-graph/graph/graph-store.ts';
import { getOutputs } from '#glitch-graph/graph/graph-utils.ts';

interface OutputResult {
	id: string;
	name: string;
	url: string;
}

interface RunState {
	isRendering: boolean;
	loadDefaultSource: (url: string) => Promise<void>;
	loadSource: (file: File) => Promise<void>;
	resolution: number;
	results: Array<OutputResult>;
	runDuration: number | undefined;
	runError: string | undefined;
	selectedId: string | undefined;
	selectOutput: (id: string) => void;
	setResolution: (resolution: number) => void;
	source: IntBuffer | undefined;
	sourceBlob: Blob | undefined;
	sourceError: string | undefined;
	sourceName: string | undefined;
	sourceUrl: string | undefined;
}

interface SourceRequest {
	advice: string;
	failure: string;
	name: string;
	read: () => Promise<Blob>;
}

// Node ids are `n` plus a counter, so this can never be one
export const originalId = 'original';

const supportedFormats = 'Try a PNG, JPEG, WebP or GIF.';

// A slower decode started earlier must not land over the resolution the visitor settled on
let decodeSequence = 0;

const requestRun = createRunQueue(performRun, (isRendering) => {
	useRunStore.setState({ isRendering });
});

export const useRunStore = create<RunState>()((set, get) => {
	// `unicorn/no-top-level-side-effects` puts the graph subscription here rather than beside the store
	useGraphStore.subscribe(handleGraphChange);

	return {
		isRendering: false,
		loadDefaultSource: async (url) => {
			await decodeSource({
				advice: 'Open an image to start.',
				failure: 'The default image did not load.',
				name: 'Default image',
				read: () => fetchImage(url),
			});
		},
		loadSource: loadSourceFile,
		resolution: defaultResolution,
		results: [],
		runDuration: undefined,
		runError: undefined,
		selectedId: undefined,
		selectOutput: (id) => {
			set({ selectedId: id });
		},
		setResolution: (resolution) => {
			const { sourceBlob, sourceName } = get();

			set({ resolution });

			if (sourceBlob === undefined || sourceName === undefined) return;

			void decodeSource({
				advice: 'Try a smaller one.',
				failure: 'The image could not be read at that resolution.',
				name: sourceName,
				read: () => Promise.resolve(sourceBlob),
			});
		},
		source: undefined,
		sourceBlob: undefined,
		sourceError: undefined,
		sourceName: undefined,
		sourceUrl: undefined,
	};
});

// The first Output stands in until one is picked, and again once the picked one is deleted
export function getShownId({ results, selectedId }: Pick<RunState, 'results' | 'selectedId'>) {
	if (selectedId === originalId) return originalId;

	return (results.find(({ id }) => id === selectedId) ?? results[0])?.id;
}

export function useIsShown(id: string) {
	return useRunStore((state) => getShownId(state) === id);
}

async function decodeSource({ advice, failure, name, read }: SourceRequest) {
	const sequence = (decodeSequence += 1);

	useRunStore.setState({ sourceError: undefined });

	try {
		const blob = await read();
		const { frame, image } = await decodeImage(blob, useRunStore.getState().resolution);
		const url = URL.createObjectURL(image);

		if (sequence !== decodeSequence) {
			URL.revokeObjectURL(url);

			return;
		}

		revokeSourceUrl();
		useRunStore.setState({
			source: frame,
			sourceBlob: blob,
			sourceName: name,
			sourceUrl: url,
		});
		requestRun();
	} catch {
		if (sequence !== decodeSequence) return;

		const kept =
			useRunStore.getState().source === undefined ? '' : ' The previous image is still loaded.';

		useRunStore.setState({ sourceError: `${failure}${kept} ${advice}` });
	}
}

async function fetchImage(url: string) {
	const response = await fetch(url);

	if (!response.ok) throw new Error(`Default image returned ${String(response.status)}`);

	return response.blob();
}

function handleGraphChange(next: TriggerState, previous: TriggerState) {
	if (shouldRerun(previous, next)) {
		requestRun();

		return;
	}

	// A rename renders nothing new, so only the names move
	if (next.graph !== previous.graph) {
		useRunStore.setState(({ results }) => ({ results: withNames(results, next.graph) }));
	}
}

async function loadSourceFile(file: File) {
	// An empty type means the browser does not know the extension, so let the decoder decide
	if (file.type !== '' && !file.type.startsWith('image/')) {
		useRunStore.setState({ sourceError: `“${file.name}” is not an image. ${supportedFormats}` });

		return;
	}

	await decodeSource({
		advice: supportedFormats,
		failure: `“${file.name}” could not be opened in this browser.`,
		name: file.name,
		read: () => Promise.resolve(file),
	});
}

async function performRun() {
	const { results: previous, source } = useRunStore.getState();

	if (source === undefined) return;

	useRunStore.setState({ runError: undefined });

	try {
		const { graph, seed } = useGraphStore.getState();
		const { duration, images } = await runInWorker({ graph, seed, source });
		// Looks reuse ids, so a rename made meanwhile only carries over while the structure is the one rendered
		const current = useGraphStore.getState().graph;

		for (const result of previous) URL.revokeObjectURL(result.url);

		useRunStore.setState({
			results: toResults(current.edges === graph.edges ? current : graph, images),
			runDuration: duration,
		});
	} catch {
		useRunStore.setState({ runError: 'This graph could not be rendered. Undo the last change.' });
	}
}

function revokeSourceUrl() {
	const { sourceUrl } = useRunStore.getState();

	if (sourceUrl !== undefined) URL.revokeObjectURL(sourceUrl);
}

function toResults(graph: Graph, images: Map<string, Blob>) {
	return getOutputs(graph).flatMap(({ id, name }) => {
		const image = images.get(id);

		return image === undefined ? [] : [{ id, name, url: URL.createObjectURL(image) }];
	});
}

function withNames(results: Array<OutputResult>, graph: Graph) {
	return results.map((result) => {
		const node = graph.nodes[result.id];

		return node?.kind === 'output' && node.name !== result.name
			? { ...result, name: node.name }
			: result;
	});
}
