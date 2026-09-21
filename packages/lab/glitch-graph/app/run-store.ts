import type { IntBuffer } from '@thi.ng/pixel';

import { create } from 'zustand';

import type { RunInputs } from '#glitch-graph/app/run-staleness.ts';
import type { RunQuality, TriggerState } from '#glitch-graph/app/run-trigger.ts';
import type { Graph } from '#glitch-graph/graph/graph-types.ts';

import { decodeImage } from '#glitch-graph/app/frame-image.ts';
import { runInWorker } from '#glitch-graph/app/run-client.ts';
import { createRunQueue } from '#glitch-graph/app/run-queue.ts';
import { isStale } from '#glitch-graph/app/run-staleness.ts';
import { getRunQuality } from '#glitch-graph/app/run-trigger.ts';
import { useGraphStore } from '#glitch-graph/graph/graph-store.ts';
import { getOutputs } from '#glitch-graph/graph/graph-utils.ts';

interface OutputResult {
	id: string;
	name: string;
	url: string;
}

interface RunState {
	clearResults: () => void;
	isLive: boolean;
	isRendering: boolean;
	loadDefaultSource: (url: string) => Promise<void>;
	loadSource: (file: File) => Promise<void>;
	previewSource: IntBuffer | undefined;
	ranWith: RunInputs | undefined;
	results: Array<OutputResult>;
	runDuration: number | undefined;
	runError: string | undefined;
	runGraph: () => void;
	setLive: (isLive: boolean) => void;
	source: IntBuffer | undefined;
	sourceError: string | undefined;
	stage: StageView | undefined;
	status: 'idle' | 'loading' | 'running';
}

type StageView =
	| { kind: 'failed'; name: string }
	| { kind: 'ready'; name: string; url: string }
	| { kind: 'rendering'; name: string };

const supportedFormats = 'Try a PNG, JPEG, WebP or GIF.';

// Closing or opening another stage invalidates a run still in flight, which would otherwise reopen the dialog
let stageSequence = 0;

const requestRun = createRunQueue(performRun, (isRendering) => {
	useRunStore.setState({ isRendering });
});

export const useRunStore = create<RunState>()((set, get) => {
	// `unicorn/no-top-level-side-effects` puts the graph subscription here rather than beside the store
	useGraphStore.subscribe(handleGraphChange);

	return {
		clearResults: () => {
			for (const result of get().results) URL.revokeObjectURL(result.url);

			set({ ranWith: undefined, results: [], runDuration: undefined, runError: undefined });
		},
		isLive: false,
		isRendering: false,
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
		previewSource: undefined,
		ranWith: undefined,
		results: [],
		runDuration: undefined,
		runError: undefined,
		runGraph: () => {
			requestRun('full');
		},
		setLive: (isLive) => {
			set({ isLive });

			if (isLive && isBehind()) requestRun('full');
		},
		source: undefined,
		sourceError: undefined,
		stage: undefined,
		status: 'idle',
	};
});

export function closeStage() {
	stageSequence += 1;

	revokeStage(useRunStore.getState().stage);
	useRunStore.setState({ stage: undefined });
}

export async function inspectStage(nodeId: string, name: string) {
	const { source, stage: previous } = useRunStore.getState();

	if (source === undefined) return;

	const sequence = (stageSequence += 1);

	revokeStage(previous);
	useRunStore.setState({ stage: { kind: 'rendering', name } });

	try {
		const { graph, seed } = useGraphStore.getState();
		const { images } = await runInWorker({ graph, seed, source }, nodeId);
		const image = images.get(nodeId);

		if (image === undefined) throw new Error(`The worker returned no frame for ${nodeId}`);

		const url = URL.createObjectURL(image);

		if (sequence !== stageSequence) {
			URL.revokeObjectURL(url);

			return;
		}

		useRunStore.setState({ stage: { kind: 'ready', name, url } });
	} catch {
		if (sequence !== stageSequence) return;

		useRunStore.setState({ stage: { kind: 'failed', name } });
	}
}

export function useIsStale() {
	const isCatchingUp = useRunStore((state) => state.isLive && state.isRendering);
	const ranWith = useRunStore((state) => state.ranWith);
	const source = useRunStore((state) => state.source);

	// Live results trail an edit by one render; "Run again to update them" is wrong while that render is queued
	return useGraphStore(
		({ graph, seed }) => !isCatchingUp && isStale(ranWith, { graph, seed, source }),
	);
}

async function decodeSource(read: () => Promise<Blob>, failure: string, advice: string) {
	useRunStore.setState({ sourceError: undefined, status: 'loading' });

	try {
		const { preview, source } = await decodeImage(await read());

		useRunStore.setState({ previewSource: preview, source, status: 'idle' });

		if (useRunStore.getState().isLive) requestRun('full');
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

function handleGraphChange(next: TriggerState, previous: TriggerState) {
	if (!useRunStore.getState().isLive) return;

	const quality = getRunQuality(previous, next);

	if (quality !== undefined) requestRun(quality);
}

function isBehind() {
	const { ranWith, source } = useRunStore.getState();
	const { graph, seed } = useGraphStore.getState();

	return ranWith === undefined || isStale(ranWith, { graph, seed, source });
}

async function performRun(quality: RunQuality) {
	const { previewSource, results: previous, source } = useRunStore.getState();

	if (source === undefined || previewSource === undefined) return;

	// A preview must not grey out the toolbar, and must not release a load that started mid-run
	const isFull = quality === 'full';

	useRunStore.setState({ runError: undefined });

	if (isFull) useRunStore.setState({ status: 'running' });

	try {
		const { graph, seed } = useGraphStore.getState();
		const { duration, images } = await runInWorker({
			graph,
			seed,
			source: isFull ? source : previewSource,
		});

		for (const result of previous) URL.revokeObjectURL(result.url);

		// A preview renders the small source but stands in for the full one, so staleness stays quiet
		useRunStore.setState({
			ranWith: { graph, seed, source },
			results: toResults(graph, images),
			runDuration: duration,
		});
	} catch {
		useRunStore.setState({ runError: 'The run failed. Run again, or Reset the graph.' });
	}

	if (isFull) useRunStore.setState({ status: 'idle' });
}

function revokeStage(stage: StageView | undefined) {
	if (stage?.kind === 'ready') URL.revokeObjectURL(stage.url);
}

function toResults(graph: Graph, images: Map<string, Blob>) {
	return getOutputs(graph).flatMap(({ id, name }) => {
		const image = images.get(id);

		return image === undefined ? [] : [{ id, name, url: URL.createObjectURL(image) }];
	});
}
