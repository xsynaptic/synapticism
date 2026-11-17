import { recordTraversalPageviews } from '@xsynaptic/analytics/umami';
import {
	normalizeSearchQuery,
	searchToggleSearchEndEventName,
} from '@xsynaptic/astro-pagefind/search-toggle';

import { sendEvent } from '#lib/analytics/analytics-events.ts';

document.addEventListener(
	searchToggleSearchEndEventName,
	({ detail: { clicked, query, results } }) => {
		const reportedQuery = normalizeSearchQuery(query);

		if (reportedQuery === undefined) return;

		sendEvent('search-query', { clicked, query: reportedQuery, results });

		if (results > 0) return;

		sendEvent('search-empty', { query: reportedQuery });
	},
);

recordTraversalPageviews();
