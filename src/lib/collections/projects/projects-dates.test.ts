import { describe, expect, test } from 'vitest';

import { getProjectDateParts } from '#lib/collections/projects/projects-dates.ts';

const present = { display: 'present' };

describe('getProjectDateParts', () => {
	test('leaves a one-off without a range', () => {
		expect(getProjectDateParts({})).toBeUndefined();
		expect(getProjectDateParts({ dateEnded: 2026 })).toBeUndefined();
	});

	test('dates by the UTC month whatever the machine zone', () => {
		expect(getProjectDateParts({ dateStarted: new Date('2026-06-30T23:59:59Z') })).toEqual([
			{ attribute: '2026-06', display: 'June 2026' },
			present,
		]);
	});

	test('runs an open start to the present', () => {
		expect(getProjectDateParts({ dateStarted: 2012 })).toEqual([
			{ attribute: '2012', display: '2012' },
			present,
		]);
	});

	test('shows a closed range of years', () => {
		expect(getProjectDateParts({ dateEnded: 2026, dateStarted: 2024 })).toEqual([
			{ attribute: '2024', display: '2024' },
			{ attribute: '2026', display: '2026' },
		]);
	});

	test('collapses ends that display the same', () => {
		expect(
			getProjectDateParts({
				dateEnded: new Date('2026-07-28T00:00:00Z'),
				dateStarted: new Date('2026-07-03T00:00:00Z'),
			}),
		).toEqual([{ attribute: '2026-07', display: 'July 2026' }]);
	});
});
