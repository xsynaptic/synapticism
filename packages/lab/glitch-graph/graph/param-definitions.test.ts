import { describe, expect, it } from 'vitest';

import { createDiamondForkPreset } from './graph-presets.ts';
import { getInsertLabel } from './param-definitions.ts';

describe('getInsertLabel', () => {
	const graph = createDiamondForkPreset();

	it.each([
		['n1.0-n2.0', 'Insert after Source'],
		['n2.0-n3.0', 'Insert after Channel shift'],
		['n3.0-n4.0', 'Insert after Luminance Split, bright branch'],
		['n3.1-n5.1', 'Insert after Luminance Split, dark branch'],
		['n5.0-n6.0', 'Insert after Merge'],
		['n6.0-n7.0', 'Insert after Fork, left branch'],
		['n6.1-n8.0', 'Insert after Fork, right branch'],
	])('names %s by what it follows', (edgeId, label) => {
		expect(getInsertLabel(graph, edgeId)).toBe(label);
	});
});
