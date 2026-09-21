import { create } from 'zustand';

import type { Insertion } from '#glitch-graph/graph/graph-operations.ts';
import type { PresetId } from '#glitch-graph/graph/graph-presets.ts';
import type { Graph, GraphNode, ParamValue, ParamValues } from '#glitch-graph/graph/graph-types.ts';

import { deleteNode, insertNode } from '#glitch-graph/graph/graph-operations.ts';
import { createBlankGraph, defaultPresetId, getPreset } from '#glitch-graph/graph/graph-presets.ts';
import { getNodeId } from '#glitch-graph/graph/graph-utils.ts';
import { effectDefinitions, predicateDefinitions } from '#glitch-graph/graph/param-definitions.ts';

interface GraphState extends HistorySnapshot {
	commitEdit: (label: string) => void;
	deleteNode: (id: string) => string | undefined;
	history: Array<HistoryEntry>;
	historyIndex: number;
	insertNode: (edgeId: string, insertion: Insertion) => string | undefined;
	loadPreset: (presetId: PresetId) => void;
	redo: () => void;
	renameOutput: (id: string, name: string) => void;
	reset: () => void;
	setParam: (id: string, key: string, value: ParamValue) => void;
	setSeed: (seed: number) => void;
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

	function commit(label: string, changes: Partial<HistorySnapshot>) {
		set((state) => pushHistory(state, label, { ...toSnapshot(state), ...changes }));
	}

	function applyEdit(edit: StructuralEdit | undefined) {
		if (edit === undefined) return;

		commit(edit.label, { graph: edit.graph });

		return edit.focusId;
	}

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
		redo: () => {
			set((state) => stepHistory(state, 1));
		},
		renameOutput: (id, name) => {
			set(({ graph }) => ({ graph: withOutputName(graph, id, name) }));
		},
		reset: () => {
			commit('Reset', { graph: createBlankGraph(), loadedPreset: undefined });
		},
		seed: initialSeed,
		setParam: (id, key, value) => {
			set(({ graph }) => ({ graph: withParams(graph, id, { [key]: value }) }));
		},
		setSeed: (seed) => {
			set({ seed });
		},
		undo: () => {
			set((state) => stepHistory(state, -1));
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

function getBridgeId(previous: Graph, next: Graph) {
	const previousIds = new Set(previous.edges.map((edge) => edge.id));

	return next.edges.find((edge) => !previousIds.has(edge.id))?.id;
}

function getDeleteLabel(node: GraphNode) {
	switch (node.kind) {
		case 'effect': {
			return `Delete ${effectDefinitions[node.effect].label}`;
		}
		case 'fork': {
			return 'Delete Fork';
		}
		case 'merge': {
			return 'Delete Merge';
		}
		case 'split': {
			return `Delete ${predicateDefinitions[node.predicate].label} Split`;
		}
		default: {
			return 'Delete';
		}
	}
}

function getInsertionLabel(insertion: Insertion) {
	if (insertion.kind === 'effect') return `Insert ${effectDefinitions[insertion.effect].label}`;

	if (insertion.kind === 'split') {
		return `Insert ${predicateDefinitions[insertion.predicate].label} Split`;
	}

	return 'Insert Fork';
}

function planDelete(graph: Graph, id: string): StructuralEdit | undefined {
	const node = graph.nodes[id];
	const next = deleteNode(graph, id);

	if (node === undefined || next === graph) return;

	return { focusId: getBridgeId(graph, next), graph: next, label: getDeleteLabel(node) };
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
function pushHistory(state: GraphState, label: string, snapshot: HistorySnapshot) {
	const current = state.history[state.historyIndex];

	if (
		current?.graph === snapshot.graph &&
		current.loadedPreset === snapshot.loadedPreset &&
		current.seed === snapshot.seed
	) {
		return {};
	}

	const history = [...state.history.slice(0, state.historyIndex + 1), { ...snapshot, label }].slice(
		-historyCap,
	);

	return { ...snapshot, history, historyIndex: history.length - 1 };
}

function stepHistory(state: GraphState, offset: number) {
	const entry = state.history[state.historyIndex + offset];

	if (entry === undefined) return {};

	return {
		graph: entry.graph,
		historyIndex: state.historyIndex + offset,
		loadedPreset: entry.loadedPreset,
		seed: entry.seed,
	};
}

function toSnapshot({ graph, loadedPreset, seed }: GraphState): HistorySnapshot {
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
