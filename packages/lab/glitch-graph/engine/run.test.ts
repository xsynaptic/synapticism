import type { IntBuffer } from '@thi.ng/pixel';

import { describe, expect, it } from 'vitest';

import type { Graph, GraphNode } from '#glitch-graph/graph/graph-types.ts';

import { channelShift } from '#glitch-graph/engine/effects/channel-shift.ts';
import { mergeByMask } from '#glitch-graph/engine/merge.ts';
import { luminanceMask } from '#glitch-graph/engine/predicates/luminance.ts';
import { run, runToStage } from '#glitch-graph/engine/run.ts';
import { createFrame, createGradientFrame } from '#glitch-graph/engine/test-frames.ts';
import { createDiamondForkPreset, graphPresets } from '#glitch-graph/graph/graph-presets.ts';
import { createEdge } from '#glitch-graph/graph/graph-utils.ts';
import { blendModes } from '#glitch-graph/graph/param-definitions.ts';

function createChain(node: GraphNode): Graph {
	return {
		counter: 3,
		edges: [createEdge(['n1', 0], [node.id, 0]), createEdge([node.id, 0], ['n3', 0])],
		nodes: {
			n1: { id: 'n1', kind: 'source' },
			n3: { id: 'n3', kind: 'output', name: 'Main' },
			[node.id]: node,
		},
	};
}

function getEffectParams(graph: Graph, id: string) {
	const node = graph.nodes[id];

	if (node?.kind !== 'effect') throw new Error(`Preset lost Effect ${id}`);

	return node.params;
}

async function hashRun(graph: Graph, source: IntBuffer, seed: number) {
	const results = await run({ graph, seed, source });
	let hash = 0x81_1c_9d_c5;

	const ids = [...results.keys()].toSorted((first, second) => first.localeCompare(second));

	for (const id of ids) {
		const frame = results.get(id)?.data ?? [];

		for (const pixel of frame) hash = Math.imul(hash ^ pixel, 0x01_00_01_93) >>> 0;
	}

	return hash;
}

async function runMain(graph: Graph, source: IntBuffer) {
	const results = await run({ graph, seed: 1, source });

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
		const results = await run({ graph: preset, seed: 1, source });

		expect(new Set(results.keys())).toEqual(new Set(['n7', 'n8']));
	});
});

describe('runToStage', () => {
	const source = createGradientFrame(8, 8);
	const preset = createDiamondForkPreset();

	it('gives an Output the same frame a full run does', async () => {
		const results = await run({ graph: preset, seed: 1, source });
		const stage = await runToStage({ graph: preset, seed: 1, source }, 'n7');

		expect([...stage.data]).toEqual([...(results.get('n7')?.data ?? [])]);
	});

	it('gives an Effect its own output', async () => {
		const stage = await runToStage({ graph: preset, seed: 1, source }, 'n2');

		expect([...stage.data]).toEqual([...channelShift(source, getEffectParams(preset, 'n2')).data]);
	});

	it('renders a Split as the mask over the frame reaching it, not the Source', async () => {
		const split = preset.nodes.n3;

		if (split?.kind !== 'split') throw new Error('Preset lost its Split');

		const reachingSplit = channelShift(source, getEffectParams(preset, 'n2'));
		const mask = luminanceMask(reachingSplit, split.params);
		const stage = await runToStage({ graph: preset, seed: 1, source }, 'n3');

		expect([...stage.data]).toEqual(
			[...mask].map((isSet) => (isSet === 0 ? 0xff_00_00_00 : 0xff_ff_ff_ff)),
		);
	});

	it('refuses a node that is not in the graph', () => {
		expect(() => runToStage({ graph: preset, seed: 1, source }, 'n99')).toThrow('not in the graph');
	});
});

describe('run determinism', () => {
	const source = createGradientFrame(48, 32);
	const densePreset = graphPresets[2].create();

	it('gives an identical hash for the same frame, graph and seed, leaving the source untouched', async () => {
		const before = [...source.data];
		const first = await hashRun(densePreset, source, 7);
		const second = await hashRun(graphPresets[2].create(), source, 7);

		expect(second).toBe(first);
		expect([...source.data]).toEqual(before);
	});

	it.each([
		[
			'slice displacement',
			createChain({
				effect: 'slice-displacement',
				id: 'n2',
				kind: 'effect',
				params: { maxOffset: 16, slices: 8 },
			}),
		],
		[
			'a random Split',
			{
				...createDiamondForkPreset(),
				nodes: {
					...createDiamondForkPreset().nodes,
					n3: {
						id: 'n3',
						kind: 'split',
						mergeId: 'n5',
						params: { blockSize: 4, percentage: 50 },
						predicate: 'random',
					},
				},
			} satisfies Graph,
		],
	])('changes the output of %s with the seed', async (_, graph) => {
		expect(await hashRun(graph, source, 2)).not.toBe(await hashRun(graph, source, 1));
	});
});

describe('mergeByMask', () => {
	const branchA = createFrame(2, 1, [0xff_00_40_80, 0xff_00_40_80]);
	const branchB = createFrame(2, 1, [0xff_ff_80_40, 0xff_ff_80_40]);
	const mask = new Uint8Array([1, 0]);

	const blendCases: Array<[mode: string, blended: number]> = [
		['normal', 0xff_00_40_80],
		['multiply', 0xff_00_20_20],
		['screen', 0xff_ff_a0_a0],
		['difference', 0xff_ff_40_40],
		['lighten', 0xff_ff_80_80],
		['darken', 0xff_00_40_40],
	];

	it.each(blendCases)('blends branch A over branch B in %s', (mode, blended) => {
		const merged = mergeByMask({ branchA, branchB, mask, params: { blend: mode } });

		expect([...merged.data]).toEqual([blended, 0xff_ff_80_40]);
	});

	it('falls back to branch A when the mode is missing', () => {
		const merged = mergeByMask({ branchA, branchB, mask, params: {} });

		expect([...merged.data]).toEqual([0xff_00_40_80, 0xff_ff_80_40]);
	});

	it('has a mode for every blend the Select offers', () => {
		const covered = new Set(blendCases.map(([mode]) => mode));

		expect(covered).toEqual(new Set(blendModes.map((mode) => mode.value)));
	});

	it('leaves both branches untouched', () => {
		const before = [...branchA.data];

		mergeByMask({ branchA, branchB, mask, params: { blend: 'difference' } });

		expect([...branchA.data]).toEqual(before);
	});
});

describe('channelShift', () => {
	it('moves only the chosen channel, wrapping at the edge', () => {
		const frame = createFrame(3, 1, [0xff_00_00_0a, 0xff_00_00_0b, 0xff_00_00_0c]);
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
