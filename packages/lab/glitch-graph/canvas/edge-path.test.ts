import { describe, expect, it } from 'vitest';

import { buildRoundedPath } from './edge-path.ts';

describe('buildRoundedPath', () => {
	it('draws a straight segment as a single line', () => {
		expect(
			buildRoundedPath(
				[
					{ x: 0, y: 0 },
					{ x: 0, y: 100 },
				],
				8,
			),
		).toBe('M 0 0 L 0 100');
	});

	it('rounds a single bend with the full radius', () => {
		expect(
			buildRoundedPath(
				[
					{ x: 0, y: 0 },
					{ x: 0, y: 50 },
					{ x: 40, y: 50 },
				],
				8,
			),
		).toBe('M 0 0 L 0 42 Q 0 50 8 50 L 40 50');
	});

	it('clamps the radius to half of a short segment', () => {
		expect(
			buildRoundedPath(
				[
					{ x: 0, y: 0 },
					{ x: 0, y: 50 },
					{ x: 6, y: 50 },
					{ x: 6, y: 100 },
				],
				8,
			),
		).toBe('M 0 0 L 0 47 Q 0 50 3 50 L 3 50 Q 6 50 6 53 L 6 100');
	});
});
