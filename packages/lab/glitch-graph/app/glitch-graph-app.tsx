import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import { useEffect, useRef } from 'react';

import { AppToolbar } from '#glitch-graph/app/app-toolbar.tsx';
import { PreviewPanel } from '#glitch-graph/app/preview-panel.tsx';
import { useRunStore } from '#glitch-graph/app/run-store.ts';
import { StageDialog } from '#glitch-graph/app/stage-dialog.tsx';
import '#glitch-graph/glitch-graph.css';
import defaultSourceUrl from '#glitch-graph/assets/default-source.jpg?url';
import { useFlowStore } from '#glitch-graph/canvas/flow-store.ts';
import { GraphCanvas } from '#glitch-graph/canvas/graph-canvas.tsx';
import { useGraphStore } from '#glitch-graph/graph/graph-store.ts';
import { PortalContainerContext } from '#glitch-graph/ui/portal-container.ts';

export default function GlitchGraphApp() {
	const portalRef = useRef<HTMLDivElement>(null);
	const isFullscreen = useFlowStore((state) => state.isFullscreen);

	useEffect(() => {
		if (useRunStore.getState().source !== undefined) return;

		void useRunStore.getState().loadDefaultSource(defaultSourceUrl);
	}, []);

	useEffect(() => {
		globalThis.addEventListener('keydown', handleHistoryKey);

		return () => {
			globalThis.removeEventListener('keydown', handleHistoryKey);
		};
	}, []);

	useFullscreenShell(isFullscreen);

	return (
		<PortalContainerContext value={portalRef}>
			<div className="gg-app" data-fullscreen={isFullscreen}>
				<AppToolbar />
				<div className="gg-workspace">
					<ReactFlowProvider>
						<GraphCanvas />
					</ReactFlowProvider>
					<PreviewPanel />
				</div>
				<StageDialog />
				<div ref={portalRef} />
			</div>
		</PortalContainerContext>
	);
}

// A dialog or popup handles Escape first and marks the event, so fullscreen is the last layer to close
function handleFullscreenKey(event: KeyboardEvent) {
	if (event.key !== 'Escape' || event.defaultPrevented) return;

	useFlowStore.getState().setFullscreen(false);
}

function handleHistoryKey(event: KeyboardEvent) {
	if (event.altKey || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return;

	// The Output name fields keep the browser's own undo
	if (event.target instanceof HTMLInputElement && event.target.type === 'text') return;

	event.preventDefault();

	const { redo, undo } = useGraphStore.getState();

	if (event.shiftKey) {
		redo();

		return;
	}

	undo();
}

// The overlay covers the page, so the page behind it must not scroll under it
function useFullscreenShell(isFullscreen: boolean) {
	useEffect(() => {
		if (!isFullscreen) return;

		const { documentElement } = document;
		const restoreOverflow = documentElement.style.overflow;

		documentElement.style.overflow = 'hidden';
		globalThis.addEventListener('keydown', handleFullscreenKey);

		return () => {
			documentElement.style.overflow = restoreOverflow;
			globalThis.removeEventListener('keydown', handleFullscreenKey);
		};
	}, [isFullscreen]);
}
