import { Input } from '@base-ui/react/input';

import type {
	EffectNode,
	ParamValue,
	ParamValues,
	SplitNode,
} from '#glitch-graph/graph/graph-types.ts';
import type { ParamDefinition } from '#glitch-graph/graph/param-definitions.ts';

import {
	effectDefinitions,
	mergeDefinition,
	predicateDefinitions,
} from '#glitch-graph/graph/param-definitions.ts';
import { ParamControl } from '#glitch-graph/ui/param-control.tsx';

type ParamChangeHandler = (key: string, value: ParamValue) => void;

const [blendSpec] = mergeDefinition.params;

interface ParamsCardProps extends ParamsNodeProps {
	definition: ParamDefinition;
	inspectLabel: string;
	params: ParamValues;
	removalLabel: string;
	title: string;
}

interface ParamsNodeProps {
	onDelete: () => void;
	onInspect: () => void;
	onParamChange: ParamChangeHandler;
	onParamCommit: (label: string) => void;
}

export function EffectCard({
	node,
	onDelete,
	onInspect,
	onParamChange,
	onParamCommit,
}: ParamsNodeProps & { node: EffectNode }) {
	const definition = effectDefinitions[node.effect];

	return (
		<ParamsCard
			definition={definition}
			inspectLabel={`View the frame leaving ${definition.label}`}
			onDelete={onDelete}
			onInspect={onInspect}
			onParamChange={onParamChange}
			onParamCommit={onParamCommit}
			params={node.params}
			removalLabel={`Delete ${definition.label}`}
			title={definition.label}
		/>
	);
}

export function ForkCard({ onDelete }: { onDelete: () => void }) {
	return (
		<div className="gg-pill nokey" data-kind="fork">
			<span className="gg-node-title">Fork</span>
			<DeleteButton label="Delete this Fork and everything on its branch" onDelete={onDelete} />
		</div>
	);
}

export function MergeCard({
	onDelete,
	onInspect,
	onParamChange,
	onParamCommit,
	params,
}: ParamsNodeProps & { params: ParamValues }) {
	return (
		<div className="gg-pill nokey" data-kind="merge">
			<InspectButton label="View the frame leaving this Merge" onInspect={onInspect} />
			<ParamControl
				onChange={(value) => {
					onParamChange(blendSpec.key, value);
				}}
				onCommit={onParamCommit}
				spec={blendSpec}
				value={params[blendSpec.key]}
			/>
			<DeleteButton
				label="Delete this Merge, its Split and everything between them"
				onDelete={onDelete}
			/>
		</div>
	);
}

export function OutputCard({
	name,
	onCommit,
	onRename,
}: {
	name: string;
	onCommit: () => void;
	onRename: (name: string) => void;
}) {
	return (
		<div className="gg-pill nokey" data-kind="output">
			<Input
				aria-label="Output name"
				className="gg-output-name nodrag nopan"
				onBlur={onCommit}
				onValueChange={onRename}
				value={name}
			/>
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
	onInspect,
	onParamChange,
	onParamCommit,
}: ParamsNodeProps & { node: SplitNode }) {
	const definition = predicateDefinitions[node.predicate];

	return (
		<ParamsCard
			definition={definition}
			inspectLabel={`View the mask this ${definition.label} Split selects`}
			onDelete={onDelete}
			onInspect={onInspect}
			onParamChange={onParamChange}
			onParamCommit={onParamCommit}
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

function InspectButton({ label, onInspect }: { label: string; onInspect: () => void }) {
	return (
		<button
			aria-label={label}
			className="gg-inspect-button nodrag nopan"
			onClick={onInspect}
			title={label}
			type="button"
		>
			◎
		</button>
	);
}

function ParamsCard({
	definition,
	inspectLabel,
	onDelete,
	onInspect,
	onParamChange,
	onParamCommit,
	params,
	removalLabel,
	title,
}: ParamsCardProps) {
	return (
		<div className="gg-node nokey">
			<div className="gg-node-header">
				<p className="gg-node-title">{title}</p>
				<div className="gg-node-actions">
					<InspectButton label={inspectLabel} onInspect={onInspect} />
					<DeleteButton label={removalLabel} onDelete={onDelete} />
				</div>
			</div>
			<div className="gg-node-params">
				{definition.params.map((spec) => (
					<ParamControl
						key={spec.key}
						onChange={(value) => {
							onParamChange(spec.key, value);
						}}
						onCommit={onParamCommit}
						spec={spec}
						value={params[spec.key]}
					/>
				))}
			</div>
		</div>
	);
}
