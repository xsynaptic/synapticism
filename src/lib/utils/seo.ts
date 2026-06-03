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
		ogType: 'article' as const,
		article: {
			publishedTime,
			...(modifiedTime ? { modifiedTime } : {}),
		},
	};
}

export function getSeoImageFallback() {
	return urlJoin(
		PROD ? SITE : BASE_URL,
		`${OPEN_GRAPH_IMAGE_FALLBACK_PREFIX}-${String(R.randomInteger(1, OPEN_GRAPH_IMAGE_FALLBACK_COUNT))}.jpg`,
	);
}

export function getSeoHideSearch(shouldHide: boolean | undefined) {
	return shouldHide
		? {
				noIndex: true,
				noFollow: true,
			}
		: undefined;
}
