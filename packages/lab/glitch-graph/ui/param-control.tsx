import { Select } from '@base-ui/react/select';
import { Slider } from '@base-ui/react/slider';

import type { ParamValue } from '../graph/graph-types.ts';
import type { ParamSpec, RangeParam, SelectParam } from '../graph/param-definitions.ts';

import { usePortalContainer } from './portal-container.ts';

interface ParamControlProps<Spec extends ParamSpec = ParamSpec> {
	onChange: (value: ParamValue) => void;
	spec: Spec;
	value: ParamValue | undefined;
}

export function ParamControl({ onChange, spec, value }: ParamControlProps) {
	if (spec.kind === 'select') return <ParamSelect onChange={onChange} spec={spec} value={value} />;

	return <ParamSlider onChange={onChange} spec={spec} value={value} />;
}

function ParamSelect({ onChange, spec, value }: ParamControlProps<SelectParam>) {
	const container = usePortalContainer();

	return (
		<Select.Root
			items={spec.options}
			onValueChange={(next) => {
				if (typeof next === 'string') onChange(next);
			}}
			value={typeof value === 'string' ? value : spec.default}
		>
			<Select.Label className="gg-param-label">{spec.label}</Select.Label>
			<Select.Trigger className="gg-select-trigger nodrag nopan">
				<Select.Value />
				<Select.Icon className="gg-select-icon">▾</Select.Icon>
			</Select.Trigger>
			<Select.Portal container={container}>
				<Select.Positioner alignItemWithTrigger={false} className="gg-positioner" sideOffset={4}>
					<Select.Popup className="gg-select-popup nokey">
						<Select.List>
							{spec.options.map((option) => (
								<Select.Item className="gg-select-item" key={option.value} value={option.value}>
									<Select.ItemText>{option.label}</Select.ItemText>
								</Select.Item>
							))}
						</Select.List>
					</Select.Popup>
				</Select.Positioner>
			</Select.Portal>
		</Select.Root>
	);
}

function ParamSlider({ onChange, spec, value }: ParamControlProps<RangeParam>) {
	return (
		<Slider.Root
			className="gg-slider"
			max={spec.max}
			min={spec.min}
			onValueChange={(next) => {
				if (typeof next === 'number') onChange(next);
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
