import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import { useEffect, useRef } from 'react';

import { AppToolbar } from '#glitch-graph/app/app-toolbar.tsx';
import { ResultsPanel } from '#glitch-graph/app/results-panel.tsx';
import '#glitch-graph/glitch-graph.css';
import { useRunStore } from '#glitch-graph/app/run-store.ts';
import defaultSourceUrl from '#glitch-graph/assets/default-source.jpg?url';
import { GraphCanvas } from '#glitch-graph/canvas/graph-canvas.tsx';
import { PortalContainerContext } from '#glitch-graph/ui/portal-container.ts';

export default function GlitchGraphApp() {
	const portalRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (useRunStore.getState().source !== undefined) return;

		void useRunStore.getState().loadDefaultSource(defaultSourceUrl);
	}, []);

	return (
		<PortalContainerContext value={portalRef}>
			<div className="gg-app">
				<AppToolbar />
				<ReactFlowProvider>
					<GraphCanvas />
				</ReactFlowProvider>
				<ResultsPanel />
				<div ref={portalRef} />
			</div>
		</PortalContainerContext>
	);
}
