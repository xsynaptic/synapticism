import type { MenuItem } from '#components/menu/menu-types.ts';

import { getSiteUrl } from '#lib/utils/routing.ts';

export const menuHeaderItems = [
	{
		title: 'Posts',
		url: getSiteUrl('posts'),
	},
	{
		title: 'Projects',
		url: getSiteUrl('projects'),
	},
	{
		title: 'Tags',
		url: getSiteUrl('tags'),
	},
	{
		title: 'About',
		url: getSiteUrl('about'),
	},
] satisfies Array<MenuItem>;
