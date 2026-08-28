import type { MenuItem } from '#components/menu/menu-types.ts';

import { t } from '#lib/i18n/i18n-strings.ts';
import { getSiteUrl } from '#lib/utils/routing.ts';

export const menuFooterItems = [
	{
		rel: 'me',
		title: t('nav.bluesky'),
		url: 'https://bsky.app/profile/synapticism.com',
	},
	{
		rel: 'me',
		title: t('nav.github'),
		url: 'https://github.com/xsynaptic',
	},
	{
		title: t('nav.about'),
		url: getSiteUrl('about'),
	},
] satisfies Array<MenuItem>;
