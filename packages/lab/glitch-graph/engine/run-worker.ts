import { ABGR8888, IntBuffer } from '@thi.ng/pixel';

import type { Graph } from '../graph/graph-types.ts';

import { frameToRgba } from './frame.ts';
import { run } from './run.ts';

export interface RunRequest {
	graph: Graph;
	id: number;
	seed: number;
	source: SourcePixels;
}

export type RunResponse =
	| { duration: number; id: number; images: Map<string, Blob>; kind: 'done' }
	| { id: number; kind: 'failed' };

export interface SourcePixels {
	data: IntBuffer['data'];
	height: number;
	width: number;
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

async function respond({ graph, id, seed, source }: RunRequest) {
	try {
		const started = performance.now();
		const frames = await run(
			graph,
			new IntBuffer(source.width, source.height, ABGR8888, source.data),
			seed,
		);
		const duration = performance.now() - started;
		const images = new Map<string, Blob>();

		for (const [outputId, frame] of frames) images.set(outputId, await encodePng(frame));

		globalThis.postMessage({ duration, id, images, kind: 'done' } satisfies RunResponse);
	} catch {
		globalThis.postMessage({ id, kind: 'failed' } satisfies RunResponse);
	}
}
