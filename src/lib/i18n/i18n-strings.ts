// Central dictionary of user-facing UI strings. Reference with `t(key)`; for
// strings containing {tokens}, interpolate with formatStringTemplate from
// #lib/utils/text.ts. Single-language by design (no translation layer).

const strings = {
	// Site
	'site.title': 'Synapticism',
	'site.description': 'A technical blog about web development, design, and creative coding.',
	'site.skipToContent': 'Skip to content',

	// Navigation menus
	'nav.posts': 'Posts',
	'nav.notes': 'Notes',
	'nav.projects': 'Projects',
	'nav.tags': 'Tags',
	'nav.about': 'About',
	'nav.github': 'GitHub',

	// Accessibility (aria-labels, screen-reader text)
	'aria.mainNav': 'Main navigation',
	'aria.footerNav': 'Footer navigation',
	'aria.streamPagination': 'Stream pagination',
	'aria.pagination': 'Pagination',
	'aria.prevPage': 'Previous page',
	'aria.nextPage': 'Next page',
	'aria.goToPage': 'Go to page {page}',

	// Pagination
	'pagination.previous': 'Previous',
	'pagination.next': 'Next',
	'pagination.counter': 'Page {current} of {total}',

	// Section labels
	'section.backlinks': 'Backlinks',
	'section.tags': 'Tags',
	'section.source': 'Source',
	'section.moreNotes': 'More Notes',
	'noteNav.allNotes': 'All Notes',
	'noteNav.newer': 'Newer note: ',
	'noteNav.older': 'Older note: ',

	// Index / homepage
	'index.heroHeading': 'I’m Alexander Synaptic, a web developer and designer.',
	'index.heroSubtitle':
		'Synapticism is my notebook in the open: field notes from real projects, experiments with typography and creative code, and longer pieces when an idea earns the room.',
	'index.tagline': 'web development, design, creative coding',
	'index.recently': 'Recently',
	'index.selectedWork': 'Selected work',
	'index.allProjects': 'All projects',
	'index.newer': 'Newer',
	'index.older': 'Older',
	'index.pageTitle': 'Page {page}',

	// Content
	'content.continueReading': 'Continue reading',
	'content.updated': 'Updated',
	'content.via': ' · via ',

	// Collection labels
	'collection.notes': 'Notes',
	'collection.pages': 'Pages',
	'collection.posts': 'Posts',
	'collection.projects': 'Projects',
	'collection.tags': 'Tags',

	// List pages (heading + SEO title/description)
	'posts.title': 'Posts',
	'posts.description': 'Articles about web development, design, and creative coding.',
	'notes.title': 'Notes',
	'notes.description':
		'Short-form notes: half-formed thoughts, links, and things still taking shape.',
	'projects.title': 'Projects',
	'projects.description': 'Things I have designed, built, and worked on.',
	'tags.title': 'Tags',
	'tags.description': 'Browse all tags on Synapticism.',
	'tags.empty': 'No tags yet.',

	// 404
	'notFound.title': 'Page Not Found',
	'notFound.description': 'The page you were looking for could not be found.',
	'notFound.body':
		'The page you were looking for could not be found. It may have been moved or deleted.',

	// Footer colophon
	'footer.builtWith': 'Built with',
	'footer.rss': 'RSS',
	'footer.copyright': '©{years} A. Synaptic.',

	// CV
	'cv.skills': 'Skills',
	'cv.experience': 'Experience',
	'cv.education': 'Education',
	'cv.projects': 'Projects',
	'cv.present': 'Present',
	'cv.github': 'GitHub',
} as const satisfies Record<string, string>;

export type StringKey = keyof typeof strings;

export function t(key: StringKey): string {
	return strings[key];
}
