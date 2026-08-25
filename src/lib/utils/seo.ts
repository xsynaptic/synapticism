import * as R from 'remeda';

import { openGraphImageFallbackCount, openGraphImageFallbackPrefix } from '#constants.ts';
import { parseContentDate } from '#lib/utils/date.ts';
import { joinUrl } from '#lib/utils/routing.ts';

const { BASE_URL, PROD, SITE } = import.meta.env;

// Must mirror the og-image script's output path (packages/scripts/src/og-image)
export function getOgImageUrl(collection: string, id: string): string {
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
	return joinUrl(
		PROD ? SITE : BASE_URL,
		`${openGraphImageFallbackPrefix}-${String(R.randomInteger(1, openGraphImageFallbackCount))}.jpg`,
	);
}
