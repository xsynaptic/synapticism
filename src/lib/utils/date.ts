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

export function parseContentDate(date: Date | string | undefined) {
	if (!date) return;
	if (date instanceof Date) return date;
	return new Date(date);
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
