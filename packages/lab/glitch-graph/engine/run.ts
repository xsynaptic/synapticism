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
import { frameFromMask } from '#glitch-graph/engine/frame.ts';
import { mergeByMask } from '#glitch-graph/engine/merge.ts';
import { luminanceMask } from '#glitch-graph/engine/predicates/luminance.ts';
import { randomMask } from '#glitch-graph/engine/predicates/random.ts';
import { getAncestors, getIncomingEdges } from '#glitch-graph/graph/graph-utils.ts';

export interface RunInput {
	graph: Graph;
	seed: number;
	source: IntBuffer;
}

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

export function run({ graph, seed, source }: RunInput) {
	const { frames } = evaluate(graph, { masks: new Map(), seed, source });
	const results = new Map<string, IntBuffer>();

	for (const [id, frame] of frames) {
		if (graph.nodes[id]?.kind === 'output') results.set(id, frame);
	}

	return Promise.resolve(results);
}

export function runToStage({ graph, seed, source }: RunInput, stageId: string) {
	const node = graph.nodes[stageId];

	if (node === undefined) throw new Error(`Stage ${stageId} is not in the graph`);

	const context: RunContext = { masks: new Map(), seed, source };
	const { frames, masks } = evaluate(graph, context, getAncestors(graph, stageId));
	const frame = frames.get(stageId);

	if (frame === undefined) throw new Error(`Stage ${stageId} produced no frame`);

	if (node.kind !== 'split') return Promise.resolve(frame);

	// A Split passes its input straight through, so the mask is the only thing of its own to see
	const mask = masks.get(stageId);

	if (mask === undefined) throw new Error(`Split ${stageId} produced no mask`);

	return Promise.resolve(frameFromMask(mask, frame.width, frame.height));
}

function createRandom(seed: number, id: string) {
	return new SFC32([seed, Number(id.slice(1)), 0, 0]);
}

function evaluate(graph: Graph, context: RunContext, only?: ReadonlySet<string>) {
	const frames = new Map<string, IntBuffer>();

	for (const id of getEvaluationOrder(graph)) {
		if (only?.has(id) === false) continue;

		const node = graph.nodes[id];

		if (node === undefined) continue;

		const inputs = getIncomingEdges(graph, id).map((edge) => frames.get(edge.source));

		frames.set(id, evaluateNode(node, inputs, context));
	}

	return { frames, masks: context.masks };
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

			return mergeByMask({
				branchA: input,
				branchB: secondInput,
				mask,
				params: node.params,
			});
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
