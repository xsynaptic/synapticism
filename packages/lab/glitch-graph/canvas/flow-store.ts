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
	sizeVersion: number;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- React Flow edge data must satisfy `Record<string, unknown>`, which an interface does not
type RoutedEdgeData = {
	route: EdgeRoute | undefined;
};

export const useFlowStore = create<FlowState>()((set) => {
	const { graph } = useGraphStore.getState();

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
					position: positions.get(node.id) ?? node.position,
				})),
			}));
		},
		edges: toFlowEdges(graph),
		hasLayout: false,
		nodes: toFlowNodes(graph),
		sizeVersion: 0,
	};
});

function toFlowEdges(graph: Graph): Array<FlowEdge> {
	return graph.edges.map((edge) => ({
		data: { route: undefined },
		id: edge.id,
		source: edge.source,
		sourceHandle: `out-${String(edge.sourceIndex)}`,
		target: edge.target,
		targetHandle: `in-${String(edge.targetIndex)}`,
		type: 'routed',
	}));
}

function toFlowNodes(graph: Graph): Array<FlowNode> {
	return getModelOrder(graph).flatMap((id) => {
		const node = graph.nodes[id];

		if (node === undefined) return [];

		return [{ data: {}, id, position: { x: 0, y: 0 }, type: `${node.kind}-node` as const }];
	});
}
