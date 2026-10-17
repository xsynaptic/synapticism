import { siteTagline, siteTitle } from '@synapticism/shared/constants';

// Central dictionary of user-facing UI strings
const strings = {
	// Site
	'site.description': siteTagline,
	'site.pageTitle': '{title} - {siteTitle}',
	'site.search.placeholder': 'Search...',
	'site.search.toggle.label': 'Open search',
	'site.search.toggle.shortcut': 'open search',
	'site.search.toggle.title': 'Search',
	'site.skipToContent': 'Skip to content',
	'site.title': siteTitle,
	'site.topButton': 'Back to top',

	// Author
	'author.role': 'Senior Front-end Engineer',

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

	// Navigation
	'navigation.about.label': 'About',
	'navigation.bluesky.label': 'Bluesky',
	'navigation.github.label': 'GitHub',
	'navigation.linkedin.label': 'LinkedIn',
	'navigation.mastodon.label': 'Mastodon',
	'navigation.x.label': 'X',

	// Accessibility (aria-labels, screen-reader text)
	'aria.footerNavigation': 'Footer navigation',
	'aria.headerNavigation': 'Main navigation',
	'aria.nextPage': 'Next page',
	'aria.pageSelect': 'Select a page',
	'aria.pagination': 'Pagination',
	'aria.prevPage': 'Previous page',

	// Pagination
	'pagination.counter': 'Page {current} of {total}',
	'pagination.next': 'Next',
	'pagination.pageNumber': 'Page {page}',
	'pagination.previous': 'Previous',
	'pagination.select.submit': 'Go',
	'pagination.select.total': 'of {total}',

	// Section labels
	'section.backlinks': 'Backlinks',
	'section.pagination.label.list': 'All {label}',
	'section.pagination.label.newer': 'Newer {label}: ',
	'section.pagination.label.older': 'Older {label}: ',
	'section.pagination.title': 'More {label}',
	'section.projects': 'Projects',
	'section.relatedWriting': 'Related writing',
	'section.tags': 'Tags',

	// Home
	'home.pageTitle': 'Page {page}',

	// Content
	'content.continueReading': 'Continue reading',
	'content.dateTime': '{date} at {time}',
	'content.dateTimeShort': '{date} {time}',
	'content.minutesRead': '{minutesRead} minute read',
	'content.quotationAuthor': '― {author}',
	'content.timeUtc': '{time} UTC',
	'content.updated': 'Updated',

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
	'notFound.suggestions': 'Did you mean one of these?',
	'notFound.suggestionsLoading': 'Looking for close matches...',
	'notFound.title': 'Page Not Found',

	// Footer colophon
	'footer.about': 'More about me',
	'footer.astro': 'Astro',
	'footer.bio': `I'm Alexander Synaptic, a web developer from Canada currently based in Taiwan. Front-end has been my home base for years but I'm leaning into the full stack at the dawn of the agentic era. This site is my technical notebook and portfolio.`,
	'footer.builtWith': 'Built with',
	'footer.copyright': '©{years} A. Synaptic',
	'footer.rss': 'RSS Feed',
	'footer.sourceCode': 'Source Code',

	// CV
	'cv.description': 'The professional background of Alexander Synaptic, senior front-end engineer.',
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
