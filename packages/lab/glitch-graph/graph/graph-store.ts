import { create } from 'zustand';

import type { Insertion } from './graph-operations.ts';
import type { PresetId } from './graph-presets.ts';
import type { Graph, ParamValue } from './graph-types.ts';

import { deleteNode, insertNode } from './graph-operations.ts';
import { createBlankGraph, defaultPresetId, getPreset } from './graph-presets.ts';
import { getNodeId } from './graph-utils.ts';

interface GraphState {
	deleteNode: (id: string) => string | undefined;
	graph: Graph;
	insertNode: (edgeId: string, insertion: Insertion) => string | undefined;
	loadedPreset: undefined | { graph: Graph; id: PresetId };
	loadPreset: (presetId: PresetId) => void;
	renameOutput: (id: string, name: string) => void;
	reset: () => void;
	seed: number;
	setParam: (id: string, key: string, value: ParamValue) => void;
	setSeed: (seed: number) => void;
}

// Structural edits return what they created so focus can follow the edit
export const useGraphStore = create<GraphState>()((set, get) => {
	const graph = getPreset(defaultPresetId).create();

	return {
		deleteNode: (id) => {
			const { graph } = get();
			const next = deleteNode(graph, id);

			if (next === graph) return;

			set({ graph: next });

			const previousIds = new Set(graph.edges.map((edge) => edge.id));

			return next.edges.find((edge) => !previousIds.has(edge.id))?.id;
		},
		graph,
		insertNode: (edgeId, insertion) => {
			const { graph } = get();
			const next = insertNode(graph, edgeId, insertion);

			if (next === graph) return;

			set({ graph: next });

			return getNodeId(graph.counter + 1);
		},
		loadedPreset: { graph, id: defaultPresetId },
		loadPreset: (presetId) => {
			const presetGraph = getPreset(presetId).create();

			set({ graph: presetGraph, loadedPreset: { graph: presetGraph, id: presetId } });
		},
		renameOutput: (id, name) => {
			set(({ graph }) => {
				const node = graph.nodes[id];

				if (node?.kind !== 'output') return {};

				return { graph: { ...graph, nodes: { ...graph.nodes, [id]: { ...node, name } } } };
			});
		},
		reset: () => {
			set({ graph: createBlankGraph(), loadedPreset: undefined });
		},
		seed: 1,
		setParam: (id, key, value) => {
			set(({ graph }) => {
				const node = graph.nodes[id];

				if (node?.kind !== 'effect' && node?.kind !== 'split') return {};

				const params = { ...node.params, [key]: value };

				return { graph: { ...graph, nodes: { ...graph.nodes, [id]: { ...node, params } } } };
			});
		},
		setSeed: (seed) => {
			set({ seed });
		},
	};
});

// Any edit replaces the graph, so a loaded preset only stays active while its graph is untouched
export function useActivePresetId() {
	return useGraphStore(({ graph, loadedPreset }) =>
		loadedPreset?.graph === graph ? loadedPreset.id : undefined,
	);
}
