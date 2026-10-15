import { create } from 'zustand';

import type { GraphNode } from '#glitch-graph/graph/graph-types.ts';

import { runInWorker } from '#glitch-graph/app/run-client.ts';
import { useRunStore } from '#glitch-graph/app/run-store.ts';
import { useGraphStore } from '#glitch-graph/graph/graph-store.ts';
import { getNodeLabel } from '#glitch-graph/graph/param-definitions.ts';

interface StageState {
	stage: StageView | undefined;
}

type StageView =
	| { kind: 'failed'; name: string }
	| { kind: 'ready'; name: string; url: string }
	| { kind: 'rendering'; name: string };

// Closing or opening another stage invalidates a run still in flight, which would otherwise reopen the dialog
let stageSequence = 0;

export const useStageStore = create<StageState>()(() => ({ stage: undefined }));

export function closeStage() {
	stageSequence += 1;

	revokeStage(useStageStore.getState().stage);
	useStageStore.setState({ stage: undefined });
}

export async function inspectStage(nodeId: string) {
	const { source } = useRunStore.getState();
	const { graph, seed } = useGraphStore.getState();
	const node = graph.nodes[nodeId];

	if (source === undefined || node === undefined) return;

	const sequence = (stageSequence += 1);
	const name = getStageName(node);

	revokeStage(useStageStore.getState().stage);
	useStageStore.setState({ stage: { kind: 'rendering', name } });

	try {
		const { images } = await runInWorker({ graph, seed, source }, nodeId);
		const image = images.get(nodeId);

		if (image === undefined) throw new Error(`The worker returned no frame for ${nodeId}`);

		const url = URL.createObjectURL(image);

		if (sequence !== stageSequence) {
			URL.revokeObjectURL(url);

			return;
		}

		useStageStore.setState({ stage: { kind: 'ready', name, url } });
	} catch {
		if (sequence !== stageSequence) return;

		useStageStore.setState({ stage: { kind: 'failed', name } });
	}
}

// A Split passes its input through, so what it shows is its mask
function getStageName(node: GraphNode) {
	return node.kind === 'split' ? `${getNodeLabel(node)} mask` : getNodeLabel(node);
}

function revokeStage(stage: StageView | undefined) {
	if (stage?.kind === 'ready') URL.revokeObjectURL(stage.url);
}
