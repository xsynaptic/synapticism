import { ABGR8888, IntBuffer } from '@thi.ng/pixel';
import { describe, expect, it } from 'vitest';

import type { Graph } from '../graph/graph-types.ts';

import { createDiamondForkPreset } from '../graph/graph-presets.ts';
import { channelShift } from './effects/channel-shift.ts';
import { run } from './run.ts';

function createGradientFrame(width: number, height: number) {
	const frame = new IntBuffer(width, height, ABGR8888);

	for (let index = 0; index < width * height; index++) {
		const value = Math.round((index / (width * height - 1)) * 255);

		frame.data[index] = (0xff_00_00_00 | (value << 16) | ((255 - value) << 8) | value) >>> 0;
	}

	return frame;
}

function getEffectParams(graph: Graph, id: string) {
	const node = graph.nodes[id];

	if (node?.kind !== 'effect') throw new Error(`Preset lost Effect ${id}`);

	return node.params;
}

async function runMain(graph: Graph, source: IntBuffer) {
	const results = await run(graph, source, 1);

	return [...(results.get('n7')?.data ?? [])];
}

function withThreshold(graph: Graph, threshold: number): Graph {
	const split = graph.nodes.n3;

	if (split?.kind !== 'split') throw new Error('Preset lost its Split');

	return { ...graph, nodes: { ...graph.nodes, n3: { ...split, params: { threshold } } } };
}

describe('run', () => {
	const source = createGradientFrame(8, 8);
	const preset = createDiamondForkPreset();

	it('takes branch A everywhere when the mask is fully set', async () => {
		const beforeSplit = channelShift(source, getEffectParams(preset, 'n2'));
		const branchA = channelShift(beforeSplit, getEffectParams(preset, 'n4'));

		expect(await runMain(withThreshold(preset, 0), source)).toEqual([...branchA.data]);
	});

	it('passes the frame through an empty branch when the mask is empty', async () => {
		const beforeSplit = channelShift(source, getEffectParams(preset, 'n2'));

		expect(await runMain(withThreshold(preset, 256), source)).toEqual([...beforeSplit.data]);
	});

	it('gives every Output a frame, including the forked one', async () => {
		const results = await run(preset, source, 1);

		expect(new Set(results.keys())).toEqual(new Set(['n7', 'n8']));
	});
});

describe('channelShift', () => {
	it('moves only the chosen channel, wrapping at the edge', () => {
		const frame = new IntBuffer(
			3,
			1,
			ABGR8888,
			new Uint32Array([0xff_00_00_0a, 0xff_00_00_0b, 0xff_00_00_0c]),
		);
		const shifted = channelShift(frame, { channel: 'red', dx: 1, dy: 0 });

		expect([...shifted.data]).toEqual([0xff_00_00_0c, 0xff_00_00_0a, 0xff_00_00_0b]);
	});

	it('leaves the input frame untouched', () => {
		const frame = createGradientFrame(4, 4);
		const before = [...frame.data];

		channelShift(frame, { channel: 'green', dx: 2, dy: 1 });

		expect([...frame.data]).toEqual(before);
	});
});
