// Facebook's recommended 1.91:1 card, the de facto standard across platforms
export const openGraphImageWidth = 1200;
export const openGraphImageHeight = 630;

export const openGraphImageFormat = 'jpg';

export const openGraphBasePath = 'og';

// Frontmatter stores media as paths relative to this directory
export const mediaDir = 'packages/content/media';

// Build caches, relative to the workspace root; kept across builds, never deployed
export const cachePath = './.cache';

// Owned whole by the image pipeline, so nothing else writes here
export const imageCachePath = `${cachePath}/images`;

export const sitemapLastmodPath = `${cachePath}/sitemap-lastmod.json`;

// The brand line on every card, and the site title the app reads as `site.title`
export const siteTitle = 'Synapticism';

// The home card's line, and the app's `site.description`
export const siteTagline =
	'Technical notes on web development in the agentic era: frontend application design, Astro, creative coding, LLMs, and more.';
