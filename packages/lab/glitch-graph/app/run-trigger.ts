import type { Graph } from '#glitch-graph/graph/graph-types.ts';

import { rendersSame } from '#glitch-graph/app/run-staleness.ts';

export type RunQuality = 'full' | 'preview';

export interface TriggerState {
	graph: Graph;
	history: ReadonlyArray<unknown>;
	historyIndex: number;
	seed: number;
}

export function getRunQuality(previous: TriggerState, next: TriggerState): RunQuality | undefined {
	// Every committed edit pushes or steps history, and a commit that changed nothing does neither
	if (previous.history !== next.history || previous.historyIndex !== next.historyIndex)
		return 'full';

	if (next.seed !== previous.seed || !rendersSame(previous.graph, next.graph)) return 'preview';

	return;
}
