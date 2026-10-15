import type { Edge, Node, NodeChange } from '@xyflow/react';

import { applyNodeChanges } from '@xyflow/react';
import { create } from 'zustand';

import type { EdgeRoute, LayoutResult } from '#glitch-graph/canvas/layout.ts';
import type { Graph, NodeKind } from '#glitch-graph/graph/graph-types.ts';

import { useGraphStore } from '#glitch-graph/graph/graph-store.ts';
import { getModelOrder } from '#glitch-graph/graph/graph-utils.ts';

export type FlowEdge = Edge<RoutedEdgeData, 'routed'>;

// Suffixed so `output` does not pick up React Flow's built-in output node styles
export type FlowNode = Node<Record<string, never>, `${NodeKind}-node`>;

export interface FocusRequest {
	id: string;
	kind: 'edge' | 'node';
}

interface GraphChange {
	graph: Graph;
	loadedPreset: object | undefined;
}

interface FlowState {
	applyNodeChanges: (changes: Array<NodeChange<FlowNode>>) => void;
	clearFocusRequest: () => void;
	commitLayout: (result: LayoutResult) => void;
	edges: Array<FlowEdge>;
	focusRequest: FocusRequest | undefined;
	hasLayout: boolean;
	isDebug: boolean;
	isFullscreen: boolean;
	layoutDuration: number | undefined;
	nodes: Array<FlowNode>;
	requestFocus: (request: FocusRequest) => void;
	resetView: () => void;
	setDebug: (isDebug: boolean) => void;
	setFullscreen: (isFullscreen: boolean) => void;
	sizeVersion: number;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- React Flow edge data must satisfy `Record<string, unknown>`, which an interface does not
type RoutedEdgeData = {
	route: EdgeRoute | undefined;
};

export const useFlowStore = create<FlowState>()((set) => {
	const { graph } = useGraphStore.getState();

	useGraphStore.subscribe(handleGraphChange);

	return {
		applyNodeChanges: (changes) => {
			const hasResize = changes.some((change) => change.type === 'dimensions');

			set(({ nodes, sizeVersion }) => ({
				nodes: applyNodeChanges(changes, nodes),
				sizeVersion: hasResize ? sizeVersion + 1 : sizeVersion,
			}));
		},
		clearFocusRequest: () => {
			set({ focusRequest: undefined });
		},
		commitLayout: ({ duration, positions, routes }) => {
			set(({ edges, nodes }) => ({
				edges: edges.map((edge) => ({ ...edge, data: { route: routes.get(edge.id) } })),
				hasLayout: true,
				layoutDuration: duration,
				nodes: nodes.map((node) => ({
					...node,
					className: '',
					position: positions.get(node.id) ?? node.position,
				})),
			}));
		},
		edges: toFlowEdges(graph, new Map()),
		focusRequest: undefined,
		hasLayout: false,
		isDebug: false,
		isFullscreen: false,
		layoutDuration: undefined,
		nodes: toFlowNodes(graph, new Map()),
		requestFocus: (request) => {
			set({ focusRequest: request });
		},
		resetView: () => {
			set({ hasLayout: false });
		},
		setDebug: (isDebug) => {
			set({ isDebug });
		},
		// The canvas changes shape, so the view it was fitted to is gone
		setFullscreen: (isFullscreen) => {
			set({ hasLayout: false, isFullscreen });
		},
		sizeVersion: 0,
	};
});

// Reached through the store api rather than the creator's `set`, which would push the creator past its line cap
function handleGraphChange({ graph, loadedPreset }: GraphChange, previous: GraphChange) {
	// A Look load, or a history step across one, puts up a graph the current view was never fitted to
	if (loadedPreset !== previous.loadedPreset) useFlowStore.setState({ hasLayout: false });

	if (graph.edges === previous.graph.edges) return;

	useFlowStore.setState(({ edges, nodes }) => ({
		edges: toFlowEdges(graph, new Map(edges.map((edge) => [edge.id, edge]))),
		nodes: toFlowNodes(graph, new Map(nodes.map((node) => [node.id, node]))),
	}));
}

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
