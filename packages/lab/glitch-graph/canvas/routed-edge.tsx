import type { EdgeProps } from '@xyflow/react';

import { BaseEdge, EdgeLabelRenderer } from '@xyflow/react';

import type { FlowEdge } from './flow-store.ts';

import { buildRoundedPath } from './edge-path.ts';
import { InsertMenu } from './insert-menu.tsx';

const bendRadius = 8;

export function RoutedEdge({ data, id }: EdgeProps<FlowEdge>) {
	const route = data?.route;

	if (route === undefined) return;

	const { x, y } = route.button;

	return (
		<>
			<BaseEdge id={id} path={buildRoundedPath(route.points, bendRadius)} />
			<EdgeLabelRenderer>
				<InsertMenu
					edgeId={id}
					style={{ transform: `translate(-50%, -50%) translate(${String(x)}px, ${String(y)}px)` }}
				/>
			</EdgeLabelRenderer>
		</>
	);
}
