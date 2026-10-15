import type { Insertion } from '#glitch-graph/graph/graph-operations.ts';
import type {
	EffectKind,
	EffectNode,
	Graph,
	ParamValues,
} from '#glitch-graph/graph/graph-types.ts';

import { insertNode } from '#glitch-graph/graph/graph-operations.ts';
import { createEdge } from '#glitch-graph/graph/graph-utils.ts';
import {
	effectDefinitions,
	getDefaultParams,
	mergeDefinition,
	predicateDefinitions,
} from '#glitch-graph/graph/param-definitions.ts';

export type PresetId = (typeof graphPresets)[number]['id'];

const channelShift = { effect: 'channel-shift', kind: 'effect' } as const satisfies Insertion;

const dither = { effect: 'dither', kind: 'effect' } as const satisfies Insertion;

const fork = { kind: 'fork' } as const satisfies Insertion;

const gradientMap = { effect: 'gradient-map', kind: 'effect' } as const satisfies Insertion;

const luminanceSplit = { kind: 'split', predicate: 'luminance' } as const satisfies Insertion;

const pixelSort = { effect: 'pixel-sort', kind: 'effect' } as const satisfies Insertion;

const randomSplit = { kind: 'split', predicate: 'random' } as const satisfies Insertion;

const sliceDisplacement = {
	effect: 'slice-displacement',
	kind: 'effect',
} as const satisfies Insertion;

export const graphPresets = [
	{ create: createSortedLightPreset, id: 'sorted-light', label: 'Sorted light' },
	{ create: createSignalLossPreset, id: 'signal-loss', label: 'Signal loss' },
	{ create: createNewsprintPreset, id: 'newsprint', label: 'Newsprint' },
	{ create: createAnaglyphPreset, id: 'anaglyph', label: 'Anaglyph' },
	{ create: createDensePreset, id: 'dense', label: 'Everything at once' },
	{ create: createBlankGraph, id: 'blank', label: 'Blank' },
] as const;

export const defaultPresetId: PresetId = 'sorted-light';

export function createBlankGraph(): Graph {
	return {
		counter: 2,
		edges: [createEdge(['n1', 0], ['n2', 0])],
		nodes: {
			n1: { id: 'n1', kind: 'source' },
			n2: { id: 'n2', kind: 'output', name: 'Main' },
		},
	};
}

export function createDiamondForkPreset(): Graph {
	return {
		counter: 8,
		edges: [
			createEdge(['n1', 0], ['n2', 0]),
			createEdge(['n2', 0], ['n3', 0]),
			createEdge(['n3', 0], ['n4', 0]),
			createEdge(['n4', 0], ['n5', 0]),
			createEdge(['n3', 1], ['n5', 1]),
			createEdge(['n5', 0], ['n6', 0]),
			createEdge(['n6', 0], ['n7', 0]),
			createEdge(['n6', 1], ['n8', 0]),
		],
		nodes: {
			n1: { id: 'n1', kind: 'source' },
			n2: {
				effect: 'channel-shift',
				id: 'n2',
				kind: 'effect',
				params: getDefaultParams(effectDefinitions['channel-shift']),
			},
			n3: {
				id: 'n3',
				kind: 'split',
				mergeId: 'n5',
				params: getDefaultParams(predicateDefinitions.luminance),
				predicate: 'luminance',
			},
			n4: {
				effect: 'channel-shift',
				id: 'n4',
				kind: 'effect',
				params: { channel: 'blue', dx: -24, dy: 8 },
			},
			n5: {
				id: 'n5',
				kind: 'merge',
				params: getDefaultParams(mergeDefinition),
				splitId: 'n3',
			},
			n6: { id: 'n6', kind: 'fork' },
			n7: { id: 'n7', kind: 'output', name: 'Main' },
			n8: { id: 'n8', kind: 'output', name: 'Variant' },
		},
	};
}

export function getPreset(id: PresetId) {
	return graphPresets.find((preset) => preset.id === id) ?? graphPresets[0];
}

// Built from edits so it stays valid by construction
function createDensePreset(): Graph {
	const edits: Array<[edgeId: string, insertion: Insertion]> = [
		['n3.1-n5.1', randomSplit],
		['n9.0-n10.0', pixelSort],
		['n9.1-n10.1', dither],
		['n4.0-n5.0', fork],
		['n13.1-n14.0', gradientMap],
		['n5.0-n6.0', sliceDisplacement],
		['n16.0-n6.0', luminanceSplit],
		['n17.0-n18.0', gradientMap],
		['n19.0-n18.0', pixelSort],
		['n17.1-n18.1', fork],
		['n21.0-n18.1', channelShift],
		['n6.1-n8.0', dither],
		['n24.0-n8.0', randomSplit],
		['n25.0-n26.0', sliceDisplacement],
		['n6.0-n7.0', pixelSort],
		['n28.0-n7.0', fork],
		['n29.1-n30.0', gradientMap],
		['n1.0-n2.0', sliceDisplacement],
		['n29.0-n7.0', fork],
		['n33.1-n34.0', dither],
		['n25.1-n26.1', channelShift],
	];

	let graph = createDiamondForkPreset();

	for (const [edgeId, insertion] of edits) graph = insertNode(graph, edgeId, insertion);

	return graph;
}

