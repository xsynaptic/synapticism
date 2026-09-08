import { getOpenGraphPath, openGraphIndexIds } from '@synapticism/shared/open-graph';

import { parseContentDate } from '#lib/utils/date.ts';
import { getAbsoluteUrl } from '#lib/utils/routing.ts';

// Re-exported so layouts reach the generator's own definitions rather than a second set
export { getOpenGraphId, openGraphIndexIds } from '@synapticism/shared/open-graph';

export function getOpenGraphImageUrl(openGraphId: string | undefined): string {
	return getAbsoluteUrl(getOpenGraphPath(openGraphId ?? openGraphIndexIds.default));
}

export function getSeoArticleProps({
	dateCreated,
	dateUpdated,
}: {
	dateCreated: Date;
	dateUpdated: Date | undefined;
}) {
	const publishedTime = parseContentDate(dateCreated)?.toISOString() ?? '';
	const modifiedTime = parseContentDate(dateUpdated)?.toISOString();

	return {
		article: {
			publishedTime,
			...(modifiedTime ? { modifiedTime } : {}),
		},
		ogType: 'article' as const,
	};
}

export function getSeoHideSearch(shouldHide: boolean | undefined) {
	return shouldHide
		? {
				noFollow: true,
				noIndex: true,
			}
		: undefined;
}
