export interface OpenGraphContentEntry extends OpenGraphEntryItem {
	// Content hash from the data store; drives output cache freshness
	digest: string;
}

export interface OpenGraphEntryItem extends OpenGraphMetadataItem {
	// Media id relative to the media directory; a stable cache key, unlike an absolute path
	imageId?: string | undefined;
}

export interface OpenGraphMetadataItem {
	collection: string;
	id: string;
	label: string;
	title: string;
}
