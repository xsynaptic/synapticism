export interface MenuItem {
	title: string;
	url: string;
	rel?: string | undefined;
	children?: Array<MenuItem>;
}
