import type { EdgeTypes } from '@xyflow/react';
import type { RefObject } from 'react';

import {
	Controls,
	Panel,
	ReactFlow,
	useNodesInitialized,
	useReactFlow,
	ViewportPortal,
} from '@xyflow/react';
import { useEffect, useRef } from 'react';

import type { Graph } from '../graph/graph-types.ts';
import type { FlowEdge, FlowNode, FocusRequest } from './flow-store.ts';
import type { NodeSize } from './layout.ts';

import { useRunStore } from '../app/run-store.ts';
import { useGraphStore } from '../graph/graph-store.ts';
import { getStructureSignature } from '../graph/graph-utils.ts';
import { nodeTypes } from './flow-nodes.tsx';
import { useFlowStore } from './flow-store.ts';
import { layoutGraph } from './layout.ts';
import { RoutedEdge } from './routed-edge.tsx';

const edgeTypes = { routed: RoutedEdge } satisfies EdgeTypes;

// The dense preset only fits whole below the usual floor, and zooming out again should not snap back
const minZoom = 0.1;

const fitViewOptions = { maxZoom: 1, padding: 0.08 };

// eslint-disable-next-line unicorn/no-null -- React Flow only turns the delete key off with `null`
const deleteKeyCode = null;

export function GraphCanvas() {
	const nodes = useFlowStore((state) => state.nodes);
	const edges = useFlowStore((state) => state.edges);
	const hasLayout = useFlowStore((state) => state.hasLayout);
	const isDebug = useFlowStore((state) => state.isDebug);
	const applyNodeChanges = useFlowStore((state) => state.applyNodeChanges);
	const canvasRef = useRef<HTMLDivElement>(null);

	useMeasuredLayout();
	useFocusRequest(canvasRef);

	return (
		<div className="gg-canvas" data-ready={hasLayout} ref={canvasRef}>
			<ReactFlow<FlowNode, FlowEdge>
				deleteKeyCode={deleteKeyCode}
				disableKeyboardA11y={true}
				edges={edges}
				edgesFocusable={false}
				edgeTypes={edgeTypes}
				elementsSelectable={false}
				maxZoom={1.5}
				minZoom={minZoom}
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
				<Controls className="gg-controls" showInteractive={false} />
				{isDebug ? <DebugOverlay nodes={nodes} /> : undefined}
			</ReactFlow>
		</div>
	);
}

function DebugOverlay({ nodes }: { nodes: Array<FlowNode> }) {
	const layoutDuration = useFlowStore((state) => state.layoutDuration);
	const runDuration = useRunStore((state) => state.runDuration);

	return (
		<>
			<ViewportPortal>
				{nodes.map(({ id, measured, position }) => (
					<span
						className="gg-debug-badge"
						key={id}
						style={{ transform: `translate(${String(position.x)}px, ${String(position.y)}px)` }}
					>
						{`${formatNumber(measured?.width)}×${formatNumber(measured?.height)} @ ${formatNumber(position.x)},${formatNumber(position.y)}`}
					</span>
				))}
			</ViewportPortal>
			<Panel className="gg-debug-readout" position="top-right">
				<span>ELK {formatDuration(layoutDuration)}</span>
				<span>Run {formatDuration(runDuration)}</span>
			</Panel>
		</>
	);
}

function findFocusTarget(root: HTMLElement, { id, kind }: FocusRequest) {
	const selector =
		kind === 'edge'
			? `[data-edge-id="${CSS.escape(id)}"]`
			: `.react-flow__node[data-id="${CSS.escape(id)}"] :is(button, input, [tabindex="0"])`;

	return root.querySelector<HTMLElement>(selector);
}

function formatDuration(duration: number | undefined) {
	return duration === undefined ? '–' : `${duration.toFixed(1)} ms`;
}

function formatNumber(value: number | undefined) {
	return value === undefined ? '?' : String(Math.round(value));
}

function getLayoutSignature(graph: Graph, sizes: ReadonlyMap<string, NodeSize>) {
	const sizeSignature = [...sizes]
		.map(([id, { height, width }]) => `${id}:${String(width)}x${String(height)}`)
		.join(' ');

	return `${getStructureSignature(graph)}|${sizeSignature}`;
}

// The focused control unmounts with its edge or node, so focus lands on what replaced it once a layout shows it
function useFocusRequest(canvasRef: RefObject<HTMLDivElement | null>) {
	const focusRequest = useFlowStore((state) => state.focusRequest);
	const nodes = useFlowStore((state) => state.nodes);
	const edges = useFlowStore((state) => state.edges);
	const clearFocusRequest = useFlowStore((state) => state.clearFocusRequest);

	useEffect(() => {
		const root = canvasRef.current;

		if (focusRequest === undefined || root === null) return;

		// React Flow applies node and edge props a render after ours
		const frame = requestAnimationFrame(() => {
			const target = findFocusTarget(root, focusRequest);

			if (target?.checkVisibility({ visibilityProperty: true }) !== true) return;

			target.focus({ preventScroll: true });
			clearFocusRequest();
		});

		return () => {
			cancelAnimationFrame(frame);
		};
	}, [canvasRef, clearFocusRequest, edges, focusRequest, nodes]);
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
