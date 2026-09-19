import { create } from 'zustand';

import type { Insertion } from './graph-operations.ts';
import type { PresetId } from './graph-presets.ts';
import type { Graph, ParamValue } from './graph-types.ts';

import { deleteNode, insertNode } from './graph-operations.ts';
import { defaultPresetId, getPreset } from './graph-presets.ts';

interface GraphState {
	deleteNode: (id: string) => void;
	graph: Graph;
	insertNode: (edgeId: string, insertion: Insertion) => void;
	loadPreset: (presetId: PresetId) => void;
	presetId: PresetId;
	renameOutput: (id: string, name: string) => void;
	seed: number;
	setParam: (id: string, key: string, value: ParamValue) => void;
	setSeed: (seed: number) => void;
}

export const useGraphStore = create<GraphState>()((set) => ({
	deleteNode: (id) => {
		set(({ graph }) => ({ graph: deleteNode(graph, id) }));
	},
	graph: getPreset(defaultPresetId).create(),
	insertNode: (edgeId, insertion) => {
		set(({ graph }) => ({ graph: insertNode(graph, edgeId, insertion) }));
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
