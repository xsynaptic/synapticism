import { create } from 'zustand';

import type { Insertion } from '#glitch-graph/graph/graph-operations.ts';
import type { PresetId } from '#glitch-graph/graph/graph-presets.ts';
import type { Graph, ParamValue, ParamValues } from '#glitch-graph/graph/graph-types.ts';

import { deleteNode, insertNode } from '#glitch-graph/graph/graph-operations.ts';
import { defaultPresetId, getPreset } from '#glitch-graph/graph/graph-presets.ts';
import { getNodeId } from '#glitch-graph/graph/graph-utils.ts';
import { jitterGraph } from '#glitch-graph/graph/jitter.ts';
import {
	effectDefinitions,
	getNodeLabel,
	predicateDefinitions,
} from '#glitch-graph/graph/param-definitions.ts';

interface GraphState extends HistorySnapshot {
	commitEdit: (label: string) => void;
	deleteNode: (id: string) => string | undefined;
	history: Array<HistoryEntry>;
	historyIndex: number;
	insertNode: (edgeId: string, insertion: Insertion) => string | undefined;
	loadPreset: (presetId: PresetId) => void;
	randomize: () => void;
	redo: () => void;
	renameOutput: (id: string, name: string) => void;
	setParam: (id: string, key: string, value: ParamValue) => void;
	undo: () => void;
}

interface HistoryEntry extends HistorySnapshot {
	label: string;
}

interface HistorySnapshot {
	graph: Graph;
	loadedPreset: undefined | { graph: Graph; id: PresetId };
	seed: number;
}

interface StructuralEdit {
	focusId: string | undefined;
	graph: Graph;
	label: string;
}

export const historyCap = 50;

const initialSeed = 1;

// Structural edits return what they created so focus can follow the edit
export const useGraphStore = create<GraphState>()((set, get) => {
	const graph = getPreset(defaultPresetId).create();
	const loadedPreset = { graph, id: defaultPresetId };

	return {
		commitEdit: (label) => {
			commit(label, {});
		},
		deleteNode: (id) => applyEdit(planDelete(get().graph, id)),
		graph,
		history: [{ graph, label: 'Start', loadedPreset, seed: initialSeed }],
		historyIndex: 0,
		insertNode: (edgeId, insertion) => applyEdit(planInsert(get().graph, edgeId, insertion)),
		loadedPreset,
		loadPreset: (presetId) => {
			const preset = getPreset(presetId);
			const presetGraph = preset.create();

			commit(`Load ${preset.label}`, {
				graph: presetGraph,
				loadedPreset: { graph: presetGraph, id: presetId },
			});
		},
		// A new seed re-rolls the two nodes that draw on it, which no param move reaches
		randomize: () => {
			commit('Randomize', {
				graph: jitterGraph(get().graph, nextRandomFloat),
				seed: nextRandomWord(),
			});
		},
		redo: () => {
			stepHistory(1);
		},
		renameOutput: (id, name) => {
			set(({ graph }) => ({ graph: withOutputName(graph, id, name) }));
		},
		seed: initialSeed,
		setParam: (id, key, value) => {
			set(({ graph }) => ({ graph: withParams(graph, id, { [key]: value }) }));
		},
		undo: () => {
			stepHistory(-1);
		},
	};
});

// Any edit replaces the graph, so a loaded preset only stays active while its graph is untouched
export function getActivePresetId({ graph, loadedPreset }: GraphState) {
	return loadedPreset?.graph === graph ? loadedPreset.id : undefined;
}

export function getRedoLabel({ history, historyIndex }: GraphState) {
	return history[historyIndex + 1]?.label;
}

export function getUndoLabel({ history, historyIndex }: GraphState) {
	return historyIndex > 0 ? history[historyIndex]?.label : undefined;
}

export function useActivePresetId() {
	return useGraphStore(getActivePresetId);
}

// Both reach the store through its api rather than the creator's `set`, which would push the creator past its line cap
function applyEdit(edit: StructuralEdit | undefined) {
	if (edit === undefined) return;

	commit(edit.label, { graph: edit.graph });

	return edit.focusId;
}

function commit(label: string, changes: Partial<HistorySnapshot>) {
	useGraphStore.setState((state) =>
		pushHistory(state, { ...toSnapshot(state), ...changes, label }),
	);
}

function getBridgeId(previous: Graph, next: Graph) {
	const previousIds = new Set(previous.edges.map((edge) => edge.id));

	return next.edges.find((edge) => !previousIds.has(edge.id))?.id;
}

function getInsertionLabel(insertion: Insertion) {
	if (insertion.kind === 'effect') return `Insert ${effectDefinitions[insertion.effect].label}`;

	if (insertion.kind === 'split') {
		return `Insert ${predicateDefinitions[insertion.predicate].label} Split`;
	}

	return 'Insert Fork';
}

function nextRandomFloat() {
	return nextRandomWord() / 2 ** 32;
}

function nextRandomWord() {
	return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
}

function planDelete(graph: Graph, id: string): StructuralEdit | undefined {
	const node = graph.nodes[id];
	const next = deleteNode(graph, id);

	if (node === undefined || next === graph) return;

	return { focusId: getBridgeId(graph, next), graph: next, label: `Delete ${getNodeLabel(node)}` };
}

function planInsert(
	graph: Graph,
	edgeId: string,
	insertion: Insertion,
): StructuralEdit | undefined {
	const next = insertNode(graph, edgeId, insertion);

	if (next === graph) return;

	return {
		focusId: getNodeId(graph.counter + 1),
		graph: next,
		label: getInsertionLabel(insertion),
	};
}

// A commit that changed nothing must not truncate the redo branch
function pushHistory(state: GraphState, entry: HistoryEntry) {
	const current = state.history[state.historyIndex];

	if (
		current?.graph === entry.graph &&
		current.loadedPreset === entry.loadedPreset &&
		current.seed === entry.seed
	) {
		return {};
	}

	const history = [...state.history.slice(0, state.historyIndex + 1), entry].slice(-historyCap);

	return { ...toSnapshot(entry), history, historyIndex: history.length - 1 };
}

function stepHistory(offset: number) {
	const state = useGraphStore.getState();
	const historyIndex = state.historyIndex + offset;
	const entry = state.history[historyIndex];

	if (entry === undefined) return;

	useGraphStore.setState({ ...toSnapshot(entry), historyIndex });
}

function toSnapshot({ graph, loadedPreset, seed }: HistorySnapshot): HistorySnapshot {
	return { graph, loadedPreset, seed };
}

function withOutputName(graph: Graph, id: string, name: string) {
	const node = graph.nodes[id];

	if (node?.kind !== 'output') return graph;

	return { ...graph, nodes: { ...graph.nodes, [id]: { ...node, name } } };
}

function withParams(graph: Graph, id: string, params: ParamValues) {
	const node = graph.nodes[id];

	if (node?.kind !== 'effect' && node?.kind !== 'merge' && node?.kind !== 'split') return graph;

	const merged = { ...node.params, ...params };

	return { ...graph, nodes: { ...graph.nodes, [id]: { ...node, params: merged } } };
}
