import { describe, expect, test } from 'vitest';

import { getProjectDateRange } from '#lib/collections/projects/projects-dates.ts';

describe('getProjectDateRange', () => {
	test('leaves a one-off without a range', () => {
		expect(getProjectDateRange({})).toBeUndefined();
		expect(getProjectDateRange({ dateEnded: 2026 })).toBeUndefined();
	});

	test('dates by the UTC month whatever the machine zone', () => {
		expect(getProjectDateRange({ dateStarted: new Date('2026-06-30T23:59:59Z') })).toEqual({
			dates: [{ attribute: '2026-06', display: 'June 2026' }],
			label: 'Since',
		});
	});

	test('labels an open range by its start', () => {
		expect(getProjectDateRange({ dateStarted: 2012 })).toEqual({
			dates: [{ attribute: '2012', display: '2012' }],
			label: 'Since',
		});
	});

	test('labels a closed range as active', () => {
		expect(getProjectDateRange({ dateEnded: 2026, dateStarted: 2024 })).toEqual({
			dates: [
				{ attribute: '2024', display: '2024' },
				{ attribute: '2026', display: '2026' },
			],
			label: 'Active',
		});
	});

	test('collapses ends that display the same', () => {
		expect(
			getProjectDateRange({
				dateEnded: new Date('2026-07-28T00:00:00Z'),
				dateStarted: new Date('2026-07-03T00:00:00Z'),
			}),
		).toEqual({ dates: [{ attribute: '2026-07', display: 'July 2026' }], label: 'Active' });
	});
});
