import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import { useEffect, useRef } from 'react';

import defaultSourceUrl from '../assets/default-source.jpg?url';
import { GraphCanvas } from '../canvas/graph-canvas.tsx';
import '../glitch-graph.css';
import { PortalContainerContext } from '../ui/portal-container.ts';
import { AppToolbar } from './app-toolbar.tsx';
import { ResultsPanel } from './results-panel.tsx';
import { useRunStore } from './run-store.ts';

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
