export interface GridEmoji {
	emoji: string;
	hexcode: string;
	label: string;
	skins?: Array<string>;
	skinVersion?: number;
	version: number;
}

interface GridGroup {
	emoji: Array<GridEmoji>;
	key: string;
	label: string;
}

export interface GridCatalog {
	groups: Array<GridGroup>;
}

export interface SearchEmoji {
	community: Array<string>;
	hexcode: string;
	keywords: Array<string>;
	label: string;
	shortcodes: Array<string>;
}

// `emoji` runs in emojibase order, so an index doubles as the display order
export interface SearchCatalog {
	emoji: Array<SearchEmoji>;
	emoticons: Record<string, string>;
}
