import type { Graph } from '#glitch-graph/graph/graph-types.ts';

export interface TriggerState {
	graph: Graph;
	history: ReadonlyArray<unknown>;
	historyIndex: number;
	seed: number;
}

export function shouldRerun(previous: TriggerState, next: TriggerState) {
	// Every committed edit pushes or steps history, and a commit that changed nothing does neither
	if (previous.history !== next.history || previous.historyIndex !== next.historyIndex) return true;

	return next.seed !== previous.seed || !rendersSame(previous.graph, next.graph);
}

// An Output's name never reaches the engine, so a rename renders the same
function rendersSame(rendered: Graph, graph: Graph) {
	if (rendered.edges !== graph.edges) return false;

	return Object.values(graph.nodes).every((node) => {
		const previous = rendered.nodes[node.id];

		return previous === node || (previous?.kind === 'output' && node.kind === 'output');
	});
}
