import { describe, expect, test } from 'vitest';

import {
	getAdjacentArchiveMonths,
	getArchiveMonthTitle,
	groupEntriesByArchive,
} from '#lib/archives/archives-utils.ts';

function makeEntry(id: string, dateCreated: string) {
	return { data: { dateCreated: new Date(dateCreated) }, id };
}

const ids = (entries: ReadonlyArray<{ id: string }>) => entries.map((entry) => entry.id);

describe('groupEntriesByArchive', () => {
	const years = groupEntriesByArchive([
		makeEntry('march-early', '2025-03-02T10:00:00Z'),
		makeEntry('december', '2024-12-31T23:00:00Z'),
		makeEntry('march-late', '2025-03-28T10:00:00Z'),
		makeEntry('may', '2025-05-01T00:00:00Z'),
	]);

	test('orders years, months and Entries newest first', () => {
		expect(years.map(({ year }) => year)).toEqual([2025, 2024]);
		expect(years[0]?.months.map(({ month }) => month)).toEqual([5, 3]);
		expect(ids(years[0]?.months[1]?.entries ?? [])).toEqual(['march-late', 'march-early']);
	});

	test('buckets by the UTC date, matching the displayed date', () => {
		const [archiveYear] = groupEntriesByArchive([makeEntry('zoned', '2025-02-01T06:00:00+08:00')]);

		expect(archiveYear?.year).toBe(2025);
		expect(archiveYear?.months[0]?.month).toBe(1);
	});
});

describe('getAdjacentArchiveMonths', () => {
	const adjacency = getAdjacentArchiveMonths(
		groupEntriesByArchive([
			makeEntry('january', '2025-01-10T00:00:00Z'),
			makeEntry('november', '2024-11-10T00:00:00Z'),
			makeEntry('june', '2024-06-10T00:00:00Z'),
		]),
	);

	const labels = adjacency.map(({ archiveMonth, nextMonth, previousMonth }) => ({
		current: getArchiveMonthTitle(archiveMonth),
		next: nextMonth ? getArchiveMonthTitle(nextMonth) : undefined,
		previous: previousMonth ? getArchiveMonthTitle(previousMonth) : undefined,
	}));

	test('skips empty months and crosses year boundaries', () => {
		expect(labels).toEqual([
			{ current: 'January 2025', next: undefined, previous: 'November 2024' },
			{ current: 'November 2024', next: 'January 2025', previous: 'June 2024' },
			{ current: 'June 2024', next: 'November 2024', previous: undefined },
		]);
	});
});
