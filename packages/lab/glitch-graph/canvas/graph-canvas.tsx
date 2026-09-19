import type { EdgeTypes } from '@xyflow/react';

import { Controls, ReactFlow, useNodesInitialized, useReactFlow } from '@xyflow/react';
import { useEffect, useRef } from 'react';

import type { Graph } from '../graph/graph-types.ts';
import type { FlowEdge, FlowNode } from './flow-store.ts';
import type { NodeSize } from './layout.ts';

import { useGraphStore } from '../graph/graph-store.ts';
import { getStructureSignature } from '../graph/graph-utils.ts';
import { nodeTypes } from './flow-nodes.tsx';
import { useFlowStore } from './flow-store.ts';
import { layoutGraph } from './layout.ts';
import { RoutedEdge } from './routed-edge.tsx';

const edgeTypes = { routed: RoutedEdge } satisfies EdgeTypes;

const fitViewOptions = { maxZoom: 1, padding: 0.08 };

// eslint-disable-next-line unicorn/no-null -- React Flow only turns the delete key off with `null`
const deleteKeyCode = null;

export function GraphCanvas() {
	const nodes = useFlowStore((state) => state.nodes);
	const edges = useFlowStore((state) => state.edges);
	const hasLayout = useFlowStore((state) => state.hasLayout);
	const applyNodeChanges = useFlowStore((state) => state.applyNodeChanges);

	useMeasuredLayout();

	return (
		<div className="gg-canvas" data-ready={hasLayout}>
			<ReactFlow<FlowNode, FlowEdge>
				deleteKeyCode={deleteKeyCode}
				disableKeyboardA11y={true}
				edges={edges}
				edgesFocusable={false}
				edgeTypes={edgeTypes}
				elementsSelectable={false}
				maxZoom={1.5}
				minZoom={0.25}
				nodes={nodes}
				nodesConnectable={false}
				nodesDraggable={false}
				nodesFocusable={false}
				nodeTypes={nodeTypes}
				onNodesChange={applyNodeChanges}
				preventScrolling={false}
				zoomOnDoubleClick={false}
				zoomOnScroll={false}
			>
				<Controls showInteractive={false} />
			</ReactFlow>
		</div>
	);
}

function getLayoutSignature(graph: Graph, sizes: ReadonlyMap<string, NodeSize>) {
	const sizeSignature = [...sizes]
		.map(([id, { height, width }]) => `${id}:${String(width)}x${String(height)}`)
		.join(' ');

	return `${getStructureSignature(graph)}|${sizeSignature}`;
}

// Nodes are read inside the effect rather than depended on, which would loop (xyflow #4153)
function useMeasuredLayout() {
	const sizeVersion = useFlowStore((state) => state.sizeVersion);
	const hasLayout = useFlowStore((state) => state.hasLayout);
	const commitLayout = useFlowStore((state) => state.commitLayout);
	const structureSignature = useGraphStore((state) => getStructureSignature(state.graph));
	const nodesInitialized = useNodesInitialized();
	const { fitView, getNodes } = useReactFlow<FlowNode, FlowEdge>();
	const layoutRef = useRef({ sequence: 0, signature: '' });

	useEffect(() => {
		const flowNodes = getNodes();

		// `useNodesInitialized` lags one render behind an insert, so an unmeasured node can still be here
		if (!nodesInitialized || flowNodes.some((node) => node.measured?.height === undefined)) return;

		const sizes = new Map(
			flowNodes.map((node) => [
				node.id,
				{ height: node.measured?.height ?? 0, width: node.measured?.width ?? 0 },
			]),
		);
		const { graph } = useGraphStore.getState();
		const signature = getLayoutSignature(graph, sizes);
		const layoutState = layoutRef.current;

		if (hasLayout && signature === layoutState.signature) return;

		layoutState.signature = signature;
		layoutState.sequence += 1;

		const { sequence } = layoutState;

		void layoutGraph(graph, sizes).then((result) => {
			if (sequence !== layoutState.sequence) return;

			commitLayout(result);

			if (!hasLayout) void fitView(fitViewOptions);
		});
	}, [
		commitLayout,
		fitView,
		getNodes,
		hasLayout,
		nodesInitialized,
		sizeVersion,
		structureSignature,
	]);
}
