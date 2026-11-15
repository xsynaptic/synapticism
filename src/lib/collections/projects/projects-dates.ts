import { getDateTimeFormat } from '#lib/i18n/i18n-formatters.ts';
import { t } from '#lib/i18n/i18n-strings.ts';

interface ProjectDate {
	attribute?: string;
	display: string;
}

interface ProjectDateFields {
	dateCreated: Date;
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

// One `<time>` cannot hold a range, so each end is its own part
export function getProjectDateParts({
	dateCreated,
	dateEnded,
	dateStarted,
}: ProjectDateFields): Array<ProjectDate> {
	if (dateStarted === undefined) return [getProjectDate(dateCreated)];

	const start = getProjectDate(dateStarted);

	if (dateEnded === undefined) return [start, { display: t('content.present') }];

	const end = getProjectDate(dateEnded);

	if (end.display === start.display) return [start];

	return [start, end];
}
