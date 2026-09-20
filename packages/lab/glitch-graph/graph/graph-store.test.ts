import type { IntBuffer } from '@thi.ng/pixel';

import { beforeEach, describe, expect, it } from 'vitest';

import { isStale } from '#glitch-graph/app/run-staleness.ts';
import { createFrame } from '#glitch-graph/engine/test-frames.ts';
import { createDiamondForkPreset } from '#glitch-graph/graph/graph-presets.ts';
import {
	getActivePresetId,
	getRedoLabel,
	getUndoLabel,
	historyCap,
	useGraphStore,
} from '#glitch-graph/graph/graph-store.ts';
import { readNumber } from '#glitch-graph/graph/param-definitions.ts';
import { getViolations } from '#glitch-graph/graph/test-validity.ts';

const channelShift = { effect: 'channel-shift', kind: 'effect' } as const;

function getCurrentInputs(source: IntBuffer) {
	const { graph, seed } = useGraphStore.getState();

	return { graph, seed, source };
}

function getFirstEdgeId() {
	return useGraphStore.getState().graph.edges[0]?.id ?? '';
}

function getNodeCount() {
	return Object.keys(useGraphStore.getState().graph.nodes).length;
}

function getShiftX(id: string) {
	const node = useGraphStore.getState().graph.nodes[id];

	return node?.kind === 'effect' ? readNumber(node.params, 'dx') : undefined;
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

describe('undo and redo', () => {
	it('walks structural edits back and forward, leaving a valid graph at every step', () => {
		const { deleteNode, insertNode, redo, undo } = useGraphStore.getState();

		insertNode(getFirstEdgeId(), { kind: 'split', predicate: 'luminance' });

		const split = useGraphStore.getState().graph;

		deleteNode('n2');

		const counts: Array<number> = [];

		for (const step of [undo, undo, redo, redo]) {
			step();
			counts.push(getNodeCount());
			expect(getViolations(useGraphStore.getState().graph)).toEqual([]);
		}

		expect(counts).toEqual([10, 8, 10, 9]);
		expect(useGraphStore.getState().history[1]?.graph).toBe(split);
	});

	it('restores the seed, so Reseed steps back', () => {
		const { commitEdit, setSeed, undo } = useGraphStore.getState();

		setSeed(4096);
		commitEdit('Reseed');
		undo();

		expect(useGraphStore.getState().seed).toBe(1);
		expect(getRedoLabel(useGraphStore.getState())).toBe('Reseed');
	});

	it('evicts the oldest entry once the stack is full', () => {
		const { commitEdit, setSeed, undo } = useGraphStore.getState();
		const edits = historyCap + 5;

		for (let step = 1; step <= edits; step++) {
			setSeed(step + 1);
			commitEdit('Set seed');
		}

		expect(useGraphStore.getState().history).toHaveLength(historyCap);

		for (let step = 1; step <= edits; step++) undo();

		expect(useGraphStore.getState().seed).toBe(edits + 2 - historyCap);
		expect(getUndoLabel(useGraphStore.getState())).toBeUndefined();
	});

	it('drops the redo branch when an edit follows an undo', () => {
		const { insertNode, redo, undo } = useGraphStore.getState();

		insertNode(getFirstEdgeId(), channelShift);

		const undone = useGraphStore.getState().graph;

		undo();
		insertNode(getFirstEdgeId(), { kind: 'fork' });
		redo();

		expect(getRedoLabel(useGraphStore.getState())).toBeUndefined();
		expect(useGraphStore.getState().graph).not.toBe(undone);
		expect(getUndoLabel(useGraphStore.getState())).toBe('Insert Fork');
	});

	it('keeps the redo branch when a field commits without changing anything', () => {
		const { commitEdit, insertNode, undo } = useGraphStore.getState();

		insertNode(getFirstEdgeId(), channelShift);
		undo();
		commitEdit('Set seed');

		expect(getRedoLabel(useGraphStore.getState())).toBe('Insert Channel shift');
	});

	it('records one entry for a drag that commits once', () => {
		const { commitEdit, setParam, undo } = useGraphStore.getState();

		for (const value of [20, 30, 40, 50]) setParam('n2', 'dx', value);

		commitEdit('Set Shift x');

		const { history } = useGraphStore.getState();

		expect(history).toHaveLength(2);
		expect(history[1]?.label).toBe('Set Shift x');
		expect(getShiftX('n2')).toBe(50);

		undo();

		expect(getShiftX('n2')).toBe(12);
	});
});

describe('undo against the rest of the app', () => {
	it('un-stales the results when the graph that was run comes back', () => {
		const { commitEdit, setParam, undo } = useGraphStore.getState();
		const source = createFrame(1, 1, [0]);
		const ranWith = getCurrentInputs(source);

		setParam('n2', 'dx', 40);
		commitEdit('Set Shift x');

		expect(isStale(ranWith, getCurrentInputs(source))).toBe(true);

		undo();

		expect(isStale(ranWith, getCurrentInputs(source))).toBe(false);
	});

	it('restores the preset an edit or a Reset made custom', () => {
		const { insertNode, loadPreset, reset, undo } = useGraphStore.getState();

		loadPreset('single');
		insertNode(getFirstEdgeId(), channelShift);

		expect(getActivePresetId(useGraphStore.getState())).toBeUndefined();

		undo();

		expect(getActivePresetId(useGraphStore.getState())).toBe('single');

		reset();

		expect(getActivePresetId(useGraphStore.getState())).toBeUndefined();

		undo();

		expect(getActivePresetId(useGraphStore.getState())).toBe('single');
	});
});
