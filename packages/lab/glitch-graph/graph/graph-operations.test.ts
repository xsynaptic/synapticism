import { describe, expect, it } from 'vitest';

import type { Insertion } from './graph-operations.ts';
import type { Graph, GraphNode, NodeKind } from './graph-types.ts';

import { canDelete, deleteNode, getNodeCount, insertNode, nodeCap } from './graph-operations.ts';
import { createBlankGraph, createDiamondForkPreset, graphPresets } from './graph-presets.ts';
import { effectKinds, predicateKinds } from './param-definitions.ts';

const expectedPorts = {
	effect: { inputs: [0], outputs: [0] },
	fork: { inputs: [0], outputs: [0, 1] },
	merge: { inputs: [0, 1], outputs: [0] },
	output: { inputs: [0], outputs: [] },
	source: { inputs: [], outputs: [0] },
	split: { inputs: [0], outputs: [0, 1] },
} as const satisfies Record<NodeKind, { inputs: Array<number>; outputs: Array<number> }>;

const insertions: Array<Insertion> = [
	{ effect: 'channel-shift', kind: 'effect' },
	{ kind: 'split', predicate: 'luminance' },
	{ kind: 'fork' },
];

const densePreset = graphPresets[2].create();

function countSortable(graph: Graph) {
	const pending = new Map(Object.keys(graph.nodes).map((id) => [id, 0]));

	for (const edge of graph.edges) pending.set(edge.target, (pending.get(edge.target) ?? 0) + 1);

	const ready = [...pending].filter(([, count]) => count === 0).map(([id]) => id);
	let sorted = 0;

	while (ready.length > 0) {
		const id = ready.pop();

		sorted += 1;
		ready.push(...releaseTargets(graph, id, pending));
	}

	return sorted;
}

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

function getNodeViolations(graph: Graph, node: GraphNode) {
	const violations: Array<string> = [];
	const inputs = graph.edges
		.filter((edge) => edge.target === node.id)
		.map((edge) => edge.targetIndex)
		.toSorted((first, second) => first - second);
	const outputs = graph.edges
		.filter((edge) => edge.source === node.id)
		.map((edge) => edge.sourceIndex)
		.toSorted((first, second) => first - second);

	if (String(inputs) !== String(expectedPorts[node.kind].inputs)) {
		violations.push(`${node.id} inputs [${String(inputs)}]`);
	}

	if (String(outputs) !== String(expectedPorts[node.kind].outputs)) {
		violations.push(`${node.id} outputs [${String(outputs)}]`);
	}

	if (!isPaired(graph, node)) violations.push(`${node.id} is not paired`);

	return violations;
}

// Per-kind port sets imply every leaf is an Output and every Split has two branches
function getViolations(graph: Graph) {
	const nodes = Object.values(graph.nodes);
	const sourceCount = nodes.filter((node) => node.kind === 'source').length;
	const violations = nodes.flatMap((node) => getNodeViolations(graph, node));

	if (sourceCount !== 1) violations.push(`${String(sourceCount)} Sources`);

	for (const edge of graph.edges) {
		if (graph.nodes[edge.source] === undefined || graph.nodes[edge.target] === undefined) {
			violations.push(`${edge.id} dangles`);
		}
	}

	if (countSortable(graph) !== nodes.length) violations.push('cycle');

	return violations;
}

function isPaired(graph: Graph, node: GraphNode) {
	if (node.kind === 'split') {
		const merge = graph.nodes[node.mergeId];

		return merge?.kind === 'merge' && merge.splitId === node.id;
	}

	if (node.kind === 'merge') return graph.nodes[node.splitId]?.kind === 'split';

	return true;
}

function releaseTargets(graph: Graph, id: string | undefined, pending: Map<string, number>) {
	const released: Array<string> = [];

	for (const edge of graph.edges) {
		if (edge.source !== id) continue;

		const count = (pending.get(edge.target) ?? 0) - 1;

		pending.set(edge.target, count);

		if (count === 0) released.push(edge.target);
	}

	return released;
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
