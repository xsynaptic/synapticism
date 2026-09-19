import type { IntBuffer } from '@thi.ng/pixel';

import type { ParamValues } from '../../graph/graph-types.ts';

import { readNumber } from '../../graph/param-definitions.ts';
import { getLuma } from '../frame.ts';

export function luminanceMask(input: IntBuffer, params: ParamValues) {
	const threshold = readNumber(params, 'threshold');
	const { data } = input;
	const mask = new Uint8Array(data.length);

	let index = 0;

	for (const pixel of data) {
		mask[index] = getLuma(pixel) >= threshold ? 1 : 0;
		index++;
	}

	return mask;
}
