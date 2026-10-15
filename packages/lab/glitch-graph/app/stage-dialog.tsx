import { Dialog } from '@base-ui/react/dialog';

import { closeStage, useStageStore } from '#glitch-graph/app/stage-store.ts';
import { PixelDialog, PixelViewer } from '#glitch-graph/ui/pixel-dialog.tsx';

export function StageDialog() {
	const stage = useStageStore((state) => state.stage);

	if (stage === undefined) return;

	return (
		<Dialog.Root
			onOpenChange={(isOpen) => {
				if (!isOpen) closeStage();
			}}
			open={true}
		>
			<PixelDialog title={stage.name}>
				{stage.kind === 'ready' ? (
					<PixelViewer label={stage.name} src={stage.url} />
				) : (
					<p className="gg-stage-note" role={stage.kind === 'failed' ? 'alert' : 'status'}>
						{stage.kind === 'failed'
							? 'That stage could not be rendered. Close this and try again.'
							: 'Rendering…'}
					</p>
				)}
			</PixelDialog>
		</Dialog.Root>
	);
}
