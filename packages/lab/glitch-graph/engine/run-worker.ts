import { ABGR8888, IntBuffer } from '@thi.ng/pixel';

import type { Graph } from '#glitch-graph/graph/graph-types.ts';

import { frameToRgba } from '#glitch-graph/engine/frame.ts';
import { run, runToStage } from '#glitch-graph/engine/run.ts';

export type RunRequest =
	(RunRequestBase & { kind: 'graph' }) | (RunRequestBase & { kind: 'stage'; stageId: string });

export type RunResponse =
	| { duration: number; id: number; images: Map<string, Blob>; kind: 'done' }
	| { id: number; kind: 'failed' };

export interface SourcePixels {
	data: IntBuffer['data'];
	height: number;
	width: number;
}

interface RunRequestBase {
	graph: Graph;
	id: number;
	seed: number;
	source: SourcePixels;
}

globalThis.addEventListener('message', (event: MessageEvent<RunRequest>) => {
	void respond(event.data);
});

async function encodePng(frame: IntBuffer) {
	const { height, width } = frame;
	const context = new OffscreenCanvas(width, height).getContext('2d');

	if (context === null) throw new Error('2D canvas is unavailable');

	context.putImageData(
		new ImageData(new Uint8ClampedArray(frameToRgba(frame)), width, height),
		0,
		0,
	);

	return context.canvas.convertToBlob({ type: 'image/png' });
}

async function respond(request: RunRequest) {
	const { graph, id, seed, source } = request;

	try {
		const started = performance.now();
		const input = {
			graph,
			seed,
			source: new IntBuffer(source.width, source.height, ABGR8888, source.data),
		};
		const frames =
			request.kind === 'stage'
				? new Map([[request.stageId, await runToStage(input, request.stageId)]])
				: await run(input);
		const duration = performance.now() - started;
		const images = new Map<string, Blob>();

		for (const [frameId, frame] of frames) images.set(frameId, await encodePng(frame));

		globalThis.postMessage({ duration, id, images, kind: 'done' } satisfies RunResponse);
	} catch {
		globalThis.postMessage({ id, kind: 'failed' } satisfies RunResponse);
	}
}
