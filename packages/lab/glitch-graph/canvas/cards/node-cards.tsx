import { Input } from '@base-ui/react/input';

import type { EffectNode, ParamValue, ParamValues, SplitNode } from '../../graph/graph-types.ts';
import type { ParamDefinition } from '../../graph/param-definitions.ts';

import { effectDefinitions, predicateDefinitions } from '../../graph/param-definitions.ts';
import { ParamControl } from '../../ui/param-control.tsx';

type ParamChangeHandler = (key: string, value: ParamValue) => void;

interface ParamsCardProps {
	definition: ParamDefinition;
	onDelete: () => void;
	onParamChange: ParamChangeHandler;
	params: ParamValues;
	title: string;
}

export function EffectCard({
	node,
	onDelete,
	onParamChange,
}: {
	node: EffectNode;
	onDelete: () => void;
	onParamChange: ParamChangeHandler;
}) {
	const definition = effectDefinitions[node.effect];

	return (
		<ParamsCard
			definition={definition}
			onDelete={onDelete}
			onParamChange={onParamChange}
			params={node.params}
			title={definition.label}
		/>
	);
}

export function OutputCard({ name, onRename }: { name: string; onRename: (name: string) => void }) {
	return (
		<div className="gg-pill nokey" data-kind="output">
			<Input
				aria-label="Output name"
				className="gg-output-name nodrag nopan"
				onValueChange={onRename}
				value={name}
			/>
		</div>
	);
}

export function PillCard({
	kind,
	label,
	onDelete,
}: {
	kind: 'fork' | 'merge';
	label: string;
	onDelete: () => void;
}) {
	return (
		<div className="gg-pill nokey" data-kind={kind}>
			<span className="gg-node-title">{label}</span>
			<DeleteButton label={label} onDelete={onDelete} />
		</div>
	);
}

export function SourceCard({ size }: { size: undefined | { height: number; width: number } }) {
	return (
		<div className="gg-node nokey" data-kind="source">
			<p className="gg-node-title">Source</p>
			<p className="gg-node-meta">
				{size === undefined ? 'Loading image…' : `${String(size.width)} × ${String(size.height)}`}
			</p>
		</div>
	);
}

export function SplitCard({
	node,
	onDelete,
	onParamChange,
}: {
	node: SplitNode;
	onDelete: () => void;
	onParamChange: ParamChangeHandler;
}) {
	const definition = predicateDefinitions[node.predicate];

	return (
		<ParamsCard
			definition={definition}
			onDelete={onDelete}
			onParamChange={onParamChange}
			params={node.params}
			title={`Split · ${definition.label}`}
		/>
	);
}

function DeleteButton({ label, onDelete }: { label: string; onDelete: () => void }) {
	return (
		<button
			aria-label={`Delete ${label}`}
			className="gg-delete-button nodrag nopan"
			onClick={onDelete}
			type="button"
		>
			×
		</button>
	);
}

function ParamsCard({ definition, onDelete, onParamChange, params, title }: ParamsCardProps) {
	return (
		<div className="gg-node nokey">
			<div className="gg-node-header">
				<p className="gg-node-title">{title}</p>
				<DeleteButton label={title} onDelete={onDelete} />
			</div>
			<div className="gg-node-params">
				{definition.params.map((spec) => (
					<ParamControl
						key={spec.key}
						onChange={(value) => {
							onParamChange(spec.key, value);
						}}
						spec={spec}
						value={params[spec.key]}
					/>
				))}
			</div>
		</div>
	);
}
