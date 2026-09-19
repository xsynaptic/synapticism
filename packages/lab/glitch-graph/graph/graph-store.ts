import { create } from 'zustand';

import type { Insertion } from './graph-operations.ts';
import type { PresetId } from './graph-presets.ts';
import type { Graph, ParamValue } from './graph-types.ts';

import { deleteNode, insertNode } from './graph-operations.ts';
import { defaultPresetId, getPreset } from './graph-presets.ts';
import { getNodeId } from './graph-utils.ts';

interface GraphState {
	deleteNode: (id: string) => string | undefined;
	graph: Graph;
	insertNode: (edgeId: string, insertion: Insertion) => string | undefined;
	loadPreset: (presetId: PresetId) => void;
	presetId: PresetId;
	renameOutput: (id: string, name: string) => void;
	seed: number;
	setParam: (id: string, key: string, value: ParamValue) => void;
	setSeed: (seed: number) => void;
}

// Structural edits return what they created so focus can follow the edit
export const useGraphStore = create<GraphState>()((set, get) => ({
	deleteNode: (id) => {
		const { graph } = get();
		const next = deleteNode(graph, id);

		if (next === graph) return;

		set({ graph: next });

		const previousIds = new Set(graph.edges.map((edge) => edge.id));

		return next.edges.find((edge) => !previousIds.has(edge.id))?.id;
	},
	graph: getPreset(defaultPresetId).create(),
	insertNode: (edgeId, insertion) => {
		const { graph } = get();
		const next = insertNode(graph, edgeId, insertion);

		if (next === graph) return;

		set({ graph: next });

		return getNodeId(graph.counter + 1);
	},
	loadPreset: (presetId) => {
		set({ graph: getPreset(presetId).create(), presetId });
	},
	presetId: defaultPresetId,
	renameOutput: (id, name) => {
		set(({ graph }) => {
			const node = graph.nodes[id];

			if (node?.kind !== 'output') return {};

			return { graph: { ...graph, nodes: { ...graph.nodes, [id]: { ...node, name } } } };
		});
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
}));
