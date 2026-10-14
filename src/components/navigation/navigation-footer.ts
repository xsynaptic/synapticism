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
		rel: 'me',
		title: t('navigation.linkedin.label'),
		url: 'https://www.linkedin.com/in/alexandersynaptic',
	},
	{
		rel: 'me',
		title: t('navigation.mastodon.label'),
		url: 'https://indieweb.social/@SpectralCodex',
	},
	{
		rel: 'me',
		title: t('navigation.x.label'),
		url: 'https://x.com/spectralcodex',
	},
	{
		title: t('navigation.about.label'),
		url: getSitePath('about'),
	},
] satisfies Array<NavigationItem>;
