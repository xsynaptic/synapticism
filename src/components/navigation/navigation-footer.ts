import type { NavigationItem } from '#components/navigation/navigation-types.ts';

import { t } from '#lib/i18n/i18n-strings.ts';
import { getSitePath } from '#lib/utils/routing.ts';

export const navigationFooterItems = [
	{
		rel: 'me',
		title: t('navigation.bluesky.label'),
		url: 'https://bsky.app/profile/synapticism.com',
	},
	{
		rel: 'me',
		title: t('navigation.github.label'),
		url: 'https://github.com/xsynaptic',
	},
	{
		title: t('navigation.about.label'),
		url: getSitePath('about'),
	},
] satisfies Array<NavigationItem>;
