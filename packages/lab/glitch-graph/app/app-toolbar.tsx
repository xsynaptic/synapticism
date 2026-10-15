import type { LucideIcon } from 'lucide-react';

import { Menu } from '@base-ui/react/menu';
import { Select } from '@base-ui/react/select';
import { Toolbar } from '@base-ui/react/toolbar';
import {
	Check,
	ChevronDown,
	Dices,
	Ellipsis,
	Maximize2,
	Minimize2,
	Redo2,
	Undo2,
} from 'lucide-react';

import { resolutions } from '#glitch-graph/app/frame-image.ts';
import { useRunStore } from '#glitch-graph/app/run-store.ts';
import { useFlowStore } from '#glitch-graph/canvas/flow-store.ts';
import { graphPresets } from '#glitch-graph/graph/graph-presets.ts';
import {
	getRedoLabel,
	getUndoLabel,
	useActivePresetId,
	useGraphStore,
} from '#glitch-graph/graph/graph-store.ts';
import { hasAdjustableParams } from '#glitch-graph/graph/jitter.ts';
import { usePortalContainer } from '#glitch-graph/ui/portal-container.ts';
import { SelectPopup } from '#glitch-graph/ui/select-popup.tsx';

const presetItems = graphPresets.map(({ id, label }) => ({ label, value: id }));

export function AppToolbar() {
	return (
		<Toolbar.Root aria-label="Glitch graph controls" className="gg-toolbar">
			<PresetControl />
			<RandomizeButton />
			<Toolbar.Separator className="gg-toolbar-separator" />
			<HistoryControl />
			<span className="gg-toolbar-spacer" />
			<OptionsMenu />
			<ExpandButton />
		</Toolbar.Root>
	);
}

function ExpandButton() {
	const isFullscreen = useFlowStore((state) => state.isFullscreen);
	const setFullscreen = useFlowStore((state) => state.setFullscreen);
	const label = isFullscreen ? 'Leave full window' : 'Fill the window';
	const Icon = isFullscreen ? Minimize2 : Maximize2;

	return (
		<Toolbar.Button
			aria-label={label}
			className="gg-button gg-icon-button"
			onClick={() => {
				setFullscreen(!isFullscreen);
			}}
			title={isFullscreen ? `${label} (Esc)` : label}
		>
			<Icon aria-hidden="true" className="gg-icon" />
		</Toolbar.Button>
	);
}

function HistoryButton({
	icon: Icon,
	label,
	onClick,
	verb,
}: {
	icon: LucideIcon;
	label: string | undefined;
	onClick: () => void;
	verb: string;
}) {
	const title = label === undefined ? verb : `${verb}: ${label}`;

	return (
		<Toolbar.Button
			aria-label={title}
			className="gg-button gg-icon-button"
			disabled={label === undefined}
			onClick={onClick}
			title={title}
		>
			<Icon aria-hidden="true" className="gg-icon" />
		</Toolbar.Button>
	);
}

function HistoryControl() {
	const undoLabel = useGraphStore(getUndoLabel);
	const redoLabel = useGraphStore(getRedoLabel);
	const undo = useGraphStore((state) => state.undo);
	const redo = useGraphStore((state) => state.redo);

	return (
		<>
			<HistoryButton icon={Undo2} label={undoLabel} onClick={undo} verb="Undo" />
			<HistoryButton icon={Redo2} label={redoLabel} onClick={redo} verb="Redo" />
		</>
	);
}

function OptionsMenu() {
	const container = usePortalContainer();
	const isDebug = useFlowStore((state) => state.isDebug);
	const setDebug = useFlowStore((state) => state.setDebug);

	return (
		<Menu.Root>
			<Toolbar.Button
				aria-label="Options"
				className="gg-button gg-icon-button"
				render={<Menu.Trigger />}
				title="Options"
			>
				<Ellipsis aria-hidden="true" className="gg-icon" />
			</Toolbar.Button>
			<Menu.Portal container={container}>
				<Menu.Positioner align="end" className="gg-positioner" sideOffset={4}>
					<Menu.Popup className="gg-menu-popup">
						<ResolutionGroup />
						<Menu.Separator className="gg-menu-separator" />
						<Menu.CheckboxItem
							checked={isDebug}
							className="gg-menu-item"
							onCheckedChange={setDebug}
						>
							<Menu.CheckboxItemIndicator className="gg-menu-indicator" keepMounted={true}>
								<Check aria-hidden="true" className="gg-icon" />
							</Menu.CheckboxItemIndicator>
							Show layout metrics
						</Menu.CheckboxItem>
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
		</Menu.Root>
	);
}

function PresetControl() {
	const presetId = useActivePresetId();
	const loadPreset = useGraphStore((state) => state.loadPreset);
	// eslint-disable-next-line unicorn/no-null -- Base UI Select only shows its placeholder for `null`
	const value = presetId ?? null;

	return (
		<Select.Root
			items={presetItems}
			onValueChange={(next) => {
				const preset = graphPresets.find(({ id }) => id === next);

				if (preset !== undefined) loadPreset(preset.id);
			}}
			value={value}
		>
			<div className="gg-toolbar-field">
				<Select.Label className="gg-param-label">Look</Select.Label>
				<Toolbar.Button
					className="gg-select-trigger"
					data-placement="toolbar"
					render={<Select.Trigger />}
				>
					<Select.Value placeholder="Custom" />
					<Select.Icon className="gg-select-icon">
						<ChevronDown aria-hidden="true" className="gg-icon" />
					</Select.Icon>
				</Toolbar.Button>
			</div>
			<SelectPopup options={presetItems} />
		</Select.Root>
	);
}

function RandomizeButton() {
	const randomize = useGraphStore((state) => state.randomize);
	const canRandomize = useGraphStore((state) => hasAdjustableParams(state.graph));

	return (
		<Toolbar.Button
			className="gg-button"
			data-variant="primary"
			disabled={!canRandomize}
			onClick={randomize}
			title={
				canRandomize
					? 'Move every setting a little; Undo brings the last one back'
					: 'Add an effect first; a blank graph has nothing to vary'
			}
		>
			<Dices aria-hidden="true" className="gg-icon" />
			Randomize
		</Toolbar.Button>
	);
}

function ResolutionGroup() {
	const resolution = useRunStore((state) => state.resolution);
	const setResolution = useRunStore((state) => state.setResolution);

	return (
		<Menu.Group>
			<Menu.GroupLabel className="gg-menu-label">Image size, long edge</Menu.GroupLabel>
			<Menu.RadioGroup
				onValueChange={(value: number) => {
					setResolution(value);
				}}
				value={resolution}
			>
				{resolutions.map((value) => (
					<Menu.RadioItem className="gg-menu-item" key={value} value={value}>
						<Menu.RadioItemIndicator className="gg-menu-indicator" keepMounted={true}>
							<Check aria-hidden="true" className="gg-icon" />
						</Menu.RadioItemIndicator>
						{`${String(value)} px`}
					</Menu.RadioItem>
				))}
			</Menu.RadioGroup>
		</Menu.Group>
	);
}
