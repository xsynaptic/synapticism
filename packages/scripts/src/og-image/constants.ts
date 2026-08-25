// Facebook's recommended 1.91:1 card, the de facto standard across platforms
export const ogWidth = 1200;
export const ogHeight = 630;

// Right-hand image panel, separated from the text column by a teal seam
export const ogPanelWidth = 540;
export const ogSeamWidth = 2;

// Tighter padding on the split layout to protect the text measure
export const ogPaddingSplit = 72;
export const ogPaddingFull = 80;

// High-quality output because platforms re-encode OG images anyway
export const ogJpegQuality = 90;

// Bump to invalidate every cached card when element.tsx changes
export const ogTemplateVersion = '2';

// Freshness ledger for the card store; kept outside it so the store copies into dist wholesale
export const ogLedgerPath = '.cache/og-image.json';

// Frontmatter stores media as paths relative to this directory
export const mediaDir = 'packages/content/media';

// Astro's cacheDir, where the build writes the data store (og-image always runs post-build)
export const astroCacheDir = './node_modules/.astro';
