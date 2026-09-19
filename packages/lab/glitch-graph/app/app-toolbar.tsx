import { Field } from '@base-ui/react/field';
import { NumberField } from '@base-ui/react/number-field';
import { Select } from '@base-ui/react/select';
import { Toolbar } from '@base-ui/react/toolbar';
import { useRef } from 'react';

import type { PresetId } from '../graph/graph-presets.ts';

import { useFlowStore } from '../canvas/flow-store.ts';
import { graphPresets } from '../graph/graph-presets.ts';
import { useGraphStore } from '../graph/graph-store.ts';
import { usePortalContainer } from '../ui/portal-container.ts';
import { useRunStore } from './run-store.ts';

const maxSeed = 2 ** 32 - 1;

const presetItems = graphPresets.map(({ id, label }) => ({ label, value: id }));

export function AppToolbar() {
	const status = useRunStore((state) => state.status);
	const hasSource = useRunStore((state) => state.source !== undefined);
	const runGraph = useRunStore((state) => state.runGraph);

	return (
		<div className="gg-toolbar-row">
			<Toolbar.Root aria-label="Glitch graph controls" className="gg-toolbar">
				<Toolbar.Button
					className="gg-button"
					data-variant="primary"
					disabled={!hasSource || status !== 'idle'}
					onClick={() => void runGraph()}
				>
					{status === 'running' ? 'Running…' : 'Run'}
				</Toolbar.Button>
				<Toolbar.Separator className="gg-toolbar-separator" />
				<SeedControl />
				<Toolbar.Separator className="gg-toolbar-separator" />
				<UploadControl isDisabled={status !== 'idle'} />
				<Toolbar.Separator className="gg-toolbar-separator" />
				<PresetControl />
			</Toolbar.Root>
			<p className="gg-note">Your image never leaves this browser.</p>
		</div>
	);
}

function PresetControl() {
	const presetId = useGraphStore((state) => state.presetId);
	const loadPreset = useGraphStore((state) => state.loadPreset);
	const resetView = useFlowStore((state) => state.resetView);

	function load(id: PresetId) {
		loadPreset(id);
		resetView();
	}

	return (
		<>
			<PresetSelect onSelect={load} presetId={presetId} />
			<Toolbar.Button
				className="gg-button"
				onClick={() => {
					load(presetId);
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
	presetId: PresetId;
}) {
	const container = usePortalContainer();

	return (
		<Select.Root
			items={presetItems}
			onValueChange={(next) => {
				const preset = graphPresets.find(({ id }) => id === next);

				if (preset !== undefined) onSelect(preset.id);
			}}
			value={presetId}
		>
			<div className="gg-toolbar-field">
				<Select.Label className="gg-param-label">Preset</Select.Label>
				<Toolbar.Button
					className="gg-select-trigger"
					data-placement="toolbar"
					render={<Select.Trigger />}
				>
					<Select.Value />
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

	return (
		<>
			<Field.Root className="gg-toolbar-field">
				<NumberField.Root
					format={{ useGrouping: false }}
					max={maxSeed}
					min={0}
					onValueChange={(value) => {
						if (value !== null) setSeed(value);
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
				}}
			>
				Reseed
			</Toolbar.Button>
		</>
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
				Upload image
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
