export interface MenuItem {
	children?: Array<MenuItem>;
	rel?: string | undefined;
	title: string;
	url: string;
}
