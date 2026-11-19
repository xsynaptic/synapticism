import { sortByDateReverseChronological } from '#lib/utils/date.ts';

interface ProjectOrderEntry {
	data: {
		dateCreated: Date | string;
		dateUpdated?: Date | string | undefined;
		pinnedOrder?: number | undefined;
	};
}

export function compareProjectsForIndex(entryA: ProjectOrderEntry, entryB: ProjectOrderEntry) {
	const orderA = entryA.data.pinnedOrder ?? Infinity;
	const orderB = entryB.data.pinnedOrder ?? Infinity;

	if (orderA !== orderB) return orderA - orderB;

	return sortByDateReverseChronological(entryA, entryB);
}
