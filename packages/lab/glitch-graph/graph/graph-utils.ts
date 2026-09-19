import type { Graph, GraphEdge } from '#glitch-graph/graph/graph-types.ts';

export type Endpoint = readonly [id: string, index: number];

export function createEdge(
	[source, sourceIndex]: Endpoint,
	[target, targetIndex]: Endpoint,
): GraphEdge {
	return {
		id: `${source}.${String(sourceIndex)}-${target}.${String(targetIndex)}`,
		source,
		sourceIndex,
		target,
		targetIndex,
	};
}

export function getEdgeWithSource(graph: Graph, edgeId: string) {
	const edge = graph.edges.find((candidate) => candidate.id === edgeId);
	const source = edge === undefined ? undefined : graph.nodes[edge.source];

	return edge === undefined || source === undefined ? undefined : { edge, source };
}

export function getIncomingEdges(graph: Graph, id: string) {
	return graph.edges
		.filter((edge) => edge.target === id)
		.toSorted((first, second) => first.targetIndex - second.targetIndex);
}

// Depth-first from the Source with branch A before B, so ELK's model order puts A on the left
export function getModelOrder(graph: Graph) {
	const order: Array<string> = [];
	const visited = new Set<string>();
	const sourceId = getSourceId(graph);
	const stack = sourceId === undefined ? [] : [sourceId];

	while (stack.length > 0) {
		const id = stack.pop();

		if (id === undefined || visited.has(id)) continue;

		visited.add(id);
		order.push(id);

		for (const edge of getOutgoingEdges(graph, id).toReversed()) {
			stack.push(edge.target);
		}
	}

	return order;
}

export function getNodeId(counter: number) {
	return `n${String(counter)}`;
}

export function getOutputs(graph: Graph) {
	return getModelOrder(graph).flatMap((id) => {
		const node = graph.nodes[id];

		return node?.kind === 'output' ? [node] : [];
	});
}

export function getStructureSignature(graph: Graph) {
	return graph.edges.map((edge) => edge.id).join(' ');
}

function getOutgoingEdges(graph: Graph, id: string) {
	return graph.edges
		.filter((edge) => edge.source === id)
		.toSorted((first, second) => first.sourceIndex - second.sourceIndex);
}

function getSourceId(graph: Graph) {
	return Object.values(graph.nodes).find((node) => node.kind === 'source')?.id;
}
