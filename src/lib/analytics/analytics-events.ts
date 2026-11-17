import { createEventSender } from '@xsynaptic/analytics';
import { createUmamiAttributes, umamiTransport } from '@xsynaptic/analytics/umami';

export interface AnalyticsEvents {
	'build-version-reload': { staleHours: number };
	'search-empty': { query: string };
	'search-open': undefined;
	'search-query': { clicked: boolean; query: string; results: number };
}

export const { sendEvent } = createEventSender<AnalyticsEvents>(umamiTransport);

export const { sendEventAttributes } = createUmamiAttributes<AnalyticsEvents>();
