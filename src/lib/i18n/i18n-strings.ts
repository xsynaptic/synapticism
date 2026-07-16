// Central dictionary of user-facing UI strings
const strings = {
	// Site
	'site.description': 'A technical blog about web development, design, and creative coding.',
	'site.search.placeholder': 'Search...',
	'site.search.toggle.label': 'Open search',
	'site.search.toggle.title': 'Search',
	'site.skipToContent': 'Skip to content',
	'site.title': 'Synapticism',
	'site.topButton': 'Back to top',

	// Navigation menus
	'nav.about': 'About',
	'nav.github': 'GitHub',
	'nav.notes': 'Notes',
	'nav.posts': 'Posts',
	'nav.projects': 'Projects',
	'nav.tags': 'Tags',

	// Accessibility (aria-labels, screen-reader text)
	'aria.footerNav': 'Footer navigation',
	'aria.goToPage': 'Go to page {page}',
	'aria.mainNav': 'Main navigation',
	'aria.nextPage': 'Next page',
	'aria.pagination': 'Pagination',
	'aria.prevPage': 'Previous page',
	'aria.streamPagination': 'Stream pagination',

	// Pagination
	'pagination.counter': 'Page {current} of {total}',
	'pagination.next': 'Next',
	'pagination.previous': 'Previous',

	// Section labels
	'noteNav.allNotes': 'All Notes',
	'noteNav.newer': 'Newer note: ',
	'noteNav.older': 'Older note: ',
	'section.backlinks': 'Backlinks',
	'section.moreNotes': 'More Notes',
	'section.projects': 'Projects',
	'section.relatedWriting': 'Related writing',
	'section.source': 'Source',
	'section.tags': 'Tags',

	// Index / homepage
	'index.allProjects': 'All projects',
	'index.heroHeading': 'I’m Alexander Synaptic, a web developer and designer.',
	'index.heroSubtitle':
		'Synapticism is my notebook in the open: field notes from real projects, experiments with typography and creative code, and longer pieces when an idea earns the room.',
	'index.newer': 'Newer',
	'index.older': 'Older',
	'index.pageTitle': 'Page {page}',
	'index.recently': 'Recently',
	'index.selectedWork': 'Selected work',
	'index.tagline': 'web development, design, creative coding',

	// Content
	'content.continueReading': 'Continue reading',
	'content.minutesRead': '{minutesRead} minute read',
	'content.updated': 'Updated',
	'content.via': ' · via ',

	// Collection labels
	'collection.notes': 'Notes',
	'collection.pages': 'Pages',
	'collection.posts': 'Posts',
	'collection.projects': 'Projects',
	'collection.tags': 'Tags',

	// List pages (heading + SEO title/description)
	'notes.description':
		'Short-form notes: half-formed thoughts, links, and things still taking shape.',
	'notes.title': 'Notes',
	'posts.description': 'Articles about web development, design, and creative coding.',
	'posts.title': 'Posts',
	'projects.description': 'Things I have designed, built, and worked on.',
	'projects.title': 'Projects',
	'tags.description': 'Browse all tags on Synapticism.',
	'tags.empty': 'No tags yet.',
	'tags.title': 'Tags',

	// 404
	'notFound.body':
		'The page you were looking for could not be found. It may have been moved or deleted.',
	'notFound.description': 'The page you were looking for could not be found.',
	'notFound.title': 'Page Not Found',

	// Footer colophon
	'footer.builtWith': 'Built with',
	'footer.copyright': '©{years} A. Synaptic.',
	'footer.rss': 'RSS',

	// CV
	'cv.education': 'Education',
	'cv.experience': 'Experience',
	'cv.github': 'GitHub',
	'cv.present': 'Present',
	'cv.projects': 'Projects',
	'cv.skills': 'Skills',
} as const satisfies Record<string, string>;

export type StringKey = keyof typeof strings;

export function t(key: StringKey): string {
	return strings[key];
}
