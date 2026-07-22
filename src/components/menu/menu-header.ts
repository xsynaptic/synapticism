import type { MenuItem } from '#components/menu/menu-types.ts';

import { t } from '#lib/i18n/i18n-strings.ts';
import { getSiteUrl } from '#lib/utils/routing.ts';

export const menuHeaderItems = [
	{
		title: t('collection.posts.plural'),
		url: getSiteUrl('posts'),
	},
	{
		title: t('collection.notes.plural'),
		url: getSiteUrl('notes'),
	},
	{
		title: t('collection.projects.plural'),
		url: getSiteUrl('projects'),
	},
	{
		title: t('collection.tags.plural'),
		url: getSiteUrl('tags'),
	},
	{
		title: t('nav.about'),
		url: getSiteUrl('about'),
	},
] satisfies Array<MenuItem>;
