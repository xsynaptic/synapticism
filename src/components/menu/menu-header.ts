import type { MenuItem } from '#components/menu/menu-types.ts';

import { t } from '#lib/i18n/i18n-strings.ts';
import { getSiteUrl } from '#lib/utils/routing.ts';

export const menuHeaderItems = [
	{
		title: t('nav.posts'),
		url: getSiteUrl('posts'),
	},
	{
		title: t('nav.notes'),
		url: getSiteUrl('notes'),
	},
	{
		title: t('nav.projects'),
		url: getSiteUrl('projects'),
	},
	{
		title: t('nav.tags'),
		url: getSiteUrl('tags'),
	},
	{
		title: t('nav.about'),
		url: getSiteUrl('about'),
	},
] satisfies Array<MenuItem>;
