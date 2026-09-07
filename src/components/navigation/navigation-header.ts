import type { NavigationItem } from '#components/navigation/navigation-types.ts';

import { t } from '#lib/i18n/i18n-strings.ts';
import { getSitePath } from '#lib/utils/routing.ts';

export const navigationHeaderItems = [
	{
		title: t('collection.posts.plural'),
		url: getSitePath('posts'),
	},
	{
		title: t('collection.notes.plural'),
		url: getSitePath('notes'),
	},
	{
		title: t('collection.projects.plural'),
		url: getSitePath('projects'),
	},
	{
		title: t('collection.tags.plural'),
		url: getSitePath('tags'),
	},
	{
		title: t('navigation.about.label'),
		url: getSitePath('about'),
	},
] satisfies Array<NavigationItem>;
