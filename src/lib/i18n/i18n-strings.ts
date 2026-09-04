// Central dictionary of user-facing UI strings
const strings = {
	// Site
	'site.description': 'A technical blog about web development, design, and creative coding.',
	'site.pageTitle': '{title} - {siteTitle}',
	'site.search.placeholder': 'Search...',
	'site.search.toggle.label': 'Open search',
	'site.search.toggle.title': 'Search',
	'site.skipToContent': 'Skip to content',
	'site.title': 'Synapticism',
	'site.topButton': 'Back to top',

	// Author
	'author.role': 'Web Developer',

	// Collection labels
	'collection.notes.plural': 'Notes',
	'collection.notes.singular': 'Note',
	'collection.pages': 'Pages',
	'collection.posts.plural': 'Posts',
	'collection.posts.singular': 'Post',
	'collection.projects.plural': 'Projects',
	'collection.projects.singular': 'Project',
	'collection.tags.plural': 'Tags',
	'collection.tags.singular': 'Tag',

	// Navigation menus
	'nav.about': 'About',
	'nav.bluesky': 'Bluesky',
	'nav.github': 'GitHub',

	// Accessibility (aria-labels, screen-reader text)
	'aria.footerNav': 'Footer navigation',
	'aria.mainNav': 'Main navigation',
	'aria.nextPage': 'Next page',
	'aria.pageSelect': 'Select a page',
	'aria.pagination': 'Pagination',
	'aria.prevPage': 'Previous page',
	'aria.streamPagination': 'Stream pagination',

	// Pagination
	'pagination.counter': 'Page {current} of {total}',
	'pagination.next': 'Next',
	'pagination.pageNumber': 'Page {page}',
	'pagination.previous': 'Previous',
	'pagination.select.submit': 'Go',
	'pagination.select.total': 'of {total}',

	// Section labels
	'section.backlinks': 'Backlinks',
	'section.navigation.label.list': 'All {label}',
	'section.navigation.label.newer': 'Newer {label}: ',
	'section.navigation.label.older': 'Older {label}: ',
	'section.navigation.title': 'More {label}',
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
	'content.dateTime': '{date} at {time}',
	'content.dateTimeShort': '{date} {time}',
	'content.minutesRead': '{minutesRead} minute read',
	'content.quotationAuthor': '― {author}',
	'content.timeUtc': '{time} UTC',
	'content.updated': 'Updated',
	'content.via': ' · via ',

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
	'footer.astro': 'Astro',
	'footer.builtWith': 'Built with',
	'footer.copyright': '©{years} A. Synaptic',
	'footer.rss': 'RSS',

	// CV
	'cv.description': 'The professional background of Alexander Synaptic, senior software engineer.',
	'cv.education': 'Education',
	'cv.experience': 'Experience',
	'cv.github': 'GitHub',
	'cv.present': 'Present',
	'cv.projects': 'Projects',
	'cv.skills': 'Skills',
	'cv.title': 'Curriculum Vitae',
} as const satisfies Record<string, string>;

export type StringKey = keyof typeof strings;

export function t(key: StringKey): string {
	return strings[key];
}
