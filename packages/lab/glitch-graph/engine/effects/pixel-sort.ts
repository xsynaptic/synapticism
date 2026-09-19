import type { IntBuffer } from '@thi.ng/pixel';

import type { ParamValues } from '#glitch-graph/graph/graph-types.ts';

import { getLuma } from '#glitch-graph/engine/frame.ts';
import { readNumber, readString } from '#glitch-graph/graph/param-definitions.ts';

const pixelRange = 2 ** 32;

export function pixelSort(input: IntBuffer, params: ParamValues) {
	const { height, width } = input;
	const threshold = readNumber(params, 'threshold');
	const output = input.copy();

	if (readString(params, 'axis') === 'vertical') {
		sortColumns(output, threshold);

		return output;
	}

	for (let y = 0; y < height; y++) {
		sortLine(output.data.subarray(y * width, (y + 1) * width), threshold);
	}

	return output;
}

function sortColumns({ data, height, width }: IntBuffer, threshold: number) {
	const column = new Uint32Array(height);

	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) column[y] = data[y * width + x] ?? 0;

		sortLine(column, threshold);

		for (let y = 0; y < height; y++) data[y * width + x] = column[y] ?? 0;
	}
}

function sortLine(line: IntBuffer['data'], threshold: number) {
	let runStart = 0;

	for (let position = 0; position <= line.length; position++) {
		const isInRun = position < line.length && getLuma(line[position] ?? 0) >= threshold;

		if (isInRun) continue;
		if (position - runStart > 1) sortRun(line.subarray(runStart, position));

		runStart = position + 1;
	}
}

// Packing luma above the pixel lets a typed-array sort order by luma, then pixel value, with no comparator
function sortRun(run: IntBuffer['data']) {
	const keys = new Float64Array(run).map(
		(pixel) => Math.round(getLuma(pixel)) * pixelRange + pixel,
	);

	keys.sort();
	run.set(keys.map((key) => key % pixelRange));
}
