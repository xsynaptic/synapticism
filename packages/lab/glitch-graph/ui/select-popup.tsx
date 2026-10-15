import { Select } from '@base-ui/react/select';

import { usePortalContainer } from '#glitch-graph/ui/portal-container.ts';

interface SelectPopupProps<Value extends number | string> {
	options: ReadonlyArray<{ label: string; value: Value }>;
}

// Every Select in the package portals into the CSS scope and opens below its trigger rather than over a zoomed one
export function SelectPopup<Value extends number | string>({ options }: SelectPopupProps<Value>) {
	const container = usePortalContainer();

	return (
		<Select.Portal container={container}>
			<Select.Positioner alignItemWithTrigger={false} className="gg-positioner" sideOffset={4}>
				<Select.Popup className="gg-select-popup nokey">
					<Select.List>
						{options.map((option) => (
							<Select.Item className="gg-select-item" key={option.value} value={option.value}>
								<Select.ItemText>{option.label}</Select.ItemText>
							</Select.Item>
						))}
					</Select.List>
				</Select.Popup>
			</Select.Positioner>
		</Select.Portal>
	);
}
