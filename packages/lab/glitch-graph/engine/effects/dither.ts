import type { IntBuffer } from '@thi.ng/pixel';
import type { DitherKernel } from '@thi.ng/pixel-dither';

import { ATKINSON, FLOYD_STEINBERG, orderedDither } from '@thi.ng/pixel-dither';

import type { ParamValues } from '#glitch-graph/graph/graph-types.ts';

import { readNumber, readString } from '#glitch-graph/graph/param-definitions.ts';

const bayerSizes: Record<string, 4 | 8> = { 'bayer-4': 4, 'bayer-8': 8 };

const diffusionKernels: Record<string, DitherKernel> = {
	atkinson: ATKINSON,
	'floyd-steinberg': FLOYD_STEINBERG,
};

interface Diffusion {
	shift: number;
	step: number;
	taps: Array<{ dx: number; dy: number; weight: number }>;
}

const colourShifts = [0, 8, 16];

export function dither(input: IntBuffer, params: ParamValues) {
	const kernel = readString(params, 'kernel');
	const levels = Math.max(2, Math.round(readNumber(params, 'levels')));
	const output = input.copy();
	const bayerSize = bayerSizes[kernel];

	// ABGR channel order; zero levels leaves alpha alone
	if (bayerSize !== undefined) return orderedDither(output, bayerSize, [0, levels, levels, levels]);

	diffuseError(output, diffusionKernels[kernel] ?? FLOYD_STEINBERG, levels);

	return output;
}

function diffuseChannel(
	channel: Int32Array,
	{ width }: IntBuffer,
	{ shift, step, taps }: Diffusion,
) {
	for (let index = 0; index < channel.length; index++) {
		const x = index % width;
		const value = channel[index] ?? 0;
		const quantized = Math.round(Math.round(Math.min(255, Math.max(0, value)) / step) * step);
		const error = value - quantized;

		channel[index] = quantized;

		for (const { dx, dy, weight } of taps) {
			const tapIndex = index + dy * width + dx;

			if (x + dx >= 0 && x + dx < width && tapIndex < channel.length) {
				channel[tapIndex] = (channel[tapIndex] ?? 0) + ((error * weight) >> shift);
			}
		}
	}
}

// The library's `ditherWith` only quantizes to two levels and builds channels with `new Function`
function diffuseError(frame: IntBuffer, { ox, oy, shift, weights }: DitherKernel, levels: number) {
	const { data } = frame;
	const diffusion: Diffusion = {
		shift,
		step: 255 / (levels - 1),
		taps: weights.map((weight, index) => ({ dx: ox[index] ?? 0, dy: oy[index] ?? 0, weight })),
	};

	for (const colourShift of colourShifts) {
		const channel = new Int32Array(data.map((pixel) => (pixel >>> colourShift) & 0xff));
		const keptBits = ~(0xff << colourShift);

		diffuseChannel(channel, frame, diffusion);
		data.set(
			data.map((pixel, index) => (pixel & keptBits) | ((channel[index] ?? 0) << colourShift)),
		);
	}
}
