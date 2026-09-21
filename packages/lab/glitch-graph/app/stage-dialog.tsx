import { Dialog } from '@base-ui/react/dialog';

import { closeStage, useRunStore } from '#glitch-graph/app/run-store.ts';
import { usePortalContainer } from '#glitch-graph/ui/portal-container.ts';

export function StageDialog() {
	const stage = useRunStore((state) => state.stage);
	const container = usePortalContainer();

	if (stage === undefined) return;

	return (
		<Dialog.Root
			onOpenChange={(isOpen) => {
				if (!isOpen) closeStage();
			}}
			open={true}
		>
			<Dialog.Portal container={container}>
				<Dialog.Backdrop className="gg-dialog-backdrop" />
				<Dialog.Popup className="gg-dialog-popup">
					<Dialog.Title className="gg-node-title">{stage.name}</Dialog.Title>
					{stage.kind === 'ready' ? (
						<img alt={stage.name} className="gg-dialog-image" src={stage.url} />
					) : (
						<p className="gg-stage-note" role={stage.kind === 'failed' ? 'alert' : 'status'}>
							{stage.kind === 'failed'
								? 'That stage could not be rendered. Close this and try again.'
								: 'Rendering…'}
						</p>
					)}
					<Dialog.Close className="gg-button">Close</Dialog.Close>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
