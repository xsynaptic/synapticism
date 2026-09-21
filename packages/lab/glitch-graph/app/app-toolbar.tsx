import { Field } from '@base-ui/react/field';
import { NumberField } from '@base-ui/react/number-field';
import { Select } from '@base-ui/react/select';
import { Switch } from '@base-ui/react/switch';
import { Toolbar } from '@base-ui/react/toolbar';
import { useRef } from 'react';

import type { PresetId } from '#glitch-graph/graph/graph-presets.ts';

import { useRunStore } from '#glitch-graph/app/run-store.ts';
import { useFlowStore } from '#glitch-graph/canvas/flow-store.ts';
import { graphPresets } from '#glitch-graph/graph/graph-presets.ts';
import {
	getRedoLabel,
	getUndoLabel,
	useActivePresetId,
	useGraphStore,
} from '#glitch-graph/graph/graph-store.ts';
import { usePortalContainer } from '#glitch-graph/ui/portal-container.ts';

const maxSeed = 2 ** 32 - 1;

const presetItems = graphPresets.map(({ id, label }) => ({ label, value: id }));

export function AppToolbar() {
	const status = useRunStore((state) => state.status);
	const sourceError = useRunStore((state) => state.sourceError);

	return (
		<div className="gg-toolbar-row">
			<Toolbar.Root aria-label="Glitch graph controls" className="gg-toolbar">
				<UploadControl isDisabled={status !== 'idle'} />
				<Toolbar.Separator className="gg-toolbar-separator" />
				<SeedControl />
				<Toolbar.Separator className="gg-toolbar-separator" />
				<PresetControl />
				<Toolbar.Separator className="gg-toolbar-separator" />
				<HistoryControl />
				<Toolbar.Separator className="gg-toolbar-separator" />
				<LiveSwitch />
				<DebugSwitch />
			</Toolbar.Root>
			{sourceError === undefined ? undefined : (
				<p className="gg-error" role="alert">
					{sourceError}
				</p>
			)}
		</div>
	);
}

function DebugSwitch() {
	const isDebug = useFlowStore((state) => state.isDebug);
	const setDebug = useFlowStore((state) => state.setDebug);

	return <ToolbarSwitch isChecked={isDebug} label="Debug" onChange={setDebug} />;
}

function HistoryButton({
	glyph,
	label,
	onClick,
	verb,
}: {
	glyph: string;
	label: string | undefined;
	onClick: () => void;
	verb: string;
}) {
	const title = label === undefined ? verb : `${verb}: ${label}`;

	return (
		<Toolbar.Button
			aria-label={title}
			className="gg-button gg-glyph-button"
			disabled={label === undefined}
			onClick={onClick}
			title={title}
		>
			{glyph}
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
			<HistoryButton glyph="↺" label={undoLabel} onClick={undo} verb="Undo" />
			<HistoryButton glyph="↻" label={redoLabel} onClick={redo} verb="Redo" />
		</>
	);
}

function LiveSwitch() {
	const isLive = useRunStore((state) => state.isLive);
	const setLive = useRunStore((state) => state.setLive);

	return <ToolbarSwitch isChecked={isLive} label="Live" onChange={setLive} />;
}

function PresetControl() {
	const presetId = useActivePresetId();
	const loadPreset = useGraphStore((state) => state.loadPreset);
	const reset = useGraphStore((state) => state.reset);
	const resetView = useFlowStore((state) => state.resetView);
	const clearResults = useRunStore((state) => state.clearResults);

	return (
		<>
			<PresetSelect
				onSelect={(id) => {
					loadPreset(id);
					resetView();
				}}
				presetId={presetId}
			/>
			<Toolbar.Button
				className="gg-button"
				onClick={() => {
					reset();
					resetView();
					clearResults();
				}}
			>
				Reset
			</Toolbar.Button>
		</>
	);
}

