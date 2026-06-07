import type { MenuItem } from '#components/menu/menu-types.ts';

import { getSiteUrl } from '#lib/utils/routing.ts';

export const menuFooterItems = [
	{
		rel: 'me',
		title: 'GitHub',
		url: 'https://github.com/xsynaptic',
	},
	{
		title: 'About',
		url: getSiteUrl('about'),
	},
] satisfies Array<MenuItem>;
