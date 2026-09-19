import type { IntBuffer } from '@thi.ng/pixel';
import type { IRandom } from '@thi.ng/random';

import type { ParamValues } from '#glitch-graph/graph/graph-types.ts';

import { wrap } from '#glitch-graph/engine/frame.ts';
import { readNumber } from '#glitch-graph/graph/param-definitions.ts';

export function sliceDisplacement(input: IntBuffer, params: ParamValues, random: IRandom) {
	const { height, width } = input;
	const maxOffset = Math.round(readNumber(params, 'maxOffset'));
	const output = input.copy();
	const cuts = getCuts(height, Math.round(readNumber(params, 'slices')), random);

	for (let index = 0; index < cuts.length - 1; index++) {
		const top = cuts[index] ?? 0;
		const sliceHeight = (cuts[index + 1] ?? height) - top;
		const offset = wrap(random.minmaxInt(-maxOffset, maxOffset + 1), width);

		// `blit` reads a zero width as the full width, so an unmoved slice must skip it
		if (offset === 0) continue;

		input.blit(output, { dx: offset, dy: top, h: sliceHeight, sy: top, w: width - offset });
		input.blit(output, { dx: 0, dy: top, h: sliceHeight, sx: width - offset, sy: top, w: offset });
	}

	return output;
}

function getCuts(height: number, slices: number, random: IRandom) {
	const cuts = new Set([0, height]);

	for (let index = 1; index < Math.min(slices, height); index++) {
		cuts.add(random.minmaxInt(1, height));
	}

	return [...cuts].toSorted((first, second) => first - second);
}
