import type {
	EffectKind,
	Graph,
	GraphEdge,
	GraphNode,
	PredicateKind,
} from '#glitch-graph/graph/graph-types.ts';
import type { Endpoint } from '#glitch-graph/graph/graph-utils.ts';

import { createEdge, getNodeId } from '#glitch-graph/graph/graph-utils.ts';
import {
	effectDefinitions,
	getDefaultParams,
	predicateDefinitions,
} from '#glitch-graph/graph/param-definitions.ts';

export type Insertion =
	| { effect: EffectKind; kind: 'effect' }
	| { kind: 'fork' }
	| { kind: 'split'; predicate: PredicateKind };

interface Splice {
	edges: Array<GraphEdge>;
	nodes: Array<GraphNode>;
}

interface SpliceEnds {
	downstream: Endpoint;
	firstId: string;
	secondId: string;
	upstream: Endpoint;
}

export const nodeCap = 40;

const insertionSizes = { effect: 1, fork: 2, split: 2 } as const satisfies Record<
	Insertion['kind'],
	number
>;

export function canDelete(node: GraphNode) {
	return node.kind !== 'source' && node.kind !== 'output';
}

export function canInsert(nodeCount: number, kind: Insertion['kind']) {
	return nodeCount + insertionSizes[kind] <= nodeCap;
}

export function deleteNode(graph: Graph, id: string): Graph {
	const node = graph.nodes[id];

	if (node === undefined) return graph;

	const removal = getRemoval(graph, node);

	if (removal === undefined) return graph;

	const incoming = graph.edges.find((edge) => edge.target === removal.entryId);
	const outgoing = graph.edges.find(
		(edge) => edge.source === removal.exitId && edge.sourceIndex === 0,
	);

	if (incoming === undefined || outgoing === undefined) return graph;

	const bridge = createEdge(
		[incoming.source, incoming.sourceIndex],
		[outgoing.target, outgoing.targetIndex],
	);
	const edges = graph.edges.flatMap((edge) => {
		if (edge === incoming) return [bridge];
		if (removal.ids.has(edge.source) || removal.ids.has(edge.target)) return [];

		return [edge];
	});
	const nodes = Object.fromEntries(
		Object.entries(graph.nodes).filter(([nodeId]) => !removal.ids.has(nodeId)),
	);

	return { counter: graph.counter, edges, nodes };
}

export function getNodeCount(graph: Graph) {
	return Object.keys(graph.nodes).length;
}

export function insertNode(graph: Graph, edgeId: string, insertion: Insertion): Graph {
	const edgeIndex = graph.edges.findIndex((edge) => edge.id === edgeId);
	const edge = graph.edges[edgeIndex];

	if (edge === undefined || !canInsert(getNodeCount(graph), insertion.kind)) return graph;

	const { edges, nodes } = buildInsertion(graph, edge, insertion);

	return {
		counter: graph.counter + nodes.length,
		edges: graph.edges.toSpliced(edgeIndex, 1, ...edges),
		nodes: { ...graph.nodes, ...Object.fromEntries(nodes.map((node) => [node.id, node])) },
	};
}

function buildEffectSplice(
	{ downstream, firstId, upstream }: SpliceEnds,
	effect: EffectKind,
): Splice {
	return {
		edges: [createEdge(upstream, [firstId, 0]), createEdge([firstId, 0], downstream)],
		nodes: [
			{
				effect,
				id: firstId,
				kind: 'effect',
				params: getDefaultParams(effectDefinitions[effect]),
			},
		],
	};
}

function buildForkSplice(
	{ downstream, firstId, secondId, upstream }: SpliceEnds,
	outputName: string,
): Splice {
	return {
		edges: [
			createEdge(upstream, [firstId, 0]),
			createEdge([firstId, 0], downstream),
			createEdge([firstId, 1], [secondId, 0]),
		],
		nodes: [
			{ id: firstId, kind: 'fork' },
			{ id: secondId, kind: 'output', name: outputName },
		],
	};
}

function buildInsertion(graph: Graph, edge: GraphEdge, insertion: Insertion): Splice {
	const splice: SpliceEnds = {
		downstream: [edge.target, edge.targetIndex],
		firstId: getNodeId(graph.counter + 1),
		secondId: getNodeId(graph.counter + 2),
		upstream: [edge.source, edge.sourceIndex],
	};

	switch (insertion.kind) {
		case 'effect': {
			return buildEffectSplice(splice, insertion.effect);
		}
		case 'fork': {
			return buildForkSplice(splice, getNextOutputName(graph));
		}
		case 'split': {
			return buildSplitSplice(splice, insertion.predicate);
		}
	}
}

function buildSplitSplice(
	{ downstream, firstId, secondId, upstream }: SpliceEnds,
	predicate: PredicateKind,
): Splice {
	return {
		edges: [
			createEdge(upstream, [firstId, 0]),
			createEdge([firstId, 0], [secondId, 0]),
			createEdge([firstId, 1], [secondId, 1]),
			createEdge([secondId, 0], downstream),
		],
		nodes: [
			{
				id: firstId,
				kind: 'split',
				mergeId: secondId,
				params: getDefaultParams(predicateDefinitions[predicate]),
				predicate,
			},
			{ id: secondId, kind: 'merge', splitId: firstId },
		],
	};
}

function collectReachable(graph: Graph, startId: string, stopId?: string) {
	const reached = new Set<string>();
	const stack = [startId];

	while (stack.length > 0) {
		const id = stack.pop();

		if (id === undefined || id === stopId || reached.has(id)) continue;

		reached.add(id);

		for (const edge of graph.edges) {
			if (edge.source === id) stack.push(edge.target);
		}
	}

	return reached;
}

function getDiamondRemoval(graph: Graph, splitId: string, mergeId: string) {
	const ids = collectReachable(graph, splitId, mergeId);

	ids.add(mergeId);

	return { entryId: splitId, exitId: mergeId, ids };
}

function getNextOutputName(graph: Graph) {
	const names = new Set(
		Object.values(graph.nodes).flatMap((node) => (node.kind === 'output' ? [node.name] : [])),
	);
	let number = names.size + 1;

	while (names.has(`Output ${String(number)}`)) number += 1;

	return `Output ${String(number)}`;
}

// Every path out of a Split or down a Fork's tee ends at its Merge or at an Output, so reachability bounds the removal
function getRemoval(graph: Graph, node: GraphNode) {
	switch (node.kind) {
		case 'effect': {
			return { entryId: node.id, exitId: node.id, ids: new Set([node.id]) };
		}
		case 'fork': {
			const tee = graph.edges.find((edge) => edge.source === node.id && edge.sourceIndex === 1);
			const ids = tee === undefined ? new Set<string>() : collectReachable(graph, tee.target);

			ids.add(node.id);

			return { entryId: node.id, exitId: node.id, ids };
		}
		case 'merge': {
			return getDiamondRemoval(graph, node.splitId, node.id);
		}
		case 'split': {
			return getDiamondRemoval(graph, node.id, node.mergeId);
		}
		default: {
			return;
		}
	}
}
