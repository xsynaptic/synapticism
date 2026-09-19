import type { ELK, ElkExtendedEdge, ElkNode, ElkPort } from 'elkjs/lib/elk.bundled.js';

import type { Graph, GraphNode } from '../graph/graph-types.ts';
import type { Point } from './edge-path.ts';

import { getModelOrder } from '../graph/graph-utils.ts';

export interface EdgeRoute {
	branchLabel?: Point;
	button: Point;
	points: Array<Point>;
}

export interface LayoutResult {
	positions: Map<string, Point>;
	routes: Map<string, EdgeRoute>;
}

export interface NodeSize {
	height: number;
	width: number;
}

export const branchLabelSize = { height: 16, width: 48 };

const plusButtonSize = 24;

const branchCount = 2;

const layoutOptions = {
	'elk.algorithm': 'layered',
	'elk.direction': 'DOWN',
	'elk.edgeRouting': 'ORTHOGONAL',
	'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
	'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
	'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
	'elk.layered.spacing.edgeNodeBetweenLayers': '12',
	'elk.layered.spacing.nodeNodeBetweenLayers': '20',
	'elk.padding': '[top=24,left=24,bottom=24,right=24]',
	'elk.randomSeed': '1',
	'elk.spacing.edgeEdge': '16',
	'elk.spacing.edgeLabel': '4',
	'elk.spacing.edgeNode': '24',
	'elk.spacing.nodeNode': '40',
};

let elkPromise: Promise<ELK> | undefined;

export async function layoutGraph(graph: Graph, sizes: ReadonlyMap<string, NodeSize>) {
	if (elkPromise === undefined) elkPromise = createElk();

	const elk = await elkPromise;
	const result = await elk.layout(buildElkGraph(graph, sizes));

	return readLayout(result);
}

function buildElkEdges(graph: Graph, order: Array<string>): Array<ElkExtendedEdge> {
	const rank = new Map(order.map((id, index) => [id, index]));
	const edges = graph.edges.toSorted(
		(first, second) =>
			(rank.get(first.source) ?? 0) - (rank.get(second.source) ?? 0) ||
			first.sourceIndex - second.sourceIndex,
	);

	return edges.map((edge) => ({
		id: edge.id,
		labels: [
			{
				height: plusButtonSize,
				id: getLabelId(edge.id, 'plus'),
				layoutOptions: { 'elk.edgeLabels.inline': 'true', 'elk.edgeLabels.placement': 'CENTER' },
				// ELK skips a label without text, so the reserved space would vanish
				text: '+',
				width: plusButtonSize,
			},
			...(graph.nodes[edge.source]?.kind === 'split'
				? [
						{
							...branchLabelSize,
							id: getLabelId(edge.id, 'branch'),
							layoutOptions: { 'elk.edgeLabels.placement': 'TAIL' },
							text: 'branch',
						},
					]
				: []),
		],
		sources: [
			getBranchDirection(graph.nodes[edge.source]) === 'out'
				? getPortId(edge.source, 'out', edge.sourceIndex)
				: edge.source,
		],
		targets: [
			getBranchDirection(graph.nodes[edge.target]) === 'in'
				? getPortId(edge.target, 'in', edge.targetIndex)
				: edge.target,
		],
	}));
}

function buildElkGraph(graph: Graph, sizes: ReadonlyMap<string, NodeSize>): ElkNode {
	const order = getModelOrder(graph);

	return {
		children: order.map((id) => buildElkNode(graph.nodes[id], id, sizes.get(id))),
		edges: buildElkEdges(graph, order),
		id: 'root',
		layoutOptions,
	};
}

function buildElkNode(
	node: GraphNode | undefined,
	id: string,
	size: NodeSize | undefined,
): ElkNode {
	const elkNode = { height: size?.height ?? 0, id, width: size?.width ?? 0 };
	const direction = getBranchDirection(node);

	if (node?.kind === 'output') {
		return {
			...elkNode,
			layoutOptions: { 'elk.layered.layering.layerConstraint': 'LAST_SEPARATE' },
		};
	}

	if (direction === undefined) return elkNode;

	return {
		...elkNode,
		layoutOptions: { 'elk.portConstraints': 'FIXED_ORDER' },
		ports: buildPorts(id, direction),
	};
}

// ELK orders fixed ports clockwise, so south-side ports run right to left
function buildPorts(id: string, direction: 'in' | 'out'): Array<ElkPort> {
	return Array.from({ length: branchCount }, (_, branchIndex) => ({
		height: 0,
		id: getPortId(id, direction, branchIndex),
		layoutOptions: {
			'elk.port.index': String(direction === 'out' ? branchCount - 1 - branchIndex : branchIndex),
			'elk.port.side': direction === 'out' ? 'SOUTH' : 'NORTH',
		},
		width: 0,
	}));
}

async function createElk() {
	const { default: Elk } = await import('elkjs/lib/elk.bundled.js');

	return new Elk();
}

function getBranchDirection(node: GraphNode | undefined) {
	if (node?.kind === 'merge') return 'in';
	if (node?.kind === 'split' || node?.kind === 'fork') return 'out';

	return;
}

function getLabelId(edgeId: string, role: 'branch' | 'plus') {
	return `${edgeId}:${role}`;
}

function getPortId(id: string, direction: 'in' | 'out', branchIndex: number) {
	return `${id}:${direction}:${String(branchIndex)}`;
}

function readLabelPosition(edge: ElkExtendedEdge, role: 'branch' | 'plus') {
	const label = edge.labels?.find((candidate) => candidate.id === getLabelId(edge.id, role));

	if (label === undefined) return;

	return { x: label.x ?? 0, y: label.y ?? 0 };
}

function readLayout(result: ElkNode): LayoutResult {
	const positions = new Map<string, Point>();
	const routes = new Map<string, EdgeRoute>();

	const children = result.children ?? [];
	const edges = result.edges ?? [];

	for (const child of children) {
		positions.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
	}

	for (const edge of edges) {
		const route = readRoute(edge);

		if (route !== undefined) routes.set(edge.id, route);
	}

	return { positions, routes };
}

function readRoute(edge: ElkExtendedEdge): EdgeRoute | undefined {
	const section = edge.sections?.[0];
	const plusLabel = readLabelPosition(edge, 'plus');

	if (section === undefined || plusLabel === undefined) return undefined;

	const points = [section.startPoint, ...(section.bendPoints ?? []), section.endPoint].map(
		({ x, y }) => ({ x, y }),
	);
	const button = { x: plusLabel.x + plusButtonSize / 2, y: plusLabel.y + plusButtonSize / 2 };
	const branchLabel = readLabelPosition(edge, 'branch');

	return branchLabel === undefined ? { button, points } : { branchLabel, button, points };
}
