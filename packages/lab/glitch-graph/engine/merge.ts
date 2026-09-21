import type { IntBuffer } from '@thi.ng/pixel';

import type { ParamValues } from '#glitch-graph/graph/graph-types.ts';

import { readString } from '#glitch-graph/graph/param-definitions.ts';

export interface MergeInput {
	branchA: IntBuffer;
	branchB: IntBuffer;
	mask: Uint8Array;
	params: ParamValues;
}

type ChannelBlend = (a: number, b: number) => number;

const colourShifts = [0, 8, 16];

// Normal has no entry: it keeps branch A's pixel, which the copy already holds
const blends: Record<string, ChannelBlend> = {
	darken: (a, b) => Math.min(a, b),
	difference: (a, b) => Math.abs(a - b),
	lighten: (a, b) => Math.max(a, b),
	multiply: (a, b) => Math.round((a * b) / 255),
	screen: (a, b) => 255 - Math.round(((255 - a) * (255 - b)) / 255),
};

export function mergeByMask({ branchA, branchB, mask, params }: MergeInput) {
	const blend = blends[readString(params, 'blend')];
	const output = branchA.copy();

	let index = 0;

	for (const isSet of mask) {
		if (isSet === 0) {
			output.data[index] = branchB.data[index] ?? 0;
		} else if (blend !== undefined) {
			output.data[index] = blendPixel(branchA.data[index] ?? 0, branchB.data[index] ?? 0, blend);
		}

		index++;
	}

	return output;
}

function blendPixel(a: number, b: number, blend: ChannelBlend) {
	let pixel = a & 0xff_00_00_00;

	for (const colourShift of colourShifts) {
		pixel |= blend((a >>> colourShift) & 0xff, (b >>> colourShift) & 0xff) << colourShift;
	}

	return pixel >>> 0;
}
