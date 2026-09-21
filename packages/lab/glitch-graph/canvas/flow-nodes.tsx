import type { NodeProps, NodeTypes } from '@xyflow/react';

import { Handle, Position, useEdges } from '@xyflow/react';

import type { FlowEdge, FlowNode } from '#glitch-graph/canvas/flow-store.ts';
import type { GraphNode, ParamValue } from '#glitch-graph/graph/graph-types.ts';

import { inspectStage, useRunStore } from '#glitch-graph/app/run-store.ts';
import {
	EffectCard,
	ForkCard,
	MergeCard,
	OutputCard,
	SourceCard,
	SplitCard,
} from '#glitch-graph/canvas/cards/node-cards.tsx';
import { useFlowStore } from '#glitch-graph/canvas/flow-store.ts';
import { InsertMenu } from '#glitch-graph/canvas/insert-menu.tsx';
import { useGraphStore } from '#glitch-graph/graph/graph-store.ts';
import { effectDefinitions, predicateDefinitions } from '#glitch-graph/graph/param-definitions.ts';

interface EditableCardProps {
	node: Extract<GraphNode, { kind: 'effect' | 'fork' | 'merge' | 'split' }>;
	onDelete: () => void;
	onParamChange: (key: string, value: ParamValue) => void;
	onParamCommit: (label: string) => void;
}

const branchHandleOffsets = ['30%', '70%'];

const portCounts = {
	effect: { inputs: 1, outputs: 1 },
	fork: { inputs: 1, outputs: 2 },
	merge: { inputs: 2, outputs: 1 },
	split: { inputs: 1, outputs: 2 },
} as const;

function EditableCard({ node, onDelete, onParamChange, onParamCommit }: EditableCardProps) {
	switch (node.kind) {
		case 'effect': {
			const { label } = effectDefinitions[node.effect];

			return (
				<EffectCard
					node={node}
					onDelete={onDelete}
					onInspect={() => void inspectStage(node.id, label)}
					onParamChange={onParamChange}
					onParamCommit={onParamCommit}
				/>
			);
		}
		// A Fork passes its input through, so there is nothing of its own to look at
		case 'fork': {
			return <ForkCard onDelete={onDelete} />;
		}
		case 'merge': {
			return (
				<MergeCard
					onDelete={onDelete}
					onInspect={() => void inspectStage(node.id, 'Merge')}
					onParamChange={onParamChange}
					onParamCommit={onParamCommit}
					params={node.params}
				/>
			);
		}
		case 'split': {
			const { label } = predicateDefinitions[node.predicate];

			return (
				<SplitCard
					node={node}
					onDelete={onDelete}
					onInspect={() => void inspectStage(node.id, `${label} Split mask`)}
					onParamChange={onParamChange}
					onParamCommit={onParamCommit}
				/>
			);
		}
	}
}

function EditableFlowNode({ id, positionAbsoluteX, positionAbsoluteY }: NodeProps<FlowNode>) {
	const node = useGraphStore((state) => state.graph.nodes[id]);
	const { handleParamChange, handleParamCommit } = useNodeParams(id);
	const handleDelete = useDeleteNode(id);

	if (node === undefined || node.kind === 'output' || node.kind === 'source') return;

	const { inputs, outputs } = portCounts[node.kind];

	return (
		<>
			<FlowHandles inputs={inputs} outputs={outputs} />
			<EditableCard
				node={node}
				onDelete={handleDelete}
				onParamChange={handleParamChange}
				onParamCommit={handleParamCommit}
			/>
			<OutgoingInsertMenus id={id} x={positionAbsoluteX} y={positionAbsoluteY} />
		</>
	);
}

function FlowHandles({ inputs, outputs }: { inputs: number; outputs: number }) {
	return (
		<>
			{Array.from({ length: inputs }, (_, index) => (
				<Handle
					className="gg-handle"
					id={`in-${String(index)}`}
					isConnectable={false}
					key={`in-${String(index)}`}
					position={Position.Top}
					style={inputs > 1 ? { left: branchHandleOffsets[index] } : undefined}
					type="target"
				/>
			))}
			{Array.from({ length: outputs }, (_, index) => (
				<Handle
					className="gg-handle"
					id={`out-${String(index)}`}
					isConnectable={false}
					key={`out-${String(index)}`}
					position={Position.Bottom}
					style={outputs > 1 ? { left: branchHandleOffsets[index] } : undefined}
					type="source"
				/>
			))}
		</>
	);
}

// Inside the source node so Tab reaches each "+" in graph order, not all of them first
// Read from React Flow's store, which also places the node, so the offset never lags a render
function OutgoingInsertMenus({ id, x, y }: { id: string; x: number; y: number }) {
	const edges = useEdges<FlowEdge>();

	return edges.map(({ data, id: edgeId, source }) => {
		if (source !== id || data?.route === undefined) return;

		const { button } = data.route;

		return (
			<InsertMenu
				edgeId={edgeId}
				key={edgeId}
				style={{
					transform: `translate(-50%, -50%) translate(${String(button.x - x)}px, ${String(button.y - y)}px)`,
				}}
			/>
		);
	});
}

function OutputFlowNode({ id }: NodeProps<FlowNode>) {
	const node = useGraphStore((state) => state.graph.nodes[id]);
	const renameOutput = useGraphStore((state) => state.renameOutput);
	const commitEdit = useGraphStore((state) => state.commitEdit);

	if (node?.kind !== 'output') return;

	return (
		<>
			<FlowHandles inputs={1} outputs={0} />
			<OutputCard
				name={node.name}
				onCommit={() => {
					commitEdit('Rename Output');
				}}
				onRename={(name) => {
					renameOutput(id, name);
				}}
			/>
		</>
	);
}

function SourceFlowNode({ id, positionAbsoluteX, positionAbsoluteY }: NodeProps<FlowNode>) {
	const meta = useRunStore(({ source, sourceError }) => {
		if (source !== undefined) return `${String(source.width)} × ${String(source.height)}`;

		return sourceError === undefined ? 'Loading image…' : 'No image';
	});

	return (
		<>
			<FlowHandles inputs={0} outputs={1} />
			<SourceCard meta={meta} />
			<OutgoingInsertMenus id={id} x={positionAbsoluteX} y={positionAbsoluteY} />
		</>
	);
}

function useDeleteNode(id: string) {
	const deleteNode = useGraphStore((state) => state.deleteNode);
	const requestFocus = useFlowStore((state) => state.requestFocus);

	return () => {
		const bridgeId = deleteNode(id);

		if (bridgeId !== undefined) requestFocus({ id: bridgeId, kind: 'edge' });
	};
}

function useNodeParams(id: string) {
	const setParam = useGraphStore((state) => state.setParam);
	const commitEdit = useGraphStore((state) => state.commitEdit);

	return {
		handleParamChange: (key: string, value: ParamValue) => {
			setParam(id, key, value);
		},
		handleParamCommit: (label: string) => {
			commitEdit(`Set ${label}`);
		},
	};
}

export const nodeTypes = {
	'effect-node': EditableFlowNode,
	'fork-node': EditableFlowNode,
	'merge-node': EditableFlowNode,
	'output-node': OutputFlowNode,
	'source-node': SourceFlowNode,
	'split-node': EditableFlowNode,
} satisfies NodeTypes;
