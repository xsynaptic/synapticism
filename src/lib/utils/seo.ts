import * as R from 'remeda';

import { openGraphImageFallbackCount, openGraphImageFallbackPrefix } from '#constants.ts';
import { parseContentDate } from '#lib/utils/date.ts';
import { getBasePath } from '#lib/utils/routing.ts';

// Must mirror the og-image script's output path (packages/scripts/src/og-image)
export function getOgImagePath(collection: string, id: string): string {
	return `/og/${collection}/${id}.jpg`;
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

export function getSeoImageFallback() {
	return getBasePath(
		`${openGraphImageFallbackPrefix}-${String(R.randomInteger(1, openGraphImageFallbackCount))}.jpg`,
	);
}
