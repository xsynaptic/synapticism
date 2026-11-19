export interface Pagination {
	counter?: string;
	label: string;
	next?: PaginationLink;
	options: Array<PaginationOption>;
	placeholder?: string;
	previous?: PaginationLink;
	selectLabel: string;
	selectSuffix?: string;
	submitLabel: string;
}

export interface PaginationEntry {
	title: string;
	url: string;
}

export interface SectionPagination {
	list: PaginationEntry;
	next: SectionPaginationLink | undefined;
	previous: SectionPaginationLink | undefined;
	title: string;
}

interface SectionPaginationLink extends PaginationEntry {
	label: string;
}

interface PaginationLink {
	ariaLabel?: string;
	label: string;
	url: string;
}

interface PaginationOption {
	isCurrent?: boolean;
	label: string;
	url: string;
}
