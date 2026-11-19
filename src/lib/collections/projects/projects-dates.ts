import { getDateTimeFormat } from '#lib/i18n/i18n-formatters.ts';
import { t } from '#lib/i18n/i18n-strings.ts';

interface ProjectDate {
	attribute: string;
	display: string;
}

interface ProjectDateFields {
	dateEnded?: Date | number | undefined;
	dateStarted?: Date | number | undefined;
}

const monthYearFormat = {
	month: 'long',
	timeZone: 'UTC',
	year: 'numeric',
} satisfies Intl.DateTimeFormatOptions;

function getProjectDate(value: Date | number): ProjectDate {
	if (typeof value === 'number') return { attribute: String(value), display: String(value) };

	return {
		attribute: value.toISOString().slice(0, 7),
		display: getDateTimeFormat('en', monthYearFormat).format(value),
	};
}

// A one-off has no range; its published date already dates it
export function getProjectDateRange({ dateEnded, dateStarted }: ProjectDateFields) {
	if (dateStarted === undefined) return;

	const start = getProjectDate(dateStarted);

	if (dateEnded === undefined) return { dates: [start], label: t('projects.dateSince') };

	const end = getProjectDate(dateEnded);

	if (end.display === start.display) return { dates: [start], label: t('projects.dateActive') };

	return { dates: [start, end], label: t('projects.dateActive') };
}
