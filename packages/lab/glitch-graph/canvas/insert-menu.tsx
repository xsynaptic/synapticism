import type { CSSProperties } from 'react';

import { Menu } from '@base-ui/react/menu';
import { Plus } from 'lucide-react';
import { Fragment } from 'react';

import type { Insertion } from '#glitch-graph/graph/graph-operations.ts';

import { useFlowStore } from '#glitch-graph/canvas/flow-store.ts';
import { canInsert, getNodeCount } from '#glitch-graph/graph/graph-operations.ts';
import { useGraphStore } from '#glitch-graph/graph/graph-store.ts';
import {
	effectDefinitions,
	effectKinds,
	getInsertLabel,
	predicateKinds,
} from '#glitch-graph/graph/param-definitions.ts';
import { usePortalContainer } from '#glitch-graph/ui/portal-container.ts';

interface InsertOption {
	insertion: Insertion;
	key: string;
	label: string;
}

const splitLabels = {
	luminance: 'By brightness',
	random: 'In random blocks',
} as const satisfies Record<(typeof predicateKinds)[number], string>;

const insertGroups: ReadonlyArray<{ label: string; options: ReadonlyArray<InsertOption> }> = [
	{
		label: 'Add an effect',
		options: effectKinds.map((effect) => ({
			insertion: { effect, kind: 'effect' },
			key: effect,
			label: effectDefinitions[effect].label,
		})),
	},
	{
		label: 'Split the image',
		options: predicateKinds.map((predicate) => ({
			insertion: { kind: 'split', predicate },
			key: predicate,
			label: splitLabels[predicate],
		})),
	},
	{
		label: 'Fork',
		options: [{ insertion: { kind: 'fork' }, key: 'fork', label: 'Add an Output here' }],
	},
];

export function InsertMenu({ edgeId, style }: { edgeId: string; style: CSSProperties }) {
	const container = usePortalContainer();
	const insertNode = useGraphStore((state) => state.insertNode);
	const nodeCount = useGraphStore((state) => getNodeCount(state.graph));
	const label = useGraphStore((state) => getInsertLabel(state.graph, edgeId));
	const requestFocus = useFlowStore((state) => state.requestFocus);

	return (
		<Menu.Root>
			<Menu.Trigger
				aria-label={label}
				className="gg-edge-button nodrag nopan"
				data-edge-id={edgeId}
				disabled={!canInsert(nodeCount, 'effect')}
				style={style}
			>
				<Plus aria-hidden="true" className="gg-icon" />
			</Menu.Trigger>
			<Menu.Portal container={container}>
				<Menu.Positioner className="gg-positioner" sideOffset={4}>
					<Menu.Popup className="gg-menu-popup nokey nowheel">
						{insertGroups.map((group, index) => (
							<Fragment key={group.label}>
								{index > 0 ? <Menu.Separator className="gg-menu-separator" /> : undefined}
								<Menu.Group>
									<Menu.GroupLabel className="gg-menu-label">{group.label}</Menu.GroupLabel>
									{group.options.map(({ insertion, key, label }) => (
										<Menu.Item
											className="gg-menu-item"
											disabled={!canInsert(nodeCount, insertion.kind)}
											key={key}
											onClick={() => {
												const nodeId = insertNode(edgeId, insertion);

												if (nodeId !== undefined) requestFocus({ id: nodeId, kind: 'node' });
											}}
										>
											{label}
										</Menu.Item>
									))}
								</Menu.Group>
							</Fragment>
						))}
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
		</Menu.Root>
	);
}