function PresetSelect({
	onSelect,
	presetId,
}: {
	onSelect: (id: PresetId) => void;
	presetId: PresetId | undefined;
}) {
	const container = usePortalContainer();
	// eslint-disable-next-line unicorn/no-null -- Base UI Select only shows its placeholder for `null`
	const value = presetId ?? null;

	return (
		<Select.Root
			items={presetItems}
			onValueChange={(next) => {
				const preset = graphPresets.find(({ id }) => id === next);

				if (preset !== undefined) onSelect(preset.id);
			}}
			value={value}
		>
			<div className="gg-toolbar-field">
				<Select.Label className="gg-param-label">Preset</Select.Label>
				<Toolbar.Button
					className="gg-select-trigger"
					data-placement="toolbar"
					render={<Select.Trigger />}
				>
					<Select.Value placeholder="Custom settings" />
					<Select.Icon className="gg-select-icon">▾</Select.Icon>
				</Toolbar.Button>
			</div>
			<Select.Portal container={container}>
				<Select.Positioner alignItemWithTrigger={false} className="gg-positioner" sideOffset={4}>
					<Select.Popup className="gg-select-popup">
						<Select.List>
							{presetItems.map((item) => (
								<Select.Item className="gg-select-item" key={item.value} value={item.value}>
									<Select.ItemText>{item.label}</Select.ItemText>
								</Select.Item>
							))}
						</Select.List>
					</Select.Popup>
				</Select.Positioner>
			</Select.Portal>
		</Select.Root>
	);
}

function SeedControl() {
	const seed = useGraphStore((state) => state.seed);
	const setSeed = useGraphStore((state) => state.setSeed);
	const commitEdit = useGraphStore((state) => state.commitEdit);

	return (
		<>
			<Field.Root>
				<NumberField.Root
					className="gg-toolbar-field"
					format={{ useGrouping: false }}
					max={maxSeed}
					min={0}
					onValueChange={(value) => {
						if (value !== null) setSeed(value);
					}}
					onValueCommitted={() => {
						commitEdit('Set seed');
					}}
					step={1}
					value={seed}
				>
					<Field.Label className="gg-param-label">Seed</Field.Label>
					<Toolbar.Input render={<NumberField.Input className="gg-seed-input" />} />
				</NumberField.Root>
			</Field.Root>
			<Toolbar.Button
				className="gg-button"
				onClick={() => {
					setSeed(crypto.getRandomValues(new Uint32Array(1))[0] ?? 0);
					commitEdit('Reseed');
				}}
			>
				Reseed
			</Toolbar.Button>
		</>
	);
}

// Toolbar.Button replaces the switch role with `button` unless one is passed
function ToolbarSwitch({
	isChecked,
	label,
	onChange,
}: {
	isChecked: boolean;
	label: string;
	onChange: (isChecked: boolean) => void;
}) {
	return (
		<label className="gg-toolbar-field">
			<span className="gg-param-label">{label}</span>
			<Toolbar.Button
				className="gg-switch"
				nativeButton={false}
				render={<Switch.Root checked={isChecked} onCheckedChange={onChange} />}
				role="switch"
			>
				<Switch.Thumb className="gg-switch-thumb" />
			</Toolbar.Button>
		</label>
	);
}

function UploadControl({ isDisabled }: { isDisabled: boolean }) {
	const loadSource = useRunStore((state) => state.loadSource);
	const fileInputRef = useRef<HTMLInputElement>(null);

	return (
		<>
			<Toolbar.Button
				className="gg-button"
				disabled={isDisabled}
				onClick={() => fileInputRef.current?.click()}
			>
				Select image…
			</Toolbar.Button>
			<input
				accept="image/*"
				hidden={true}
				onChange={(event) => {
					const file = event.currentTarget.files?.[0];

					if (file !== undefined) void loadSource(file);

					event.currentTarget.value = '';
				}}
				ref={fileInputRef}
				type="file"
			/>
		</>
	);
}
