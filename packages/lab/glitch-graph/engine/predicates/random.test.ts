import { SFC32 } from '@thi.ng/random';
import { describe, expect, it } from 'vitest';

import { createGradientFrame } from '../test-frames.ts';
import { randomMask } from './random.ts';

const frame = createGradientFrame(10, 8);

function createMask(percentage: number, blockSize: number) {
	return randomMask(frame, { blockSize, percentage }, new SFC32([5, 3, 0, 0]));
}

describe('randomMask', () => {
	it.each([
		[0, 0],
		[100, 1],
	])('sets nothing or everything at %i%%', (percentage, expected) => {
		expect(new Set(createMask(percentage, 4))).toEqual(new Set([expected]));
	});

	it('holds one value per block, clipped at the frame edge', () => {
		const mask = createMask(50, 4);
		const blockValues = new Map<string, Set<number>>();

		for (const [index, value] of mask.entries()) {
			const key = `${String(Math.floor((index % 10) / 4))},${String(Math.floor(index / 10 / 4))}`;

			blockValues.set(key, (blockValues.get(key) ?? new Set()).add(value));
		}

		expect(blockValues.size).toBe(6);
		expect(blockValues.values().every((values) => values.size === 1)).toBe(true);
		expect(new Set(mask)).toEqual(new Set([0, 1]));
	});
});
