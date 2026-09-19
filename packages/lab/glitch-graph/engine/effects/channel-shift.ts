import type { IntBuffer } from '@thi.ng/pixel';

import type { ParamValues } from '../../graph/graph-types.ts';

import { readNumber, readString } from '../../graph/param-definitions.ts';

const channelBitOffsets: Record<string, number> = { blue: 16, green: 8, red: 0 };

export function channelShift(input: IntBuffer, params: ParamValues) {
	const { height, width } = input;
	const channelMask = (0xff << (channelBitOffsets[readString(params, 'channel')] ?? 0)) >>> 0;
	const dx = Math.round(readNumber(params, 'dx'));
	const dy = Math.round(readNumber(params, 'dy'));
	const source = input.data;
	const output = input.copy();
	const target = output.data;

	for (let y = 0; y < height; y++) {
		const sourceRow = wrap(y - dy, height) * width;

		for (let x = 0; x < width; x++) {
			const index = y * width + x;
			const shifted = source[sourceRow + wrap(x - dx, width)] ?? 0;

			target[index] = ((source[index] ?? 0) & ~channelMask) | (shifted & channelMask);
		}
	}

	return output;
}

function wrap(value: number, size: number) {
	return ((value % size) + size) % size;
}
