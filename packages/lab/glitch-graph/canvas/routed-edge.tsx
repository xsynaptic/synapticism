import type { EdgeProps } from '@xyflow/react';

import { BaseEdge, EdgeLabelRenderer } from '@xyflow/react';

import type { Graph } from '../graph/graph-types.ts';
import type { FlowEdge } from './flow-store.ts';

import { useGraphStore } from '../graph/graph-store.ts';
import { getBranchLabel } from '../graph/param-definitions.ts';
import { buildRoundedPath } from './edge-path.ts';
import { InsertMenu } from './insert-menu.tsx';
import { branchLabelSize } from './layout.ts';

const bendRadius = 8;

export function RoutedEdge({ data, id }: EdgeProps<FlowEdge>) {
	const branchText = useGraphStore((state) => getEdgeBranchText(state.graph, id));
	const route = data?.route;

	if (route === undefined) return;

	const { x, y } = route.button;
	const { branchLabel } = route;

	return (
		<>
			<BaseEdge id={id} path={buildRoundedPath(route.points, bendRadius)} />
			<EdgeLabelRenderer>
				{branchLabel === undefined || branchText === undefined ? undefined : (
					<span
						className="gg-branch-label"
						style={{
							...branchLabelSize,
							transform: `translate(${String(branchLabel.x)}px, ${String(branchLabel.y)}px)`,
						}}
					>
						{branchText}
					</span>
				)}
				<InsertMenu
					edgeId={id}
					style={{ transform: `translate(-50%, -50%) translate(${String(x)}px, ${String(y)}px)` }}
				/>
			</EdgeLabelRenderer>
		</>
	);
}

function getEdgeBranchText(graph: Graph, edgeId: string) {
	const edge = graph.edges.find((candidate) => candidate.id === edgeId);
	const source = edge === undefined ? undefined : graph.nodes[edge.source];

	if (edge === undefined || source?.kind !== 'split') return;

	return getBranchLabel(source, edge.sourceIndex);
}
