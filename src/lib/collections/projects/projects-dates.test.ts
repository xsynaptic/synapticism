import { describe, expect, test } from 'vitest';

import { getProjectDateParts } from '#lib/collections/projects/projects-dates.ts';

const dateCreated = new Date('2026-07-01T00:00:00Z');

describe('getProjectDateParts', () => {
	test('dates a one-off by its creation month', () => {
		expect(getProjectDateParts({ dateCreated })).toEqual([
			{ attribute: '2026-07', display: 'July 2026' },
		]);
	});

	test('runs an open start to the present', () => {
		expect(getProjectDateParts({ dateCreated, dateStarted: 2012 })).toEqual([
			{ attribute: '2012', display: '2012' },
			{ display: 'present' },
		]);
		expect(getProjectDateParts({ dateCreated, dateStarted: dateCreated })).toEqual([
			{ attribute: '2026-07', display: 'July 2026' },
			{ display: 'present' },
		]);
	});

	test('shows a closed range of years', () => {
		expect(getProjectDateParts({ dateCreated, dateEnded: 2026, dateStarted: 2024 })).toEqual([
			{ attribute: '2024', display: '2024' },
			{ attribute: '2026', display: '2026' },
		]);
	});

	test('collapses ends that display the same', () => {
		expect(
			getProjectDateParts({
				dateCreated,
				dateEnded: new Date('2026-07-28T00:00:00Z'),
				dateStarted: new Date('2026-07-03T00:00:00Z'),
			}),
		).toEqual([{ attribute: '2026-07', display: 'July 2026' }]);
	});
});
