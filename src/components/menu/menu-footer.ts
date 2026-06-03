import type { MenuItem } from '#components/menu/menu-types.ts';

import { getSiteUrl } from '#lib/utils/routing.ts';

export const menuFooterItems = [
	{
		title: 'GitHub',
		url: 'https://github.com/xsynaptic',
		rel: 'me',
	},
	{
		title: 'About',
		url: getSiteUrl('about'),
	},
] satisfies Array<MenuItem>;
