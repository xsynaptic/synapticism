import { sortByDateReverseChronological } from '#lib/utils/date.ts';

interface ProjectOrderEntry {
	data: {
		dateCreated: Date | string;
		dateUpdated?: Date | string | undefined;
		featuredOrder?: number | undefined;
	};
}

export function compareProjectsForIndex(entryA: ProjectOrderEntry, entryB: ProjectOrderEntry) {
	const orderA = entryA.data.featuredOrder ?? Infinity;
	const orderB = entryB.data.featuredOrder ?? Infinity;

	if (orderA !== orderB) return orderA - orderB;

	return sortByDateReverseChronological(entryA, entryB);
}
