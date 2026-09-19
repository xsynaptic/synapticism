import type { CosineGradientPreset } from '@thi.ng/color';

import type { Graph, GraphNode, ParamValues, SplitNode } from './graph-types.ts';

import { getEdgeWithSource } from './graph-utils.ts';

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

export const gradientMapPresets = [
	{ label: 'Heat', value: 'heat1' },
	{ label: 'Rainbow', value: 'rainbow1' },
	{ label: 'Blue magenta orange', value: 'blue-magenta-orange' },
	{ label: 'Purple orange cyan', value: 'purple-orange-cyan' },
	{ label: 'Yellow purple magenta', value: 'yellow-purple-magenta' },
	{ label: 'Green blue orange', value: 'green-blue-orange' },
	{ label: 'Cyan magenta', value: 'cyan-magenta' },
	{ label: 'Orange blue', value: 'orange-blue' },
] as const satisfies ReadonlyArray<{ label: string; value: CosineGradientPreset }>;

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
	dither: {
		label: 'Dither',
		params: [
			{
				default: 'bayer-4',
				key: 'kernel',
				kind: 'select',
				label: 'Kernel',
				options: [
					{ label: 'Bayer 4×4', value: 'bayer-4' },
					{ label: 'Bayer 8×8', value: 'bayer-8' },
					{ label: 'Floyd–Steinberg', value: 'floyd-steinberg' },
					{ label: 'Atkinson', value: 'atkinson' },
				],
			},
			{ default: 2, key: 'levels', kind: 'range', label: 'Levels', max: 8, min: 2, step: 1 },
		],
	},
	'gradient-map': {
		label: 'Gradient map',
		params: [
			{
				default: 'heat1',
				key: 'preset',
				kind: 'select',
				label: 'Gradient',
				options: gradientMapPresets,
			},
		],
	},
	'pixel-sort': {
		label: 'Pixel sort',
		params: [
			{
				default: 96,
				key: 'threshold',
				kind: 'range',
				label: 'Threshold',
				max: 255,
				min: 0,
				step: 1,
			},
			{
				default: 'horizontal',
				key: 'axis',
				kind: 'select',
				label: 'Axis',
				options: [
					{ label: 'Rows', value: 'horizontal' },
					{ label: 'Columns', value: 'vertical' },
				],
			},
		],
	},
	'slice-displacement': {
		label: 'Slice displacement',
		params: [
			{ default: 16, key: 'slices', kind: 'range', label: 'Slices', max: 48, min: 2, step: 1 },
			{
				default: 64,
				key: 'maxOffset',
				kind: 'range',
				label: 'Max offset',
				max: 256,
				min: 0,
				step: 1,
			},
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
	random: {
		label: 'Random',
		params: [
			{
				default: 75,
				key: 'percentage',
				kind: 'range',
				label: 'Percentage',
				max: 100,
				min: 0,
				step: 1,
			},
			{
				default: 16,
				key: 'blockSize',
				kind: 'range',
				label: 'Block size',
				max: 64,
				min: 1,
				step: 1,
			},
		],
	},
} as const satisfies Record<string, ParamDefinition>;

export const effectKinds = [
	'channel-shift',
	'pixel-sort',
	'slice-displacement',
	'dither',
	'gradient-map',
] as const satisfies ReadonlyArray<keyof typeof effectDefinitions>;

export const predicateKinds = ['luminance', 'random'] as const satisfies ReadonlyArray<
	keyof typeof predicateDefinitions
>;

export function getBranchLabel(split: SplitNode, branchIndex: number) {
	if (split.predicate === 'luminance') return branchIndex === 0 ? 'bright' : 'dark';

	const percentage = Math.round(readNumber(split.params, 'percentage'));

	return `${String(branchIndex === 0 ? percentage : 100 - percentage)}%`;
}

export function getDefaultParams(definition: ParamDefinition): ParamValues {
	return Object.fromEntries(definition.params.map((param) => [param.key, param.default]));
}

export function getInsertLabel(graph: Graph, edgeId: string) {
	const outlet = getEdgeWithSource(graph, edgeId);

	if (outlet === undefined) return 'Insert a node here';

	return `Insert after ${getOutletLabel(outlet.source, outlet.edge.sourceIndex)}`;
}

export function readNumber(params: ParamValues, key: string) {
	const value = params[key];

	return typeof value === 'number' ? value : 0;
}

export function readString(params: ParamValues, key: string) {
	const value = params[key];

	return typeof value === 'string' ? value : '';
}

// Branch A (index 0) is laid out on the left
function getOutletLabel(node: GraphNode, sourceIndex: number) {
	switch (node.kind) {
		case 'effect': {
			return effectDefinitions[node.effect].label;
		}
		case 'fork': {
			return `Fork, ${sourceIndex === 0 ? 'left' : 'right'} branch`;
		}
		case 'merge': {
			return 'Merge';
		}
		case 'output': {
			return node.name;
		}
		case 'source': {
			return 'Source';
		}
		case 'split': {
			return `${predicateDefinitions[node.predicate].label} Split, ${getBranchLabel(node, sourceIndex)} branch`;
		}
	}
}
