import { beforeEach, describe, expect, it } from 'vitest';

import { useFlowStore } from '#glitch-graph/canvas/flow-store.ts';
import { createDiamondForkPreset } from '#glitch-graph/graph/graph-presets.ts';
import { useGraphStore } from '#glitch-graph/graph/graph-store.ts';

const channelShift = { effect: 'channel-shift', kind: 'effect' } as const;

function refitsAfter(action: () => void) {
	useFlowStore.setState({ hasLayout: true });
	action();

	return !useFlowStore.getState().hasLayout;
}

beforeEach(() => {
	const graph = createDiamondForkPreset();

	useGraphStore.setState({
		graph,
		history: [{ graph, label: 'Start', loadedPreset: undefined, seed: 1 }],
		historyIndex: 0,
		loadedPreset: undefined,
		seed: 1,
	});
});

describe('the view refit', () => {
	it('follows a Look load, undone and redone', () => {
		const { loadPreset, redo, undo } = useGraphStore.getState();

		expect(
			refitsAfter(() => {
				loadPreset('blank');
			}),
		).toBe(true);
		expect(refitsAfter(undo)).toBe(true);
		expect(refitsAfter(redo)).toBe(true);
	});

	it('skips an edit made after a Look, undone or not', () => {
		const { insertNode, loadPreset, undo } = useGraphStore.getState();

		loadPreset('anaglyph');

		const edgeId = useGraphStore.getState().graph.edges[0]?.id ?? '';

		expect(refitsAfter(() => insertNode(edgeId, channelShift))).toBe(false);
		expect(refitsAfter(undo)).toBe(false);
		expect(refitsAfter(undo)).toBe(true);
	});

	it('skips a param commit, a delete and a Randomize', () => {
		const { commitEdit, deleteNode, randomize, setParam } = useGraphStore.getState();

		expect(
			refitsAfter(() => {
				setParam('n4', 'dx', 3);
				commitEdit('Set Shift x');
			}),
		).toBe(false);
		expect(refitsAfter(() => deleteNode('n2'))).toBe(false);
		expect(refitsAfter(randomize)).toBe(false);
	});
});
