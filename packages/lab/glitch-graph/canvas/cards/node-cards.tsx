import { Input } from '@base-ui/react/input';

import type {
	EffectNode,
	ParamValue,
	ParamValues,
	SplitNode,
} from '#glitch-graph/graph/graph-types.ts';
import type { ParamDefinition } from '#glitch-graph/graph/param-definitions.ts';

import { effectDefinitions, predicateDefinitions } from '#glitch-graph/graph/param-definitions.ts';
import { ParamControl } from '#glitch-graph/ui/param-control.tsx';

type ParamChangeHandler = (key: string, value: ParamValue) => void;

interface ParamsCardProps {
	definition: ParamDefinition;
	onDelete: () => void;
	onParamChange: ParamChangeHandler;
	params: ParamValues;
	removalLabel: string;
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
			removalLabel={`Delete ${definition.label}`}
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
	removalLabel,
}: {
	kind: 'fork' | 'merge';
	label: string;
	onDelete: () => void;
	removalLabel: string;
}) {
	return (
		<div className="gg-pill nokey" data-kind={kind}>
			<span className="gg-node-title">{label}</span>
			<DeleteButton label={removalLabel} onDelete={onDelete} />
		</div>
	);
}

export function SourceCard({ meta }: { meta: string }) {
	return (
		<div className="gg-node nokey" data-kind="source">
			<p className="gg-node-title">Source</p>
			<p className="gg-node-meta">{meta}</p>
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
			removalLabel={`Delete this ${definition.label} Split, its Merge and everything between them`}
			title={`Split · ${definition.label}`}
		/>
	);
}

function DeleteButton({ label, onDelete }: { label: string; onDelete: () => void }) {
	return (
		<button
			aria-label={label}
			className="gg-delete-button nodrag nopan"
			onClick={onDelete}
			title={label}
			type="button"
		>
			×
		</button>
	);
}

function ParamsCard({
	definition,
	onDelete,
	onParamChange,
	params,
	removalLabel,
	title,
}: ParamsCardProps) {
	return (
		<div className="gg-node nokey">
			<div className="gg-node-header">
				<p className="gg-node-title">{title}</p>
				<DeleteButton label={removalLabel} onDelete={onDelete} />
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
