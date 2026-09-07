export interface NavigationItem {
	children?: Array<NavigationItem>;
	rel?: string | undefined;
	title: string;
	url: string;
}
