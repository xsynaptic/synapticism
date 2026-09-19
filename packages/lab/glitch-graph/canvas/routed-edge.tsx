import type { EdgeProps } from '@xyflow/react';

import { BaseEdge, EdgeLabelRenderer } from '@xyflow/react';

import type { FlowEdge } from '#glitch-graph/canvas/flow-store.ts';
import type { Graph } from '#glitch-graph/graph/graph-types.ts';

import { buildRoundedPath } from '#glitch-graph/canvas/edge-path.ts';
import { branchLabelSize } from '#glitch-graph/canvas/layout.ts';
import { useGraphStore } from '#glitch-graph/graph/graph-store.ts';
import { getEdgeWithSource } from '#glitch-graph/graph/graph-utils.ts';
import { getBranchLabel } from '#glitch-graph/graph/param-definitions.ts';

const bendRadius = 8;

export function RoutedEdge({ data, id }: EdgeProps<FlowEdge>) {
	const branchText = useGraphStore((state) => getEdgeBranchText(state.graph, id));
	const route = data?.route;

	if (route === undefined) return;

	const { branchLabel } = route;

	return (
		<>
			<BaseEdge id={id} path={buildRoundedPath(route.points, bendRadius)} />
			{branchLabel === undefined || branchText === undefined ? undefined : (
				<EdgeLabelRenderer>
					<span
						className="gg-branch-label"
						style={{
							...branchLabelSize,
							transform: `translate(${String(branchLabel.x)}px, ${String(branchLabel.y)}px)`,
						}}
					>
						{branchText}
					</span>
				</EdgeLabelRenderer>
			)}
		</>
	);
}

function getEdgeBranchText(graph: Graph, edgeId: string) {
	const outlet = getEdgeWithSource(graph, edgeId);

	if (outlet?.source.kind !== 'split') return;

	return getBranchLabel(outlet.source, outlet.edge.sourceIndex);
}
