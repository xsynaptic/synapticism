import { Field } from '@base-ui/react/field';
import { NumberField } from '@base-ui/react/number-field';
import { Toolbar } from '@base-ui/react/toolbar';
import { useRef } from 'react';

import { useGraphStore } from '../graph/graph-store.ts';
import { useRunStore } from './run-store.ts';

const maxSeed = 2 ** 32 - 1;

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
			</Toolbar.Root>
			<p className="gg-note">Your image never leaves this browser.</p>
		</div>
	);
}

function SeedControl() {
	const seed = useGraphStore((state) => state.seed);
	const setSeed = useGraphStore((state) => state.setSeed);

	return (
		<>
			<Field.Root className="gg-seed">
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
