import type { NodeProps, NodeTypes } from '@xyflow/react';

import { Handle, Position } from '@xyflow/react';

import type { ParamValue } from '../graph/graph-types.ts';
import type { FlowNode } from './flow-store.ts';

import { useRunStore } from '../app/run-store.ts';
import { useGraphStore } from '../graph/graph-store.ts';
import { EffectCard, OutputCard, PillCard, SourceCard, SplitCard } from './cards/node-cards.tsx';

const branchHandleOffsets = ['30%', '70%'];

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

function ForkFlowNode() {
	return (
		<>
			<FlowHandles inputs={1} outputs={2} />
			<PillCard kind="fork" label="Fork" />
		</>
	);
}

function MergeFlowNode() {
	return (
		<>
			<FlowHandles inputs={2} outputs={1} />
			<PillCard kind="merge" label="Merge" />
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

	function handleParamChange(key: string, value: ParamValue) {
		setParam(id, key, value);
	}

	if (node?.kind === 'effect') {
		return (
			<>
				<FlowHandles inputs={1} outputs={1} />
				<EffectCard node={node} onParamChange={handleParamChange} />
			</>
		);
	}

	if (node?.kind === 'split') {
		return (
			<>
				<FlowHandles inputs={1} outputs={2} />
				<SplitCard node={node} onParamChange={handleParamChange} />
			</>
		);
	}

	return;
}

function SourceFlowNode() {
	const source = useRunStore((state) => state.source);

	return (
		<>
			<FlowHandles inputs={0} outputs={1} />
			<SourceCard
				size={source === undefined ? undefined : { height: source.height, width: source.width }}
			/>
		</>
	);
}

export const nodeTypes = {
	'effect-node': ParamsFlowNode,
	'fork-node': ForkFlowNode,
	'merge-node': MergeFlowNode,
	'output-node': OutputFlowNode,
	'source-node': SourceFlowNode,
	'split-node': ParamsFlowNode,
} satisfies NodeTypes;
