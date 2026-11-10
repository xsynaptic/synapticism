import { getDateTimeFormat } from '#lib/i18n/i18n-formatters.ts';
import { t } from '#lib/i18n/i18n-strings.ts';
import { formatStringTemplate } from '#lib/utils/text.ts';

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

function getProjectDate(value: Date | number) {
	if (typeof value === 'number') return { attribute: String(value), display: String(value) };

	return {
		attribute: value.toISOString().slice(0, 7),
		display: getDateTimeFormat('en', monthYearFormat).format(value),
	};
}

function formatRange(start: string, end: string) {
	return formatStringTemplate(t('projects.dateRange'), { end, start });
}

export function getProjectDateDisplay({ dateCreated, dateEnded, dateStarted }: ProjectDateFields): {
	attribute?: string;
	display: string;
} {
	if (dateStarted === undefined) return getProjectDate(dateCreated);

	const start = getProjectDate(dateStarted);

	if (dateEnded === undefined) return { display: formatRange(start.display, t('content.present')) };

	const end = getProjectDate(dateEnded);

	if (end.display === start.display) return start;

	return { display: formatRange(start.display, end.display) };
}
