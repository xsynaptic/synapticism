import { describe, expect, test } from 'vitest';

import { compareProjectsForIndex } from '#lib/collections/projects/projects-order.ts';

function makeProject(
	id: string,
	dateCreated: string,
	{ dateUpdated, pinnedOrder }: { dateUpdated?: string; pinnedOrder?: number } = {},
) {
	return {
		data: {
			dateCreated: new Date(dateCreated),
			dateUpdated: dateUpdated ? new Date(dateUpdated) : undefined,
			pinnedOrder,
		},
		id,
	};
}

function sortIds(projects: Array<ReturnType<typeof makeProject>>) {
	return projects.toSorted(compareProjectsForIndex).map((project) => project.id);
}

describe('compareProjectsForIndex', () => {
	test('puts pinned projects first, in ascending pinnedOrder', () => {
		const projects = [
			makeProject('recent', '2026-10-01'),
			makeProject('second', '2020-01-01', { pinnedOrder: 2 }),
			makeProject('first', '2019-01-01', { pinnedOrder: 1 }),
		];

		expect(sortIds(projects)).toEqual(['first', 'second', 'recent']);
	});

	test('lists unpinned projects newest first', () => {
		const projects = [
			makeProject('older', '2024-01-01'),
			makeProject('newest', '2026-01-01'),
			makeProject('middle', '2025-01-01'),
		];

		expect(sortIds(projects)).toEqual(['newest', 'middle', 'older']);
	});

	test('prefers dateUpdated over dateCreated for unpinned projects', () => {
		const projects = [
			makeProject('created', '2025-01-01'),
			makeProject('updated', '2020-01-01', { dateUpdated: '2026-06-01' }),
		];

		expect(sortIds(projects)).toEqual(['updated', 'created']);
	});

	test('breaks pinnedOrder ties by date', () => {
		const projects = [
			makeProject('older', '2024-01-01', { pinnedOrder: 1 }),
			makeProject('newer', '2025-01-01', { pinnedOrder: 1 }),
		];

		expect(sortIds(projects)).toEqual(['newer', 'older']);
	});
});
