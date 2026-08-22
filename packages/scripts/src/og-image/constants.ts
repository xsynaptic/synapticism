// Facebook's recommended 1.91:1 card, the de facto standard across platforms
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Right-hand image panel, separated from the text column by a teal seam
export const OG_PANEL_WIDTH = 540;
export const OG_SEAM_WIDTH = 2;

// Tighter padding on the split layout to protect the text measure
export const OG_PADDING_SPLIT = 72;
export const OG_PADDING_FULL = 80;

// High-quality output because platforms re-encode OG images anyway
export const OG_JPEG_QUALITY = 90;

// Bump to invalidate every cached card when element.tsx changes
export const OG_TEMPLATE_VERSION = '2';

// Freshness ledger for the card store; kept outside it so the store copies into dist wholesale
export const OG_LEDGER_PATH = '.cache/og-image.json';

// Frontmatter stores media as paths relative to this directory
export const MEDIA_DIR = 'packages/content/media';

// Astro's cacheDir, where the build writes the data store (og-image always runs post-build)
export const ASTRO_CACHE_DIR = './node_modules/.astro';
