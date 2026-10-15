import { Dialog } from '@base-ui/react/dialog';
import { Download, Eye, ImagePlus } from 'lucide-react';
import { useRef, useState } from 'react';

import { getShownId, originalId, useRunStore } from '#glitch-graph/app/run-store.ts';
import { PixelDialog, PixelViewer } from '#glitch-graph/ui/pixel-dialog.tsx';

interface Shown {
	fileName: string | undefined;
	id: string;
	label: string;
	url: string;
}

const compareKeys = new Set([' ', 'Enter']);

export function PreviewPanel() {
	const loadSource = useRunStore((state) => state.loadSource);
	const [isDropTarget, setIsDropTarget] = useState(false);
	const shown = useShown();

	return (
		<section
			aria-label="Preview"
			className="gg-preview"
			data-drop-target={isDropTarget}
			onDragLeave={() => {
				setIsDropTarget(false);
			}}
			onDragOver={(event) => {
				if (!event.dataTransfer.types.includes('Files')) return;

				event.preventDefault();
				setIsDropTarget(true);
			}}
			onDrop={(event) => {
				const file = event.dataTransfer.files[0];

				event.preventDefault();
				setIsDropTarget(false);

				if (file !== undefined) void loadSource(file);
			}}
		>
			<ShownImage shown={shown} />
			<PreviewStrip selectedId={shown?.id} />
			<SourceControl />
		</section>
	);
}

function CompareButton({ onCompare }: { onCompare: (isComparing: boolean) => void }) {
	const release = () => {
		onCompare(false);
	};

	return (
		<button
			className="gg-button"
			onBlur={release}
			onKeyDown={(event) => {
				if (compareKeys.has(event.key)) onCompare(true);
			}}
			onKeyUp={release}
			onPointerCancel={release}
			onPointerDown={() => {
				onCompare(true);
			}}
			onPointerLeave={release}
			onPointerUp={release}
			title="Hold to see the original"
			type="button"
		>
			<Eye aria-hidden="true" className="gg-icon" />
			Original
		</button>
	);
}

function PreviewStrip({ selectedId }: { selectedId: string | undefined }) {
	const results = useRunStore((state) => state.results);
	const sourceUrl = useRunStore((state) => state.sourceUrl);
	const selectOutput = useRunStore((state) => state.selectOutput);

	return (
		<ul aria-label="Shown in the preview" className="gg-strip">
			{sourceUrl === undefined ? undefined : (
				<StripTile
					isSelected={selectedId === originalId}
					label="Original"
					onSelect={() => {
						selectOutput(originalId);
					}}
					url={sourceUrl}
				/>
			)}
			{results.map(({ id, name, url }) => (
				<StripTile
					isSelected={selectedId === id}
					key={id}
					label={name}
					onSelect={() => {
						selectOutput(id);
					}}
					url={url}
				/>
			))}
		</ul>
	);
}

function getFileName(name: string) {
	return `${name.trim().replaceAll(/\W+/g, '-').toLowerCase() || 'output'}.png`;
}

function SourceControl() {
	const loadSource = useRunStore((state) => state.loadSource);
	const sourceError = useRunStore((state) => state.sourceError);
	const runError = useRunStore((state) => state.runError);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const error = sourceError ?? runError;

	return (
		<div className="gg-source">
			<button className="gg-button" onClick={() => fileInputRef.current?.click()} type="button">
				<ImagePlus aria-hidden="true" className="gg-icon" />
				Use your own image…
			</button>
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
			{error === undefined ? (
				<p className="gg-note">Or drop one here. It never leaves this browser.</p>
			) : (
				<p className="gg-error" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}

function StripTile({
	isSelected,
	label,
	onSelect,
	url,
}: {
	isSelected: boolean;
	label: string;
	onSelect: () => void;
	url: string;
}) {
	return (
		<li>
			<button aria-pressed={isSelected} className="gg-strip-tile" onClick={onSelect} type="button">
				<img alt="" className="gg-strip-image" src={url} />
				<span className="gg-result-name">{label}</span>
			</button>
		</li>
	);
}

function ShownImage({ shown }: { shown: Shown | undefined }) {
	const [isComparing, setIsComparing] = useState(false);
	const isRendering = useRunStore((state) => state.isRendering);
	const sourceUrl = useRunStore((state) => state.sourceUrl);
	const size = useRunStore(({ source }) =>
		source === undefined ? undefined : `${String(source.width)} × ${String(source.height)}`,
	);

	if (shown === undefined) return <div className="gg-preview-frame" data-empty={true} />;

	const isOutput = shown.fileName !== undefined;
	const url = isComparing && sourceUrl !== undefined ? sourceUrl : shown.url;

	return (
		<>
			<div className="gg-preview-frame">
				<PixelImage label={shown.label} src={url} />
			</div>
			<div className="gg-preview-caption">
				<p className="gg-preview-name">
					<span className="gg-result-name">{shown.label}</span>
					<span className="gg-note">{size}</span>
					<span aria-hidden="true" className="gg-render-status" data-rendering={isRendering}>
						Rendering…
					</span>
				</p>
				{isOutput ? (
					<div className="gg-preview-actions">
						<CompareButton onCompare={setIsComparing} />
						<a className="gg-button" download={shown.fileName} href={shown.url}>
							<Download aria-hidden="true" className="gg-icon" />
							Download
						</a>
					</div>
				) : undefined}
			</div>
		</>
	);
}

// The pane scales the image to fit, which hides pixel-scale texture; the dialog shows it 1:1
function PixelImage({ label, src }: { label: string; src: string }) {
	return (
		<Dialog.Root>
			<Dialog.Trigger
				aria-label={`View ${label} at actual pixels`}
				className="gg-preview-trigger"
				title="View at actual pixels"
			>
				<img alt="" className="gg-preview-image" src={src} />
			</Dialog.Trigger>
			<PixelDialog title={label}>
				<PixelViewer label={label} src={src} />
			</PixelDialog>
		</Dialog.Root>
	);
}

function useShown(): Shown | undefined {
	const shownId = useRunStore(getShownId);
	const sourceUrl = useRunStore((state) => state.sourceUrl);
	const result = useRunStore((state) => state.results.find(({ id }) => id === shownId));

	if (shownId === originalId && sourceUrl !== undefined) {
		return { fileName: undefined, id: originalId, label: 'Original', url: sourceUrl };
	}

	if (result === undefined) return;

	return { fileName: getFileName(result.name), id: result.id, label: result.name, url: result.url };
}
