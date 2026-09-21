import type { EdgeTypes } from '@xyflow/react';
import type { RefObject } from 'react';

import {
	Background,
	BackgroundVariant,
	Controls,
	getNodesBounds,
	getViewportForBounds,
	Panel,
	ReactFlow,
	useNodesInitialized,
	useReactFlow,
	useStore,
	useStoreApi,
	ViewportPortal,
} from '@xyflow/react';
import { useEffect, useRef } from 'react';

import type { FlowEdge, FlowNode, FocusRequest } from '#glitch-graph/canvas/flow-store.ts';
import type { NodeSize } from '#glitch-graph/canvas/layout.ts';
import type { Graph } from '#glitch-graph/graph/graph-types.ts';

import { useRunStore } from '#glitch-graph/app/run-store.ts';
import { nodeTypes } from '#glitch-graph/canvas/flow-nodes.tsx';
import { useFlowStore } from '#glitch-graph/canvas/flow-store.ts';
import { layoutGraph } from '#glitch-graph/canvas/layout.ts';
import { RoutedEdge } from '#glitch-graph/canvas/routed-edge.tsx';
import { useGraphStore } from '#glitch-graph/graph/graph-store.ts';
import { getStructureSignature } from '#glitch-graph/graph/graph-utils.ts';

const edgeTypes = { routed: RoutedEdge } satisfies EdgeTypes;

// The dense preset only fits whole below the usual floor, and zooming out again should not snap back
const minZoom = 0.1;

const fitViewOptions = { maxZoom: 1, padding: 0.08 };

const readableZoom = 0.5;

const readableTopInset = 24;

// Zooming in stops at twice the whole-graph view, though never short of 1:1
const zoomInFactor = 2;

// eslint-disable-next-line unicorn/no-null -- React Flow only turns the delete key off with `null`
const deleteKeyCode = null;

export function GraphCanvas() {
	const nodes = useFlowStore((state) => state.nodes);
	const edges = useFlowStore((state) => state.edges);
	const hasLayout = useFlowStore((state) => state.hasLayout);
	const isDebug = useFlowStore((state) => state.isDebug);
	const applyNodeChanges = useFlowStore((state) => state.applyNodeChanges);
	const canvasRef = useRef<HTMLDivElement>(null);
	const maxZoom = useMaxZoom(nodes);

	useMeasuredLayout();
	useFocusRequest(canvasRef);
	useResetViewOnUnmount();

	return (
		<div className="gg-canvas" data-ready={hasLayout} ref={canvasRef}>
			<ReactFlow<FlowNode, FlowEdge>
				deleteKeyCode={deleteKeyCode}
				disableKeyboardA11y={true}
				edges={edges}
				edgesFocusable={false}
				edgeTypes={edgeTypes}
				elementsSelectable={false}
				maxZoom={maxZoom}
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
				<Background gap={16} variant={BackgroundVariant.Dots} />
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

function getInitialViewport(nodes: Array<FlowNode>, width: number, height: number) {
	const bounds = getNodesBounds(nodes);
	const fit = getViewportForBounds(
		bounds,
		width,
		height,
		minZoom,
		fitViewOptions.maxZoom,
		fitViewOptions.padding,
	);
	const source = nodes.find((node) => node.type === 'source-node');

	if (source === undefined || fit.zoom >= readableZoom) return fit;

	const sourceCentre = source.position.x + (source.measured?.width ?? 0) / 2;

	return {
		x: width / 2 - sourceCentre * readableZoom,
		y: readableTopInset - bounds.y * readableZoom,
		zoom: readableZoom,
	};
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

function useMaxZoom(nodes: Array<FlowNode>) {
	const width = useStore((state) => state.width);
	const height = useStore((state) => state.height);

	if (width === 0 || height === 0 || nodes.length === 0) return 1;

	const { zoom } = getViewportForBounds(
		getNodesBounds(nodes),
		width,
		height,
		minZoom,
		fitViewOptions.maxZoom,
		fitViewOptions.padding,
	);

	return Math.max(1, zoom * zoomInFactor);
}

// Nodes are read inside the effect rather than depended on, which would loop (xyflow #4153)
function useMeasuredLayout() {
	const sizeVersion = useFlowStore((state) => state.sizeVersion);
	const hasLayout = useFlowStore((state) => state.hasLayout);
	const commitLayout = useFlowStore((state) => state.commitLayout);
	const structureSignature = useGraphStore((state) => getStructureSignature(state.graph));
	const nodesInitialized = useNodesInitialized();
	const { getNodes, setViewport } = useReactFlow<FlowNode, FlowEdge>();
	const storeApi = useStoreApi<FlowNode, FlowEdge>();
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

			if (hasLayout) return;

			const { height, width } = storeApi.getState();

			void setViewport(getInitialViewport(useFlowStore.getState().nodes, width, height));
		});
	}, [
		commitLayout,
		getNodes,
		hasLayout,
		nodesInitialized,
		setViewport,
		sizeVersion,
		storeApi,
		structureSignature,
	]);
}

// The stores outlive the island, which `<ClientRouter />` remounts; a kept `hasLayout` skips the initial view
function useResetViewOnUnmount() {
	const resetView = useFlowStore((state) => state.resetView);

	useEffect(() => {
		return () => {
			resetView();
		};
	}, [resetView]);
}
