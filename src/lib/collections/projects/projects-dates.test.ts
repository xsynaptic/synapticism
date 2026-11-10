import { describe, expect, test } from 'vitest';

import { getProjectDateDisplay } from '#lib/collections/projects/projects-dates.ts';

const dateCreated = new Date('2026-07-01T00:00:00Z');

describe('getProjectDateDisplay', () => {
	test('dates a one-off by its creation month', () => {
		expect(getProjectDateDisplay({ dateCreated })).toEqual({
			attribute: '2026-07',
			display: 'July 2026',
		});
	});

	test('runs an open start to the present', () => {
		expect(getProjectDateDisplay({ dateCreated, dateStarted: 2012 }).display).toBe('2012–present');
		expect(getProjectDateDisplay({ dateCreated, dateStarted: dateCreated }).display).toBe(
			'July 2026–present',
		);
	});

	test('shows a closed range of years', () => {
		expect(getProjectDateDisplay({ dateCreated, dateEnded: 2026, dateStarted: 2024 })).toEqual({
			display: '2024–2026',
		});
	});

	test('collapses ends that display the same', () => {
		expect(
			getProjectDateDisplay({
				dateCreated,
				dateEnded: new Date('2026-07-28T00:00:00Z'),
				dateStarted: new Date('2026-07-03T00:00:00Z'),
			}),
		).toEqual({ attribute: '2026-07', display: 'July 2026' });
	});
});
