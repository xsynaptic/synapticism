import type { CSSProperties } from 'react';

import { Menu } from '@base-ui/react/menu';
import { Fragment } from 'react';

import type { Insertion } from '../graph/graph-operations.ts';

import { canInsert, getNodeCount } from '../graph/graph-operations.ts';
import { useGraphStore } from '../graph/graph-store.ts';
import {
	effectDefinitions,
	effectKinds,
	predicateDefinitions,
	predicateKinds,
} from '../graph/param-definitions.ts';
import { usePortalContainer } from '../ui/portal-container.ts';

interface InsertOption {
	insertion: Insertion;
	key: string;
	label: string;
}

const insertGroups: ReadonlyArray<{ label: string; options: ReadonlyArray<InsertOption> }> = [
	{
		label: 'Effect',
		options: effectKinds.map((effect) => ({
			insertion: { effect, kind: 'effect' },
			key: effect,
			label: effectDefinitions[effect].label,
		})),
	},
	{
		label: 'Split by',
		options: predicateKinds.map((predicate) => ({
			insertion: { kind: 'split', predicate },
			key: predicate,
			label: predicateDefinitions[predicate].label,
		})),
	},
	{
		label: 'Fork',
		options: [{ insertion: { kind: 'fork' }, key: 'fork', label: 'To a new Output' }],
	},
];

export function InsertMenu({ edgeId, style }: { edgeId: string; style: CSSProperties }) {
	const container = usePortalContainer();
	const insertNode = useGraphStore((state) => state.insertNode);
	const nodeCount = useGraphStore((state) => getNodeCount(state.graph));

	return (
		<Menu.Root>
			<Menu.Trigger
				aria-label="Insert a node here"
				className="gg-edge-button nodrag nopan"
				disabled={!canInsert(nodeCount, 'effect')}
				style={style}
			>
				+
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
												insertNode(edgeId, insertion);
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
