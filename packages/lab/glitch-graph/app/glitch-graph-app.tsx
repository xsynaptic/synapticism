import { Controls, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/base.css';

import '../glitch-graph.css';

export default function GlitchGraphApp() {
	return (
		<div className="gg-canvas">
			<ReactFlow
				edges={[]}
				nodes={[]}
				nodesConnectable={false}
				nodesDraggable={false}
				preventScrolling={false}
				zoomOnScroll={false}
			>
				<Controls showInteractive={false} />
			</ReactFlow>
		</div>
	);
}
