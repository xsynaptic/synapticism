declare global {
	// Components the remark auto-import transformer injects, hand-typed for the MDX language server
	// https://github.com/mdx-js/mdx-analyzer
	interface MDXProvidedComponents {
		Img: (props: {
			alt?: string;
			children?: React.JSX.Element | string;
			src: string;
		}) => React.JSX.Element;
		Link: (props: { children: React.JSX.Element | string; id: string }) => React.JSX.Element;
		More: (props: { children?: never }) => React.JSX.Element;
		Quotation: (props: {
			author: string;
			children: React.JSX.Element | string;
			title?: string;
			url?: string;
			year?: string;
		}) => React.JSX.Element;
	}
}

// Note: this must be here for the previous declarations to be picked up
export {};
