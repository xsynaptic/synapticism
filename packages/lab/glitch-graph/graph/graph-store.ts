import { create } from 'zustand';

import type { Graph, ParamValue } from './graph-types.ts';

import { createDiamondForkPreset } from './graph-presets.ts';

interface GraphState {
	graph: Graph;
	renameOutput: (id: string, name: string) => void;
	seed: number;
	setParam: (id: string, key: string, value: ParamValue) => void;
	setSeed: (seed: number) => void;
}

export const useGraphStore = create<GraphState>()((set) => ({
	graph: createDiamondForkPreset(),
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
