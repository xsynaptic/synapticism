import { describe, expect, it } from 'vitest';

import type { TriggerState } from '#glitch-graph/app/run-trigger.ts';
import type { Graph } from '#glitch-graph/graph/graph-types.ts';

import { shouldRerun } from '#glitch-graph/app/run-trigger.ts';
import { createDiamondForkPreset } from '#glitch-graph/graph/graph-presets.ts';

function createState(graph: Graph): TriggerState {
	return { graph, history: [{ graph }], historyIndex: 0, seed: 1 };
}

function withNode(graph: Graph, id: string, changes: Record<string, unknown>): Graph {
	const node = graph.nodes[id];

	if (node === undefined) throw new Error(`Preset lost ${id}`);

	return { ...graph, nodes: { ...graph.nodes, [id]: { ...node, ...changes } } };
}

describe('shouldRerun', () => {
	const preset = createDiamondForkPreset();
	const state = createState(preset);

	it('holds still when neither the graph nor the seed moved', () => {
		expect(shouldRerun(state, state)).toBe(false);
	});

	it('runs when an edit was committed', () => {
		const next = { ...state, history: [...state.history, { graph: preset }] };

		expect(shouldRerun(state, next)).toBe(true);
	});

	it('runs when history stepped, as undo and redo do', () => {
		expect(shouldRerun(state, { ...state, historyIndex: 1 })).toBe(true);
	});

	it('runs while a param is being dragged', () => {
		const dragged = withNode(preset, 'n2', { params: { channel: 'red', dx: 4, dy: 0 } });

		expect(shouldRerun(state, { ...state, graph: dragged })).toBe(true);
	});

	it('runs when the seed changes without a commit', () => {
		expect(shouldRerun(state, { ...state, seed: 2 })).toBe(true);
	});

	it('holds still when an Output was renamed, which changes no pixels', () => {
		const renamed = withNode(preset, 'n7', { name: 'Renamed' });

		expect(shouldRerun(state, { ...state, graph: renamed })).toBe(false);
	});
});
