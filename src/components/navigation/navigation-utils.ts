import type { NavigationItem } from '#components/navigation/navigation-types.ts';

export function isActiveNavigationItem(item: NavigationItem, pathname: string): boolean {
	if (item.url === pathname) return true;

	return item.children?.some((child) => isActiveNavigationItem(child, pathname)) ?? false;
}
