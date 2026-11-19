import { getDateTimeFormat } from '#lib/i18n/i18n-formatters.ts';

interface DatedEntry {
	data: { dateCreated: Date };
}

export interface ArchiveMonth<T extends DatedEntry = DatedEntry> {
	entries: Array<T>;
	month: number;
	year: number;
}

export interface ArchiveYear<T extends DatedEntry = DatedEntry> {
	months: Array<ArchiveMonth<T>>;
	year: number;
}

// Read in UTC because every date on the site displays in UTC
export function getArchiveDateParts(date: Date) {
	return { month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
}

export function getArchiveMonthParam(month: number): string {
	return String(month).padStart(2, '0');
}

export function getArchiveMonthName(month: number): string {
	return getDateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(
		Date.UTC(2000, month - 1),
	);
}

export function getArchiveMonthTitle({ month, year }: Pick<ArchiveMonth, 'month' | 'year'>) {
	return getDateTimeFormat('en', { month: 'long', timeZone: 'UTC', year: 'numeric' }).format(
		Date.UTC(year, month - 1),
	);
}

// Posting date rather than dateUpdated, so an edit never moves an Entry
export function groupEntriesByArchive<T extends DatedEntry>(
	entries: ReadonlyArray<T>,
): Array<ArchiveYear<T>> {
	const sortedEntries = entries.toSorted(
		(entryA, entryB) => entryB.data.dateCreated.valueOf() - entryA.data.dateCreated.valueOf(),
	);

	const years: Array<ArchiveYear<T>> = [];

	for (const entry of sortedEntries) {
		const { month, year } = getArchiveDateParts(entry.data.dateCreated);

		let archiveYear = years.at(-1);

		if (archiveYear?.year !== year) {
			archiveYear = { months: [], year };
			years.push(archiveYear);
		}

		let archiveMonth = archiveYear.months.at(-1);

		if (archiveMonth?.month !== month) {
			archiveMonth = { entries: [], month, year };
			archiveYear.months.push(archiveMonth);
		}

		archiveMonth.entries.push(entry);
	}

	return years;
}

export function getAdjacentArchiveMonths<T extends DatedEntry>(
	years: ReadonlyArray<ArchiveYear<T>>,
) {
	const months = years.flatMap((archiveYear) => archiveYear.months);

	return months.map((archiveMonth, index) => ({
		archiveMonth,
		nextMonth: months[index - 1],
		previousMonth: months[index + 1],
	}));
}
