export interface OpenGraphContentEntry extends OpenGraphEntryItem {
	digest: string;
}

export interface OpenGraphEntryItem {
	imageId?: string | undefined;
	label?: string | undefined;
	outputId: string;
	title: string;
}
