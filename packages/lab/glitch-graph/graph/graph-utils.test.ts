import { describe, expect, it } from 'vitest';

import { insertNode } from '#glitch-graph/graph/graph-operations.ts';
import { createDiamondForkPreset } from '#glitch-graph/graph/graph-presets.ts';
import { getAncestors } from '#glitch-graph/graph/graph-utils.ts';

describe('getAncestors', () => {
	const preset = createDiamondForkPreset();

	it('walks both branches of a diamond back to the Source', () => {
		expect(getAncestors(preset, 'n5')).toEqual(new Set(['n1', 'n2', 'n3', 'n4', 'n5']));

		const withBranchB = insertNode(preset, 'n3.1-n5.1', {
			effect: 'channel-shift',
			kind: 'effect',
		});
		const insertedId = Object.keys(withBranchB.nodes).find((id) => preset.nodes[id] === undefined);

		expect(getAncestors(withBranchB, 'n5')).toContain(insertedId);
	});

	it('reaches through a Fork to a forked Output', () => {
		expect(getAncestors(preset, 'n8')).toEqual(new Set(['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n8']));
	});

	it('gives the Source itself alone', () => {
		expect(getAncestors(preset, 'n1')).toEqual(new Set(['n1']));
	});
});
