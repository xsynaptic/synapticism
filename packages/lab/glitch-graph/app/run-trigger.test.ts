import { describe, expect, it } from 'vitest';

import type { TriggerState } from '#glitch-graph/app/run-trigger.ts';
import type { Graph } from '#glitch-graph/graph/graph-types.ts';

import { getRunQuality } from '#glitch-graph/app/run-trigger.ts';
import { createDiamondForkPreset } from '#glitch-graph/graph/graph-presets.ts';

function createState(graph: Graph): TriggerState {
	return { graph, history: [{ graph }], historyIndex: 0, seed: 1 };
}

function withNode(graph: Graph, id: string, changes: Record<string, unknown>): Graph {
	const node = graph.nodes[id];

	if (node === undefined) throw new Error(`Preset lost ${id}`);

	return { ...graph, nodes: { ...graph.nodes, [id]: { ...node, ...changes } } };
}

describe('getRunQuality', () => {
	const preset = createDiamondForkPreset();
	const state = createState(preset);

	it('asks for nothing when neither the graph nor the seed moved', () => {
		expect(getRunQuality(state, state)).toBeUndefined();
	});

	it('asks for a full run when an edit was committed', () => {
		const next = { ...state, history: [...state.history, { graph: preset }] };

		expect(getRunQuality(state, next)).toBe('full');
	});

	it('asks for a full run when history stepped, as undo and redo do', () => {
		expect(getRunQuality(state, { ...state, historyIndex: 1 })).toBe('full');
	});

	it('asks for a preview while a param is being dragged', () => {
		const dragged = withNode(preset, 'n2', { params: { channel: 'red', dx: 4, dy: 0 } });

		expect(getRunQuality(state, { ...state, graph: dragged })).toBe('preview');
	});

	it('asks for a preview when the seed changes without a commit', () => {
		expect(getRunQuality(state, { ...state, seed: 2 })).toBe('preview');
	});

	it('asks for nothing when an Output was renamed, which changes no pixels', () => {
		const renamed = withNode(preset, 'n7', { name: 'Renamed' });

		expect(getRunQuality(state, { ...state, graph: renamed })).toBeUndefined();
	});
});
