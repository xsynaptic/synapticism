import type { NodeProps, NodeTypes } from '@xyflow/react';

import { Handle, Position } from '@xyflow/react';

import type { ParamValue } from '../graph/graph-types.ts';
import type { FlowNode } from './flow-store.ts';

import { useRunStore } from '../app/run-store.ts';
import { useGraphStore } from '../graph/graph-store.ts';
import { EffectCard, OutputCard, PillCard, SourceCard, SplitCard } from './cards/node-cards.tsx';
import { useFlowStore } from './flow-store.ts';

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

function OutputFlowNode({ id }: NodeProps<FlowNode>) {
	const node = useGraphStore((state) => state.graph.nodes[id]);
	const renameOutput = useGraphStore((state) => state.renameOutput);

	if (node?.kind !== 'output') return;

	return (
		<>
			<FlowHandles inputs={1} outputs={0} />
			<OutputCard
				name={node.name}
				onRename={(name) => {
					renameOutput(id, name);
				}}
			/>
		</>
	);
}

function ParamsFlowNode({ id }: NodeProps<FlowNode>) {
	const node = useGraphStore((state) => state.graph.nodes[id]);
	const setParam = useGraphStore((state) => state.setParam);
	const handleDelete = useDeleteNode(id);

	function handleParamChange(key: string, value: ParamValue) {
		setParam(id, key, value);
	}

	if (node?.kind === 'effect') {
		return (
			<>
				<FlowHandles inputs={1} outputs={1} />
				<EffectCard node={node} onDelete={handleDelete} onParamChange={handleParamChange} />
			</>
		);
	}

	if (node?.kind === 'split') {
		return (
			<>
				<FlowHandles inputs={1} outputs={2} />
				<SplitCard node={node} onDelete={handleDelete} onParamChange={handleParamChange} />
			</>
		);
	}

	return;
}

function PillFlowNode({ id }: NodeProps<FlowNode>) {
	const kind = useGraphStore((state) => state.graph.nodes[id]?.kind);
	const handleDelete = useDeleteNode(id);

	if (kind !== 'fork' && kind !== 'merge') return;

	const { inputs, label, outputs, removalLabel } = pillShapes[kind];

	return (
		<>
			<FlowHandles inputs={inputs} outputs={outputs} />
			<PillCard kind={kind} label={label} onDelete={handleDelete} removalLabel={removalLabel} />
		</>
	);
}

function SourceFlowNode() {
	const meta = useRunStore(({ source, sourceError }) => {
		if (source !== undefined) return `${String(source.width)} × ${String(source.height)}`;

		return sourceError === undefined ? 'Loading image…' : 'No image';
	});

	return (
		<>
			<FlowHandles inputs={0} outputs={1} />
			<SourceCard meta={meta} />
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
