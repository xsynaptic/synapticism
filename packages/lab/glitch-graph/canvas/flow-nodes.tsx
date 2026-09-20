import type { NodeProps, NodeTypes } from '@xyflow/react';

import { Handle, Position, useEdges } from '@xyflow/react';

import type { FlowEdge, FlowNode } from '#glitch-graph/canvas/flow-store.ts';
import type { ParamValue } from '#glitch-graph/graph/graph-types.ts';

import { useRunStore } from '#glitch-graph/app/run-store.ts';
import {
	EffectCard,
	OutputCard,
	PillCard,
	SourceCard,
	SplitCard,
} from '#glitch-graph/canvas/cards/node-cards.tsx';
import { useFlowStore } from '#glitch-graph/canvas/flow-store.ts';
import { InsertMenu } from '#glitch-graph/canvas/insert-menu.tsx';
import { useGraphStore } from '#glitch-graph/graph/graph-store.ts';

const branchHandleOffsets = ['30%', '70%'];

const pillShapes = {
	fork: {
		inputs: 1,
		label: 'Fork',
		outputs: 2,
		removalLabel: 'Delete this Fork and everything on its branch',
	},
	merge: {
		inputs: 2,
		label: 'Merge',
		outputs: 1,
		removalLabel: 'Delete this Merge, its Split and everything between them',
	},
} as const;

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

function ParamsFlowNode({ id, positionAbsoluteX, positionAbsoluteY }: NodeProps<FlowNode>) {
	const node = useGraphStore((state) => state.graph.nodes[id]);
	const setParam = useGraphStore((state) => state.setParam);
	const commitEdit = useGraphStore((state) => state.commitEdit);
	const handleDelete = useDeleteNode(id);

	function handleParamChange(key: string, value: ParamValue) {
		setParam(id, key, value);
	}

	function handleParamCommit(label: string) {
		commitEdit(`Set ${label}`);
	}

	if (node?.kind === 'effect') {
		return (
			<>
				<FlowHandles inputs={1} outputs={1} />
				<EffectCard
					node={node}
					onDelete={handleDelete}
					onParamChange={handleParamChange}
					onParamCommit={handleParamCommit}
				/>
				<OutgoingInsertMenus id={id} x={positionAbsoluteX} y={positionAbsoluteY} />
			</>
		);
	}

	if (node?.kind === 'split') {
		return (
			<>
				<FlowHandles inputs={1} outputs={2} />
				<SplitCard
					node={node}
					onDelete={handleDelete}
					onParamChange={handleParamChange}
					onParamCommit={handleParamCommit}
				/>
				<OutgoingInsertMenus id={id} x={positionAbsoluteX} y={positionAbsoluteY} />
			</>
		);
	}

	return;
}

function PillFlowNode({ id, positionAbsoluteX, positionAbsoluteY }: NodeProps<FlowNode>) {
	const kind = useGraphStore((state) => state.graph.nodes[id]?.kind);
	const handleDelete = useDeleteNode(id);

	if (kind !== 'fork' && kind !== 'merge') return;

	const { inputs, label, outputs, removalLabel } = pillShapes[kind];

	return (
		<>
			<FlowHandles inputs={inputs} outputs={outputs} />
			<PillCard kind={kind} label={label} onDelete={handleDelete} removalLabel={removalLabel} />
			<OutgoingInsertMenus id={id} x={positionAbsoluteX} y={positionAbsoluteY} />
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

export const nodeTypes = {
	'effect-node': ParamsFlowNode,
	'fork-node': PillFlowNode,
	'merge-node': PillFlowNode,
	'output-node': OutputFlowNode,
	'source-node': SourceFlowNode,
	'split-node': ParamsFlowNode,
} satisfies NodeTypes;
