import type { ParamValues } from './graph-types.ts';

export interface ParamDefinition {
	label: string;
	params: ReadonlyArray<ParamSpec>;
}

export type ParamSpec = RangeParam | SelectParam;

export interface RangeParam {
	default: number;
	key: string;
	kind: 'range';
	label: string;
	max: number;
	min: number;
	step: number;
}

export interface SelectParam {
	default: string;
	key: string;
	kind: 'select';
	label: string;
	options: ReadonlyArray<{ label: string; value: string }>;
}

export const effectDefinitions = {
	'channel-shift': {
		label: 'Channel shift',
		params: [
			{
				default: 'red',
				key: 'channel',
				kind: 'select',
				label: 'Channel',
				options: [
					{ label: 'Red', value: 'red' },
					{ label: 'Green', value: 'green' },
					{ label: 'Blue', value: 'blue' },
				],
			},
			{ default: 12, key: 'dx', kind: 'range', label: 'Shift x', max: 64, min: -64, step: 1 },
			{ default: 0, key: 'dy', kind: 'range', label: 'Shift y', max: 64, min: -64, step: 1 },
		],
	},
} as const satisfies Record<string, ParamDefinition>;

export const predicateDefinitions = {
	luminance: {
		label: 'Luminance',
		params: [
			{
				default: 128,
				key: 'threshold',
				kind: 'range',
				label: 'Threshold',
				max: 255,
				min: 0,
				step: 1,
			},
		],
	},
} as const satisfies Record<string, ParamDefinition>;

export function getDefaultParams(definition: ParamDefinition): ParamValues {
	return Object.fromEntries(definition.params.map((param) => [param.key, param.default]));
}

export function readNumber(params: ParamValues, key: string) {
	const value = params[key];

	return typeof value === 'number' ? value : 0;
}

export function readString(params: ParamValues, key: string) {
	const value = params[key];

	return typeof value === 'string' ? value : '';
}
