import { SITE_YEAR_FOUNDED } from '#constants.ts';

export const DatePresetEnum = {
	Long: 'long',
	Medium: 'medium',
	Short: 'short',
} as const;

export type DatePreset = (typeof DatePresetEnum)[keyof typeof DatePresetEnum];

interface CollectionEntryWithStandardDates {
	data: {
		dateCreated: Date | string;
		dateUpdated?: Date | string | undefined;
	};
}

// Collapses to a single year until the site outlives its founding year
export function getCopyrightYears(): string {
	const currentYear = new Date().getFullYear();

	if (currentYear <= SITE_YEAR_FOUNDED) return String(SITE_YEAR_FOUNDED);

	return `${String(SITE_YEAR_FOUNDED)}\u{2013}${String(currentYear)}`;
}

// A note authored date-only lands on UTC midnight
// Treat that as "no time" so the display falls back to a bare calendar date
export function hasUtcTime(date: Date): boolean {
	return date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0 || date.getUTCSeconds() !== 0;
}

export function parseContentDate(date: Date | string | undefined) {
	if (!date) return;
	if (date instanceof Date) return date;
	return new Date(date);
}

// Interpret a frontmatter date string as UTC:
// - bare dates and zoneless datetimes are read as UTC wall-clock
// - values carrying an explicit zone are honored
// Keeps display and sorting consistent regardless of the build machine's timezone
export function parseFrontmatterDate(value: string): Date {
	const trimmed = value.trim();

	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return new Date(`${trimmed}T00:00:00Z`);

	if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
		return new Date(`${trimmed.replace(' ', 'T')}Z`);
	}

	return new Date(trimmed);
}

export function sortByDateReverseChronological(
	a: CollectionEntryWithStandardDates,
	b: CollectionEntryWithStandardDates,
) {
	const aDate = parseContentDate(a.data.dateUpdated) ?? parseContentDate(a.data.dateCreated);
	const bDate = parseContentDate(b.data.dateUpdated) ?? parseContentDate(b.data.dateCreated);

	if (aDate && bDate) {
		return bDate.getTime() - aDate.getTime();
	}
	return 0;
}
