import type { IntBuffer } from '@thi.ng/pixel';

import type { ParamValues } from '../../graph/graph-types.ts';

import { readNumber } from '../../graph/param-definitions.ts';

export function luminanceMask(input: IntBuffer, params: ParamValues) {
	const threshold = readNumber(params, 'threshold');
	const { data } = input;
	const mask = new Uint8Array(data.length);

	let index = 0;

	for (const pixel of data) {
		const luma =
			0.2126 * (pixel & 0xff) + 0.7152 * ((pixel >>> 8) & 0xff) + 0.0722 * ((pixel >>> 16) & 0xff);

		mask[index] = luma >= threshold ? 1 : 0;
		index++;
	}

	return mask;
}
