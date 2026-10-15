import { describe, expect, it } from 'vitest';

import type { Graph, ParamValues } from '#glitch-graph/graph/graph-types.ts';
import type { ParamDefinition, RangeParam } from '#glitch-graph/graph/param-definitions.ts';

import { createBlankGraph, getPreset } from '#glitch-graph/graph/graph-presets.ts';
import { hasAdjustableParams, jitterGraph } from '#glitch-graph/graph/jitter.ts';
import {
	effectDefinitions,
	mergeDefinition,
	predicateDefinitions,
} from '#glitch-graph/graph/param-definitions.ts';

function constant(value: number) {
	return () => value;
}

function getParams(graph: Graph, id: string): ParamValues {
	const node = graph.nodes[id];

	if (node === undefined || !('params' in node)) throw new Error(`${id} carries no params`);

	return node.params;
}

function getRangeSpecs() {
	const definitions: ReadonlyArray<ParamDefinition> = [
		...Object.values(effectDefinitions),
		...Object.values(predicateDefinitions),
		mergeDefinition,
	];

	return definitions
		.flatMap((definition) => definition.params)
		.filter((param): param is RangeParam => param.kind === 'range');
}

// Every range param of every node kind, paired with the spec that declares its bounds
function readRangeValues(graph: Graph) {
	const specs = new Map(getRangeSpecs().map((spec) => [spec.key, spec]));

	return Object.values(graph.nodes).flatMap((node) =>
		'params' in node
			? Object.entries(node.params).flatMap(([key, value]) => {
					const spec = specs.get(key);

					return spec === undefined || typeof value !== 'number' ? [] : [{ spec, value }];
				})
			: [],
	);
}

describe('jitterGraph', () => {
	const dense = getPreset('dense').create();

	it('moves a number by three tenths of its range at the far draw', () => {
		// n2 is a Channel shift, whose `dx` defaults to 12 in a span of 128
		const jittered = jitterGraph(dense, constant(1));

		expect(getParams(jittered, 'n2').dx).toBe(50);
	});

	it('keeps every number inside its declared range, pushed either way', () => {
		for (const draw of [0, 0.5, 1]) {
			const values = readRangeValues(jitterGraph(dense, constant(draw)));

			for (const { spec, value } of values) {
				expect(value).toBeGreaterThanOrEqual(spec.min);
				expect(value).toBeLessThanOrEqual(spec.max);
			}
		}
	});

	it('lands every number on a step of its own range', () => {
		const values = readRangeValues(jitterGraph(dense, constant(1 / 7)));

		for (const { spec, value } of values) {
			expect((value - spec.min) % spec.step).toBe(0);
		}
	});

	it('holds a select whose draw misses the re-roll chance', () => {
		const jittered = jitterGraph(dense, constant(0.9));

		expect(getParams(jittered, 'n2').channel).toBe('red');
		expect(getParams(jittered, 'n5').blend).toBe('normal');
	});

	it('moves a re-rolled select off its current option', () => {
		// A draw this low would land back on the current option were the current one still in the pool
		const jittered = jitterGraph(dense, constant(0.1));

		expect(getParams(jittered, 'n2').channel).not.toBe('red');
		expect(getParams(jittered, 'n5').blend).not.toBe('normal');
	});

	it('returns nodes that carry no params by reference', () => {
		const jittered = jitterGraph(dense, constant(0.5));

		for (const [id, node] of Object.entries(dense.nodes)) {
			if ('params' in node) continue;

			expect(jittered.nodes[id]).toBe(node);
		}
	});

	it('returns the same graph when nothing in it has params', () => {
		const blank = createBlankGraph();

		expect(jitterGraph(blank, constant(0.5))).toBe(blank);
	});
});

describe('hasAdjustableParams', () => {
	it('is false for a blank graph and true once an effect is in it', () => {
		expect(hasAdjustableParams(createBlankGraph())).toBe(false);
		expect(hasAdjustableParams(getPreset('dense').create())).toBe(true);
	});
});
