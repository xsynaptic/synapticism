import { Dialog } from '@base-ui/react/dialog';

import { usePortalContainer } from '../ui/portal-container.ts';
import { useIsStale, useRunStore } from './run-store.ts';

export function ResultsPanel() {
	const results = useRunStore((state) => state.results);
	const error = useRunStore((state) => state.error);
	const isStale = useIsStale();

	return (
		<section aria-label="Results" className="gg-results" data-stale={isStale}>
			{error === undefined ? undefined : (
				<p className="gg-error" role="alert">
					{error}
				</p>
			)}
			{isStale ? (
				<p className="gg-stale-note" role="status">
					The graph has changed since these were rendered. Run again to update them.
				</p>
			) : undefined}
			{results.length === 0 ? (
				<p className="gg-note">Press Run to render one image for each Output.</p>
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
				<span>{name}</span>
				<a className="gg-link" download={fileName} href={url}>
					Download PNG
				</a>
			</div>
		</li>
	);
}
