import type { Graph } from './graph-types.ts';

import { createEdge } from './graph-utils.ts';
import { effectDefinitions, getDefaultParams, predicateDefinitions } from './param-definitions.ts';

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
