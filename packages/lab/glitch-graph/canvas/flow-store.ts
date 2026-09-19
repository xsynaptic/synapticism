import type { Edge, Node, NodeChange } from '@xyflow/react';

import { applyNodeChanges } from '@xyflow/react';
import { create } from 'zustand';

import type { Graph, NodeKind } from '../graph/graph-types.ts';
import type { EdgeRoute, LayoutResult } from './layout.ts';

import { useGraphStore } from '../graph/graph-store.ts';
import { getModelOrder } from '../graph/graph-utils.ts';

export type FlowEdge = Edge<RoutedEdgeData, 'routed'>;

// Suffixed so `output` does not pick up React Flow's built-in output node styles
export type FlowNode = Node<Record<string, never>, `${NodeKind}-node`>;

interface FlowState {
	applyNodeChanges: (changes: Array<NodeChange<FlowNode>>) => void;
	commitLayout: (result: LayoutResult) => void;
	edges: Array<FlowEdge>;
	hasLayout: boolean;
	nodes: Array<FlowNode>;
	resetView: () => void;
	sizeVersion: number;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- React Flow edge data must satisfy `Record<string, unknown>`, which an interface does not
type RoutedEdgeData = {
	route: EdgeRoute | undefined;
};

export const useFlowStore = create<FlowState>()((set) => {
	const { graph } = useGraphStore.getState();

	useGraphStore.subscribe(({ graph: nextGraph }, previous) => {
		if (nextGraph.edges === previous.graph.edges) return;

		set(({ edges, nodes }) => ({
			edges: toFlowEdges(nextGraph, new Map(edges.map((edge) => [edge.id, edge]))),
			nodes: toFlowNodes(nextGraph, new Map(nodes.map((node) => [node.id, node]))),
		}));
	});

	return {
		applyNodeChanges: (changes) => {
			const hasResize = changes.some((change) => change.type === 'dimensions');

			set(({ nodes, sizeVersion }) => ({
				nodes: applyNodeChanges(changes, nodes),
				sizeVersion: hasResize ? sizeVersion + 1 : sizeVersion,
			}));
		},
		commitLayout: ({ positions, routes }) => {
			set(({ edges, nodes }) => ({
				edges: edges.map((edge) => ({ ...edge, data: { route: routes.get(edge.id) } })),
				hasLayout: true,
				nodes: nodes.map((node) => ({
					...node,
					className: '',
					position: positions.get(node.id) ?? node.position,
				})),
			}));
		},
		edges: toFlowEdges(graph, new Map()),
		hasLayout: false,
		nodes: toFlowNodes(graph, new Map()),
		resetView: () => {
			set({ hasLayout: false });
		},
		sizeVersion: 0,
	};
});

function toFlowEdges(graph: Graph, previous: ReadonlyMap<string, FlowEdge>): Array<FlowEdge> {
	return graph.edges.map(
		(edge) =>
			previous.get(edge.id) ?? {
				data: { route: undefined },
				id: edge.id,
				source: edge.source,
				sourceHandle: `out-${String(edge.sourceIndex)}`,
				target: edge.target,
				targetHandle: `in-${String(edge.targetIndex)}`,
				type: 'routed',
			},
	);
}

// Reusing node objects keeps `measured`; new nodes stay hidden until a layout places them
function toFlowNodes(graph: Graph, previous: ReadonlyMap<string, FlowNode>): Array<FlowNode> {
	return getModelOrder(graph).flatMap((id) => {
		const node = graph.nodes[id];

		if (node === undefined) return [];

		const type = `${node.kind}-node` as const;
		const existing = previous.get(id);

		if (existing?.type === type) return [existing];

		return [{ className: 'gg-unplaced', data: {}, id, position: { x: 0, y: 0 }, type }];
	});
}
