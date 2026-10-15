import type { Graph, GraphNode, NodeKind, ParamValues } from '#glitch-graph/graph/graph-types.ts';
import type { ParamSpec, RangeParam, SelectParam } from '#glitch-graph/graph/param-definitions.ts';

import {
	effectDefinitions,
	mergeDefinition,
	predicateDefinitions,
	readNumber,
	readString,
} from '#glitch-graph/graph/param-definitions.ts';

type ParamsNode = Extract<GraphNode, { params: ParamValues }>;

// The share of its declared range a number may move, either way
const numberReach = 0.3;

// Gradient map and Merge carry a select and nothing else, so selects have to move sometimes; every time would bury the look being varied
const selectRerollChance = 1 / 3;

const paramsKinds: ReadonlySet<NodeKind> = new Set(['effect', 'merge', 'split']);

export function hasAdjustableParams(graph: Graph) {
	return Object.values(graph.nodes).some(isParamsNode);
}

export function jitterGraph(graph: Graph, nextFloat: () => number) {
	const entries = Object.values(graph.nodes).map(
		(node) => [node.id, jitterNode(node, nextFloat)] as const,
	);

	if (entries.every(([id, node]) => graph.nodes[id] === node)) return graph;

	return { ...graph, nodes: Object.fromEntries(entries) };
}

function getSpecs(node: ParamsNode): ReadonlyArray<ParamSpec> {
	switch (node.kind) {
		case 'effect': {
			return effectDefinitions[node.effect].params;
		}
		case 'merge': {
			return mergeDefinition.params;
		}
		case 'split': {
			return predicateDefinitions[node.predicate].params;
		}
	}
}

function isParamsNode(node: GraphNode): node is ParamsNode {
	return paramsKinds.has(node.kind);
}

function jitterNode(node: GraphNode, nextFloat: () => number): GraphNode {
	if (!isParamsNode(node)) return node;

	return { ...node, params: jitterParams(getSpecs(node), node.params, nextFloat) };
}

function jitterParams(
	specs: ReadonlyArray<ParamSpec>,
	params: ParamValues,
	nextFloat: () => number,
): ParamValues {
	const next: ParamValues = { ...params };

	for (const spec of specs) {
		if (spec.kind === 'range') {
			next[spec.key] = jitterRange(spec, readNumber(params, spec.key), nextFloat);

			continue;
		}

		if (nextFloat() < selectRerollChance) {
			next[spec.key] = jitterSelect(spec, readString(params, spec.key), nextFloat);
		}
	}

	return next;
}

function jitterRange(spec: RangeParam, current: number, nextFloat: () => number) {
	const raw = current + (nextFloat() * 2 - 1) * numberReach * (spec.max - spec.min);
	const stepped = spec.min + Math.round((raw - spec.min) / spec.step) * spec.step;

	return Math.min(spec.max, Math.max(spec.min, stepped));
}

// A re-roll that could land back on the current option would read as nothing having happened
function jitterSelect(spec: SelectParam, current: string, nextFloat: () => number) {
	const others = spec.options.filter((option) => option.value !== current);

	return others[Math.floor(nextFloat() * others.length)]?.value ?? current;
}
