import type { IntBuffer } from '@thi.ng/pixel';

import type { Graph } from '#glitch-graph/graph/graph-types.ts';

export interface RunInputs {
	graph: Graph;
	seed: number;
	source: IntBuffer;
}

export function isStale(
	ranWith: RunInputs | undefined,
	current: { graph: Graph; seed: number; source: IntBuffer | undefined },
) {
	if (ranWith === undefined) return false;

	return (
		ranWith.seed !== current.seed ||
		ranWith.source !== current.source ||
		!rendersSame(ranWith.graph, current.graph)
	);
}

function rendersSame(rendered: Graph, graph: Graph) {
	if (rendered.edges !== graph.edges) return false;

	return Object.values(graph.nodes).every((node) => {
		const previous = rendered.nodes[node.id];

		return previous === node || (previous?.kind === 'output' && node.kind === 'output');
	});
}
