import type { IntBuffer } from '@thi.ng/pixel';

import { COSINE_GRADIENTS, cosineGradient } from '@thi.ng/color';

import type { ParamValues } from '../../graph/graph-types.ts';

import { gradientMapPresets, readString } from '../../graph/param-definitions.ts';
import { getLuma } from '../frame.ts';

const lookupSize = 256;

export function gradientMap(input: IntBuffer, params: ParamValues) {
	const lookup = buildLookup(readString(params, 'preset'));
	const output = input.copy();
	const { data } = output;

	for (const [index, pixel] of data.entries()) {
		data[index] = (pixel & 0xff_00_00_00) | (lookup[Math.round(getLuma(pixel))] ?? 0);
	}

	return output;
}

// Packs each colour as ABGR with alpha cleared, so the pixel's own alpha can be ORed back in
function buildLookup(presetName: string) {
	const preset = gradientMapPresets.find((option) => option.value === presetName)?.value ?? 'heat1';
	const colours = cosineGradient(lookupSize, COSINE_GRADIENTS[preset]);

	return Uint32Array.from(colours, (colour) => {
		const [red = 0, green = 0, blue = 0] = [...colour].map((value) => Math.round(value * 255));

		return (blue << 16) | (green << 8) | red;
	});
}
