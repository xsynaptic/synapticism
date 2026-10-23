import { Select } from '@base-ui/react/select';
import { Slider } from '@base-ui/react/slider';

import type { ParamValue } from '#glitch-graph/graph/graph-types.ts';
import type { ParamSpec, RangeParam, SelectParam } from '#glitch-graph/graph/param-definitions.ts';

import { ChevronDownIcon } from '#glitch-graph/ui/icons.tsx';
import { SelectPopup } from '#glitch-graph/ui/select-popup.tsx';

interface ParamControlProps<Spec extends ParamSpec = ParamSpec> {
	onChange: (value: ParamValue) => void;
	onCommit: (label: string) => void;
	spec: Spec;
	value: ParamValue | undefined;
}

export function ParamControl({ onChange, onCommit, spec, value }: ParamControlProps) {
	if (spec.kind === 'select') {
		return <ParamSelect onChange={onChange} onCommit={onCommit} spec={spec} value={value} />;
	}

	return <ParamSlider onChange={onChange} onCommit={onCommit} spec={spec} value={value} />;
}

function ParamSelect({ onChange, onCommit, spec, value }: ParamControlProps<SelectParam>) {
	return (
		<Select.Root
			items={spec.options}
			onValueChange={(next) => {
				if (typeof next !== 'string') return;

				onChange(next);
				onCommit(spec.label);
			}}
			value={typeof value === 'string' ? value : spec.default}
		>
			<Select.Label className="gg-param-label">{spec.label}</Select.Label>
			<Select.Trigger className="gg-select-trigger nodrag nopan">
				<Select.Value />
				<Select.Icon className="gg-select-icon">
					<ChevronDownIcon />
				</Select.Icon>
			</Select.Trigger>
			<SelectPopup options={spec.options} />
		</Select.Root>
	);
}

function ParamSlider({ onChange, onCommit, spec, value }: ParamControlProps<RangeParam>) {
	return (
		<Slider.Root
			className="gg-slider"
			max={spec.max}
			min={spec.min}
			onValueChange={(next) => {
				if (typeof next === 'number') onChange(next);
			}}
			onValueCommitted={() => {
				onCommit(spec.label);
			}}
			step={spec.step}
			value={typeof value === 'number' ? value : spec.default}
		>
			<div className="gg-param-header">
				<Slider.Label className="gg-param-label">{spec.label}</Slider.Label>
				<Slider.Value className="gg-param-value" />
			</div>
			<Slider.Control className="gg-slider-control nodrag nopan">
				<Slider.Track className="gg-slider-track">
					<Slider.Indicator className="gg-slider-indicator" />
					<Slider.Thumb className="gg-slider-thumb" />
				</Slider.Track>
			</Slider.Control>
		</Slider.Root>
	);
}
