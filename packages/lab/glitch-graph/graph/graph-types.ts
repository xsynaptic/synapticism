import type { effectDefinitions, predicateDefinitions } from './param-definitions.ts';

export type EffectKind = keyof typeof effectDefinitions;

export interface EffectNode {
	effect: EffectKind;
	id: string;
	kind: 'effect';
	params: ParamValues;
}

export interface Graph {
	counter: number;
	edges: Array<GraphEdge>;
	nodes: Record<string, GraphNode>;
}

export interface GraphEdge {
	id: string;
	source: string;
	sourceIndex: number;
	target: string;
	targetIndex: number;
}

export type GraphNode = EffectNode | ForkNode | MergeNode | OutputNode | SourceNode | SplitNode;

export type NodeKind = GraphNode['kind'];

export type ParamValue = number | string;

export type ParamValues = Record<string, ParamValue>;

export type PredicateKind = keyof typeof predicateDefinitions;

export interface SplitNode {
	id: string;
	kind: 'split';
	mergeId: string;
	params: ParamValues;
	predicate: PredicateKind;
}

interface ForkNode {
	id: string;
	kind: 'fork';
}

interface MergeNode {
	id: string;
	kind: 'merge';
	splitId: string;
}

interface OutputNode {
	id: string;
	kind: 'output';
	name: string;
}

interface SourceNode {
	id: string;
	kind: 'source';
}
