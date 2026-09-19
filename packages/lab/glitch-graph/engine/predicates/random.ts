import type { IntBuffer } from '@thi.ng/pixel';
import type { IRandom } from '@thi.ng/random';

import type { ParamValues } from '../../graph/graph-types.ts';

import { readNumber } from '../../graph/param-definitions.ts';

export function randomMask(input: IntBuffer, params: ParamValues, random: IRandom) {
	const { height, width } = input;
	const probability = readNumber(params, 'percentage') / 100;
	const blockSize = Math.max(1, Math.round(readNumber(params, 'blockSize')));
	const columns = Math.ceil(width / blockSize);
	const rows = Math.ceil(height / blockSize);
	const blocks = Array.from({ length: columns * rows }, () => random.probability(probability));
	const mask = new Uint8Array(width * height);

	for (let y = 0; y < height; y++) {
		const blockRow = Math.floor(y / blockSize) * columns;

		for (let x = 0; x < width; x++) {
			mask[y * width + x] = blocks[blockRow + Math.floor(x / blockSize)] === true ? 1 : 0;
		}
	}

	return mask;
}
