import type { IntBuffer } from '@thi.ng/pixel';

import { SFC32 } from '@thi.ng/random';
import { describe, expect, it } from 'vitest';

import { dither } from '#glitch-graph/engine/effects/dither.ts';
import { gradientMap } from '#glitch-graph/engine/effects/gradient-map.ts';
import { pixelSort } from '#glitch-graph/engine/effects/pixel-sort.ts';
import { sliceDisplacement } from '#glitch-graph/engine/effects/slice-displacement.ts';
import { createFrame, createGradientFrame, createGray } from '#glitch-graph/engine/test-frames.ts';

function getColourValues(frame: IntBuffer) {
	return new Set(
		[...frame.data].flatMap((pixel) => [pixel & 0xff, (pixel >>> 8) & 0xff, (pixel >>> 16) & 0xff]),
	);
}

function getRotation(row: Array<number>, rotated: Array<number>) {
	return row.findIndex((_, offset) =>
		rotated.every((pixel, x) => pixel === row[(x - offset + row.length) % row.length]),
	);
}

function getRow(frame: IntBuffer, y: number) {
	return [...frame.data.subarray(y * frame.width, (y + 1) * frame.width)];
}

describe('pixelSort', () => {
	const dark = createGray(10);
	const pixels = [dark, createGray(200), createGray(120), createGray(160), dark, createGray(250)];
	const sorted = [dark, createGray(120), createGray(160), createGray(200), dark, createGray(250)];

	it('sorts each bright run along a row, darkest first', () => {
		const output = pixelSort(createFrame(6, 1, pixels), { axis: 'horizontal', threshold: 100 });

		expect([...output.data]).toEqual(sorted);
	});

	it('sorts down columns on the vertical axis', () => {
		const output = pixelSort(createFrame(1, 6, pixels), { axis: 'vertical', threshold: 100 });

		expect([...output.data]).toEqual(sorted);
	});

	it('leaves pixels below the threshold where they are', () => {
		const output = pixelSort(createFrame(6, 1, pixels), { axis: 'horizontal', threshold: 255 });

		expect([...output.data]).toEqual(pixels);
	});
});

describe('sliceDisplacement', () => {
	const frame = createFrame(
		16,
		12,
		Array.from({ length: 16 * 12 }, (_, index) => index),
	);

	it('rotates whole rows only, and moves some of them', () => {
		const output = sliceDisplacement(frame, { maxOffset: 8, slices: 6 }, new SFC32([3, 2, 0, 0]));
		const rotations = Array.from({ length: frame.height }, (_, y) =>
			getRotation(getRow(frame, y), getRow(output, y)),
		);

		expect(rotations).not.toContain(-1);
		expect(rotations.some((offset) => offset !== 0)).toBe(true);
	});

	it('changes nothing with a zero max offset', () => {
		const output = sliceDisplacement(frame, { maxOffset: 0, slices: 6 }, new SFC32([3, 2, 0, 0]));

		expect([...output.data]).toEqual([...frame.data]);
	});
});

describe('dither', () => {
	it.each(['bayer-4', 'bayer-8', 'floyd-steinberg', 'atkinson'])(
		'%s at two levels leaves only full-off or full-on colour values and keeps alpha',
		(kernel) => {
			const frame = createGradientFrame(16, 16);

			for (const [index, pixel] of frame.data.entries())
				frame.data[index] = (pixel & 0xff_ff_ff) | 0x80_00_00_00;

			const before = [...frame.data];
			const output = dither(frame, { kernel, levels: 2 });

			expect(getColourValues(output)).toEqual(new Set([0, 255]));
			expect(new Set([...output.data].map((pixel) => pixel >>> 24))).toEqual(new Set([0x80]));
			expect([...frame.data]).toEqual(before);
		},
	);
});

describe('gradientMap', () => {
	it('maps by luma alone, keeping each pixel’s alpha', () => {
		const red = 0xff_00_00_ff;
		const sameLumaGray = createGray(Math.round(0.2126 * 255), 0x40);
		const output = gradientMap(createFrame(2, 1, [red, sameLumaGray]), { preset: 'heat1' });
		const [first = 0, second = 0] = output.data;

		expect(first & 0xff_ff_ff).toBe(second & 0xff_ff_ff);
		expect([first >>> 24, second >>> 24]).toEqual([0xff, 0x40]);
	});
});
