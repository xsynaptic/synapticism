import type { IntBuffer } from '@thi.ng/pixel';
import type { IRandom } from '@thi.ng/random';

import { DGraph } from '@thi.ng/dgraph';
import { SFC32 } from '@thi.ng/random';

import type {
	EffectKind,
	Graph,
	GraphNode,
	ParamValues,
	PredicateKind,
} from '#glitch-graph/graph/graph-types.ts';

import { channelShift } from '#glitch-graph/engine/effects/channel-shift.ts';
import { dither } from '#glitch-graph/engine/effects/dither.ts';
import { gradientMap } from '#glitch-graph/engine/effects/gradient-map.ts';
import { pixelSort } from '#glitch-graph/engine/effects/pixel-sort.ts';
import { sliceDisplacement } from '#glitch-graph/engine/effects/slice-displacement.ts';
import { mergeByMask } from '#glitch-graph/engine/merge.ts';
import { luminanceMask } from '#glitch-graph/engine/predicates/luminance.ts';
import { randomMask } from '#glitch-graph/engine/predicates/random.ts';
import { getIncomingEdges } from '#glitch-graph/graph/graph-utils.ts';

type EffectFunction = (input: IntBuffer, params: ParamValues, random: IRandom) => IntBuffer;

type PredicateFunction = (input: IntBuffer, params: ParamValues, random: IRandom) => Uint8Array;

interface RunContext {
	masks: Map<string, Uint8Array>;
	seed: number;
	source: IntBuffer;
}

const effects: Record<EffectKind, EffectFunction> = {
	'channel-shift': channelShift,
	dither,
	'gradient-map': gradientMap,
	'pixel-sort': pixelSort,
	'slice-displacement': sliceDisplacement,
};

const predicates: Record<PredicateKind, PredicateFunction> = {
	luminance: luminanceMask,
	random: randomMask,
};

export function run(graph: Graph, source: IntBuffer, seed: number) {
	const frames = new Map<string, IntBuffer>();
	const results = new Map<string, IntBuffer>();
	const context: RunContext = { masks: new Map(), seed, source };

	for (const id of getEvaluationOrder(graph)) {
		const node = graph.nodes[id];

		if (node === undefined) continue;

		const inputs = getIncomingEdges(graph, id).map((edge) => frames.get(edge.source));
		const frame = evaluateNode(node, inputs, context);

		frames.set(id, frame);

		if (node.kind === 'output') results.set(id, frame);
	}

	return Promise.resolve(results);
}

function createRandom(seed: number, id: string) {
	return new SFC32([seed, Number(id.slice(1)), 0, 0]);
}

function evaluateNode(node: GraphNode, inputs: Array<IntBuffer | undefined>, context: RunContext) {
	if (node.kind === 'source') return context.source;

	const [input, secondInput] = inputs;

	if (input === undefined) throw new Error(`Node ${node.id} has no input frame`);

	switch (node.kind) {
		case 'effect': {
			return effects[node.effect](input, node.params, createRandom(context.seed, node.id));
		}
		case 'merge': {
			const mask = context.masks.get(node.splitId);

			if (secondInput === undefined || mask === undefined) {
				throw new Error(`Merge ${node.id} is missing a branch or its mask`);
			}

			return mergeByMask(input, secondInput, mask);
		}
		case 'split': {
			const random = createRandom(context.seed, node.id);

			context.masks.set(node.id, predicates[node.predicate](input, node.params, random));

			return input;
		}
		default: {
			return input;
		}
	}
}

function getEvaluationOrder(graph: Graph) {
	const dependencies = new DGraph<string>();

	for (const id of Object.keys(graph.nodes)) dependencies.addNode(id);
	for (const edge of graph.edges) dependencies.addDependency(edge.target, edge.source);

	return dependencies.sort();
}
