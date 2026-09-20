import type { Graph, GraphNode, NodeKind } from '#glitch-graph/graph/graph-types.ts';

const expectedPorts = {
	effect: { inputs: [0], outputs: [0] },
	fork: { inputs: [0], outputs: [0, 1] },
	merge: { inputs: [0, 1], outputs: [0] },
	output: { inputs: [0], outputs: [] },
	source: { inputs: [], outputs: [0] },
	split: { inputs: [0], outputs: [0, 1] },
} as const satisfies Record<NodeKind, { inputs: Array<number>; outputs: Array<number> }>;

// Per-kind port sets imply every leaf is an Output and every Split has two branches
export function getViolations(graph: Graph) {
	const nodes = Object.values(graph.nodes);
	const sourceCount = nodes.filter((node) => node.kind === 'source').length;
	const violations = nodes.flatMap((node) => getNodeViolations(graph, node));

	if (sourceCount !== 1) violations.push(`${String(sourceCount)} Sources`);

	for (const edge of graph.edges) {
		if (graph.nodes[edge.source] === undefined || graph.nodes[edge.target] === undefined) {
			violations.push(`${edge.id} dangles`);
		}
	}

	if (countSortable(graph) !== nodes.length) violations.push('cycle');

	return violations;
}

function countSortable(graph: Graph) {
	const pending = new Map(Object.keys(graph.nodes).map((id) => [id, 0]));

	for (const edge of graph.edges) pending.set(edge.target, (pending.get(edge.target) ?? 0) + 1);

	const ready = [...pending].filter(([, count]) => count === 0).map(([id]) => id);
	let sorted = 0;

	while (ready.length > 0) {
		const id = ready.pop();

		sorted += 1;
		ready.push(...releaseTargets(graph, id, pending));
	}

	return sorted;
}

function getNodeViolations(graph: Graph, node: GraphNode) {
	const violations: Array<string> = [];
	const inputs = graph.edges
		.filter((edge) => edge.target === node.id)
		.map((edge) => edge.targetIndex)
		.toSorted((first, second) => first - second);
	const outputs = graph.edges
		.filter((edge) => edge.source === node.id)
		.map((edge) => edge.sourceIndex)
		.toSorted((first, second) => first - second);

	if (String(inputs) !== String(expectedPorts[node.kind].inputs)) {
		violations.push(`${node.id} inputs [${String(inputs)}]`);
	}

	if (String(outputs) !== String(expectedPorts[node.kind].outputs)) {
		violations.push(`${node.id} outputs [${String(outputs)}]`);
	}

	if (!isPaired(graph, node)) violations.push(`${node.id} is not paired`);

	return violations;
}

function isPaired(graph: Graph, node: GraphNode) {
	if (node.kind === 'split') {
		const merge = graph.nodes[node.mergeId];

		return merge?.kind === 'merge' && merge.splitId === node.id;
	}

	if (node.kind === 'merge') return graph.nodes[node.splitId]?.kind === 'split';

	return true;
}

function releaseTargets(graph: Graph, id: string | undefined, pending: Map<string, number>) {
	const released: Array<string> = [];

	for (const edge of graph.edges) {
		if (edge.source !== id) continue;

		const count = (pending.get(edge.target) ?? 0) - 1;

		pending.set(edge.target, count);

		if (count === 0) released.push(edge.target);
	}

	return released;
}
