import { describe, expect, it } from 'vitest';

import type { Insertion } from '#glitch-graph/graph/graph-operations.ts';
import type { Graph } from '#glitch-graph/graph/graph-types.ts';

import {
	canDelete,
	deleteNode,
	getNodeCount,
	insertNode,
	nodeCap,
} from '#glitch-graph/graph/graph-operations.ts';
import {
	createBlankGraph,
	createDiamondForkPreset,
	graphPresets,
} from '#glitch-graph/graph/graph-presets.ts';
import { effectKinds, predicateKinds } from '#glitch-graph/graph/param-definitions.ts';
import { getViolations } from '#glitch-graph/graph/test-validity.ts';

const insertions: Array<Insertion> = [
	{ effect: 'channel-shift', kind: 'effect' },
	{ kind: 'split', predicate: 'luminance' },
	{ kind: 'fork' },
];

const densePreset = graphPresets[2].create();

function fillWithEffects(graph: Graph, target: number) {
	let filled = graph;

	while (getNodeCount(filled) < target) {
		const next = insertNode(filled, filled.edges[0]?.id ?? '', {
			effect: 'channel-shift',
			kind: 'effect',
		});

		if (next === filled) break;

		filled = next;
	}

	return filled;
}

function getEdgeIds(graph: Graph) {
	return graph.edges.map((edge) => edge.id);
}

describe('presets', () => {
	it.each([
		...graphPresets.map((preset) => [preset.id, preset.create()] as const),
		['blank', createBlankGraph()] as const,
	])('%s is valid and within the cap', (_, graph) => {
		expect(getViolations(graph)).toEqual([]);
		expect(getNodeCount(graph)).toBeLessThanOrEqual(nodeCap);
	});

	it('builds the dense preset from every one of its edits', () => {
		expect(getNodeCount(densePreset)).toBe(36);
	});

	it('uses every effect and predicate in the dense preset', () => {
		const kinds = new Set(
			Object.values(densePreset.nodes).flatMap((node) => {
				if (node.kind === 'effect') return [node.effect];
				if (node.kind === 'split') return [node.predicate];

				return [];
			}),
		);

		expect(kinds).toEqual(new Set([...effectKinds, ...predicateKinds]));
	});
});

describe('insertNode', () => {
	const preset = createDiamondForkPreset();

	it.each(insertions)('keeps the graph valid when inserting $kind on any edge', (insertion) => {
		for (const edge of preset.edges) {
			expect(getViolations(insertNode(preset, edge.id, insertion))).toEqual([]);
		}
	});

	it('gives the first half the source index and the second half the target index', () => {
		const graph = insertNode(preset, 'n3.1-n5.1', { effect: 'channel-shift', kind: 'effect' });

		expect(getEdgeIds(graph)).toContain('n3.1-n9.0');
		expect(getEdgeIds(graph)).toContain('n9.0-n5.1');
		expect(getEdgeIds(graph)).not.toContain('n3.1-n5.1');
	});

	it('inserts a Split as a diamond with two empty branches', () => {
		const graph = insertNode(preset, 'n6.1-n8.0', { kind: 'split', predicate: 'luminance' });

		expect(getEdgeIds(graph)).toEqual(
			expect.arrayContaining(['n6.1-n9.0', 'n9.0-n10.0', 'n9.1-n10.1', 'n10.0-n8.0']),
		);
	});

	it('ends a Fork tee in a new Output with a unique name', () => {
		const graph = insertNode(preset, 'n2.0-n3.0', { kind: 'fork' });
		const output = graph.nodes.n10;

		expect(output?.kind === 'output' ? output.name : undefined).toBe('Output 3');
		expect(getEdgeIds(graph)).toContain('n9.1-n10.0');
	});

	it('leaves the graph unchanged for an unknown edge', () => {
		expect(insertNode(preset, 'n1.0-n9.0', { kind: 'fork' })).toBe(preset);
	});
});

describe('deleteNode', () => {
	it.each(
		Object.values(densePreset.nodes)
			.filter((node) => canDelete(node))
			.map((node) => node.id),
	)('keeps the dense preset valid when deleting %s', (id) => {
		const graph = deleteNode(densePreset, id);

		expect(getViolations(graph)).toEqual([]);
		expect(getNodeCount(graph)).toBeLessThan(getNodeCount(densePreset));
	});

	it('splices an Effect out, reconnecting with the inherited indices', () => {
		const graph = deleteNode(densePreset, 'n23');

		expect(graph.nodes.n23).toBeUndefined();
		expect(getEdgeIds(graph)).toContain('n21.0-n18.1');
	});

	it('removes a whole diamond, including Outputs forked inside it', () => {
		const graph = deleteNode(densePreset, 'n17');
		const removed = ['n17', 'n18', 'n19', 'n20', 'n21', 'n22', 'n23'];

		expect(removed.filter((id) => graph.nodes[id] !== undefined)).toEqual([]);
		expect(getNodeCount(graph)).toBe(getNodeCount(densePreset) - removed.length);
		expect(getEdgeIds(graph)).toContain('n16.0-n6.0');
	});

	it('removes the same diamond from either end', () => {
		expect(deleteNode(densePreset, 'n18')).toEqual(deleteNode(densePreset, 'n17'));
	});

	it('removes a Fork with everything down its tee', () => {
		const graph = deleteNode(densePreset, 'n6');

		expect(graph.nodes.n8).toBeUndefined();
		expect(graph.nodes.n24).toBeUndefined();
		expect(graph.nodes.n7).toBeDefined();
		expect(getEdgeIds(graph)).toContain('n18.0-n28.0');
	});

	it.each(['n1', 'n7', 'n8'])('refuses to delete %s', (id) => {
		expect(deleteNode(densePreset, id)).toBe(densePreset);
	});
});

describe('node cap', () => {
	it('stops inserting at the cap', () => {
		const full = fillWithEffects(createDiamondForkPreset(), nodeCap + 5);

		expect(getNodeCount(full)).toBe(nodeCap);
	});

	it('refuses a two-node insertion one below the cap but accepts an Effect', () => {
		const graph = fillWithEffects(createDiamondForkPreset(), nodeCap - 1);
		const edgeId = graph.edges[0]?.id ?? '';

		expect(insertNode(graph, edgeId, { kind: 'split', predicate: 'luminance' })).toBe(graph);
		expect(insertNode(graph, edgeId, { kind: 'fork' })).toBe(graph);
		expect(
			getNodeCount(insertNode(graph, edgeId, { effect: 'channel-shift', kind: 'effect' })),
		).toBe(nodeCap);
	});
});
