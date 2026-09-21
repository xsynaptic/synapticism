import type { IntBuffer } from '@thi.ng/pixel';

import type { ParamValues } from '#glitch-graph/graph/graph-types.ts';

import { getLuma } from '#glitch-graph/engine/frame.ts';
import { readNumber, readString } from '#glitch-graph/graph/param-definitions.ts';

const pixelRange = 2 ** 32;

export function pixelSort(input: IntBuffer, params: ParamValues) {
	const { height, width } = input;
	const threshold = readNumber(params, 'threshold');
	const output = input.copy();
	// One scratch for the whole frame; a run-sized allocation per run dominated the cost
	const keys = new Float64Array(Math.max(width, height));

	if (readString(params, 'axis') === 'vertical') {
		sortColumns(output, threshold, keys);

		return output;
	}

	for (let y = 0; y < height; y++) {
		sortLine(output.data.subarray(y * width, (y + 1) * width), threshold, keys);
	}

	return output;
}

function sortColumns({ data, height, width }: IntBuffer, threshold: number, keys: Float64Array) {
	const column = new Uint32Array(height);

	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) column[y] = data[y * width + x] ?? 0;

		sortLine(column, threshold, keys);

		for (let y = 0; y < height; y++) data[y * width + x] = column[y] ?? 0;
	}
}

function sortLine(line: IntBuffer['data'], threshold: number, keys: Float64Array) {
	let runStart = 0;

	for (let position = 0; position <= line.length; position++) {
		const isInRun = position < line.length && getLuma(line[position] ?? 0) >= threshold;

		if (isInRun) continue;
		if (position - runStart > 1) sortRun(line.subarray(runStart, position), keys);

		runStart = position + 1;
	}
}

// Packing luma above the pixel lets a typed-array sort order by luma, then pixel value, with no comparator
function sortRun(run: IntBuffer['data'], keys: Float64Array) {
	const packed = keys.subarray(0, run.length);

	// eslint-disable-next-line unicorn/no-for-loop -- `run.entries()` measured 3 ms slower per pass at 768²
	for (let index = 0; index < run.length; index++) {
		const pixel = run[index] ?? 0;

		packed[index] = Math.round(getLuma(pixel)) * pixelRange + pixel;
	}

	packed.sort();

	for (let index = 0; index < run.length; index++) run[index] = (packed[index] ?? 0) % pixelRange;
}
