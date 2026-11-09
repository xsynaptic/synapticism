import { describe, expect, test } from 'vitest';

import { compareProjectsForIndex } from '#lib/collections/projects/projects-order.ts';

function makeProject(
	id: string,
	dateCreated: string,
	{ dateUpdated, featuredOrder }: { dateUpdated?: string; featuredOrder?: number } = {},
) {
	return {
		data: {
			dateCreated: new Date(dateCreated),
			dateUpdated: dateUpdated ? new Date(dateUpdated) : undefined,
			featuredOrder,
		},
		id,
	};
}

function sortIds(projects: Array<ReturnType<typeof makeProject>>) {
	return projects.toSorted(compareProjectsForIndex).map((project) => project.id);
}

describe('compareProjectsForIndex', () => {
	test('puts featured projects first, in ascending featuredOrder', () => {
		const projects = [
			makeProject('recent', '2026-10-01'),
			makeProject('second', '2020-01-01', { featuredOrder: 2 }),
			makeProject('first', '2019-01-01', { featuredOrder: 1 }),
		];

		expect(sortIds(projects)).toEqual(['first', 'second', 'recent']);
	});

	test('lists unfeatured projects newest first', () => {
		const projects = [
			makeProject('older', '2024-01-01'),
			makeProject('newest', '2026-01-01'),
			makeProject('middle', '2025-01-01'),
		];

		expect(sortIds(projects)).toEqual(['newest', 'middle', 'older']);
	});

	test('prefers dateUpdated over dateCreated for unfeatured projects', () => {
		const projects = [
			makeProject('created', '2025-01-01'),
			makeProject('updated', '2020-01-01', { dateUpdated: '2026-06-01' }),
		];

		expect(sortIds(projects)).toEqual(['updated', 'created']);
	});

	test('breaks featuredOrder ties by date', () => {
		const projects = [
			makeProject('older', '2024-01-01', { featuredOrder: 1 }),
			makeProject('newer', '2025-01-01', { featuredOrder: 1 }),
		];

		expect(sortIds(projects)).toEqual(['newer', 'older']);
	});
});
