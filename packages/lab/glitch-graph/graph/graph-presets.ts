import type { Insertion } from './graph-operations.ts';
import type { Graph } from './graph-types.ts';

import { insertNode } from './graph-operations.ts';
import { createEdge } from './graph-utils.ts';
import { effectDefinitions, getDefaultParams, predicateDefinitions } from './param-definitions.ts';

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
	{ create: createSinglePreset, id: 'single', label: 'Single effect' },
	{ create: createDiamondForkPreset, id: 'diamond-fork', label: 'Diamond and fork' },
	{ create: createDensePreset, id: 'dense', label: 'Near the cap' },
] as const;

export const defaultPresetId: PresetId = 'diamond-fork';

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
			n5: { id: 'n5', kind: 'merge', splitId: 'n3' },
			n6: { id: 'n6', kind: 'fork' },
			n7: { id: 'n7', kind: 'output', name: 'Main' },
			n8: { id: 'n8', kind: 'output', name: 'Variant' },
		},
	};
}

export function getPreset(id: PresetId) {
	return graphPresets.find((preset) => preset.id === id) ?? graphPresets[1];
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

function createSinglePreset(): Graph {
	return {
		counter: 3,
		edges: [createEdge(['n1', 0], ['n2', 0]), createEdge(['n2', 0], ['n3', 0])],
		nodes: {
			n1: { id: 'n1', kind: 'source' },
			n2: {
				effect: 'channel-shift',
				id: 'n2',
				kind: 'effect',
				params: getDefaultParams(effectDefinitions['channel-shift']),
			},
			n3: { id: 'n3', kind: 'output', name: 'Main' },
		},
	};
}
