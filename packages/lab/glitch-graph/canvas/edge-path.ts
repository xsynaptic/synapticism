export interface Point {
	x: number;
	y: number;
}

export function buildRoundedPath(points: ReadonlyArray<Point>, radius: number) {
	const [first] = points;

	if (first === undefined) return '';

	const commands = [`M ${formatPoint(first)}`];

	for (let index = 1; index < points.length - 1; index++) {
		commands.push(
			buildCorner(
				[points[index - 1] ?? first, points[index] ?? first, points[index + 1] ?? first],
				radius,
			),
		);
	}

	const last = points.at(-1);

	if (last !== undefined && points.length > 1) commands.push(`L ${formatPoint(last)}`);

	return commands.join(' ');
}

// Segments shorter than two radii get half their length, so neighbouring bends never overlap
function buildCorner([previous, corner, next]: readonly [Point, Point, Point], radius: number) {
	const lengthIn = Math.hypot(corner.x - previous.x, corner.y - previous.y);
	const lengthOut = Math.hypot(next.x - corner.x, next.y - corner.y);
	const clamped = Math.min(radius, lengthIn / 2, lengthOut / 2);

	if (clamped === 0) return `L ${formatPoint(corner)}`;

	const entry = moveToward(corner, previous, clamped / lengthIn);
	const exit = moveToward(corner, next, clamped / lengthOut);

	return `L ${formatPoint(entry)} Q ${formatPoint(corner)} ${formatPoint(exit)}`;
}

function formatPoint({ x, y }: Point) {
	return `${String(Math.round(x * 100) / 100)} ${String(Math.round(y * 100) / 100)}`;
}

function moveToward(from: Point, to: Point, fraction: number) {
	return { x: from.x + (to.x - from.x) * fraction, y: from.y + (to.y - from.y) * fraction };
}
