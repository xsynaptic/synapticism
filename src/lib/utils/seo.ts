import * as R from 'remeda';
import urlJoin from 'url-join';

import { OPEN_GRAPH_IMAGE_FALLBACK_COUNT, OPEN_GRAPH_IMAGE_FALLBACK_PREFIX } from '#constants.ts';
import { parseContentDate } from '#lib/utils/date.ts';

const { BASE_URL, PROD, SITE } = import.meta.env;

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
	return urlJoin(
		PROD ? SITE : BASE_URL,
		`${OPEN_GRAPH_IMAGE_FALLBACK_PREFIX}-${String(R.randomInteger(1, OPEN_GRAPH_IMAGE_FALLBACK_COUNT))}.jpg`,
	);
}