function createAnaglyphPreset(): Graph {
	return {
		counter: 4,
		edges: chain('n1', 'n2', 'n3', 'n4'),
		nodes: {
			n1: { id: 'n1', kind: 'source' },
			n2: effect('n2', 'channel-shift', { channel: 'red', dx: 18, dy: 0 }),
			n3: effect('n3', 'channel-shift', { channel: 'blue', dx: -18, dy: 6 }),
			n4: { id: 'n4', kind: 'output', name: 'Main' },
		},
	};
}

function createNewsprintPreset(): Graph {
	return {
		counter: 7,
		edges: [
			...chain('n1', 'n2', 'n3', 'n4'),
			createEdge(['n2', 1], ['n5', 0]),
			...chain('n5', 'n6', 'n7'),
		],
		nodes: {
			n1: { id: 'n1', kind: 'source' },
			n2: { id: 'n2', kind: 'fork' },
			n3: effect('n3', 'dither', { kernel: 'atkinson', levels: 2 }),
			n4: { id: 'n4', kind: 'output', name: 'Eight inks' },
			n5: effect('n5', 'gradient-map', { preset: 'orange-blue' }),
			n6: effect('n6', 'dither', { kernel: 'bayer-8', levels: 2 }),
			n7: { id: 'n7', kind: 'output', name: 'Orange and blue' },
		},
	};
}

function createSignalLossPreset(): Graph {
	return {
		counter: 9,
		edges: [
			...chain('n1', 'n2', 'n3', 'n5', 'n6', 'n7'),
			createEdge(['n2', 1], ['n4', 0]),
			createEdge(['n4', 0], ['n5', 1]),
			createEdge(['n6', 1], ['n8', 0]),
			createEdge(['n8', 0], ['n9', 0]),
		],
		nodes: {
			n1: { id: 'n1', kind: 'source' },
			n2: {
				id: 'n2',
				kind: 'split',
				mergeId: 'n5',
				params: { blockSize: 40, percentage: 55 },
				predicate: 'random',
			},
			n3: effect('n3', 'slice-displacement', { maxOffset: 90, slices: 14 }),
			n4: effect('n4', 'channel-shift', { channel: 'green', dx: 28, dy: 0 }),
			n5: { id: 'n5', kind: 'merge', params: { blend: 'normal' }, splitId: 'n2' },
			n6: { id: 'n6', kind: 'fork' },
			n7: { id: 'n7', kind: 'output', name: 'Main' },
			n8: effect('n8', 'pixel-sort', { axis: 'horizontal', threshold: 110 }),
			n9: { id: 'n9', kind: 'output', name: 'Smeared' },
		},
	};
}

function createSortedLightPreset(): Graph {
	return {
		counter: 8,
		edges: [
			...chain('n1', 'n2', 'n3', 'n4', 'n5', 'n6'),
			createEdge(['n2', 1], ['n4', 1]),
			createEdge(['n5', 1], ['n7', 0]),
			createEdge(['n7', 0], ['n8', 0]),
		],
		nodes: {
			n1: { id: 'n1', kind: 'source' },
			n2: {
				id: 'n2',
				kind: 'split',
				mergeId: 'n4',
				params: { threshold: 120 },
				predicate: 'luminance',
			},
			n3: effect('n3', 'pixel-sort', { axis: 'vertical', threshold: 60 }),
			n4: { id: 'n4', kind: 'merge', params: { blend: 'normal' }, splitId: 'n2' },
			n5: { id: 'n5', kind: 'fork' },
			n6: { id: 'n6', kind: 'output', name: 'Sorted' },
			n7: effect('n7', 'gradient-map', { preset: 'purple-orange-cyan' }),
			n8: { id: 'n8', kind: 'output', name: 'Tinted' },
		},
	};
}

// Each id feeds the next through port 0, the main line
function chain(...ids: Array<string>) {
	return ids.slice(1).map((id, index) => createEdge([ids[index] ?? '', 0], [id, 0]));
}

function effect(id: string, kind: EffectKind, params: ParamValues): EffectNode {
	return { effect: kind, id, kind: 'effect', params };
}
