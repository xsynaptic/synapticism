import { Dialog } from '@base-ui/react/dialog';
import { useShallow } from 'zustand/react/shallow';

import { useGraphStore } from '../graph/graph-store.ts';
import { getOutputs } from '../graph/graph-utils.ts';
import { usePortalContainer } from '../ui/portal-container.ts';
import { useIsStale, useRunStore } from './run-store.ts';

export function ResultsPanel() {
	const results = useRunStore((state) => state.results);
	const runError = useRunStore((state) => state.runError);
	const isStale = useIsStale();

	return (
		<section aria-label="Results" className="gg-results" data-stale={isStale}>
			<header className="gg-results-header">
				<p className="gg-results-title">Results</p>
				<p className="gg-note">Everything runs in this browser; your image is never uploaded.</p>
			</header>
			{runError === undefined ? undefined : (
				<p className="gg-error" role="alert">
					{runError}
				</p>
			)}
			<p className="gg-stale-note" role="status">
				{isStale
					? 'The graph has changed since these were rendered. Run again to update them.'
					: ''}
			</p>
			{results.length === 0 ? (
				<EmptyResults />
			) : (
				<ul className="gg-result-list">
					{results.map(({ id, name, url }) => (
						<ResultItem key={id} name={name} url={url} />
					))}
				</ul>
			)}
		</section>
	);
}

function EmptyResults() {
	const names = useGraphStore(
		useShallow((state) => getOutputs(state.graph).map(({ name }) => name)),
	);
	const aspectRatio = useRunStore((state) =>
		state.source === undefined ? 1 : state.source.width / state.source.height,
	);

	return (
		<>
			<p className="gg-empty-note">Press Run to render one image for each Output.</p>
			<ul aria-hidden="true" className="gg-result-list">
				{names.map((name, index) => (
					<li className="gg-result" data-placeholder={true} key={index}>
						<div className="gg-result-frame" style={{ aspectRatio }} />
						<div className="gg-result-caption">
							<span className="gg-result-name">{name}</span>
							<span>Not rendered yet</span>
						</div>
					</li>
				))}
			</ul>
		</>
	);
}

function ResultItem({ name, url }: { name: string; url: string }) {
	const container = usePortalContainer();
	const fileName = `${name.trim().replaceAll(/\W+/g, '-').toLowerCase() || 'output'}.png`;

	return (
		<li className="gg-result">
			<Dialog.Root>
				<Dialog.Trigger aria-label={`Enlarge ${name}`} className="gg-result-trigger">
					<img alt="" className="gg-result-image" src={url} />
				</Dialog.Trigger>
				<Dialog.Portal container={container}>
					<Dialog.Backdrop className="gg-dialog-backdrop" />
					<Dialog.Popup className="gg-dialog-popup">
						<Dialog.Title className="gg-node-title">{name}</Dialog.Title>
						<img alt={`${name} output`} className="gg-dialog-image" src={url} />
						<Dialog.Close className="gg-button">Close</Dialog.Close>
					</Dialog.Popup>
				</Dialog.Portal>
			</Dialog.Root>
			<div className="gg-result-caption">
				<span className="gg-result-name">{name}</span>
				<a className="gg-link" download={fileName} href={url}>
					Download PNG
				</a>
			</div>
		</li>
	);
}
