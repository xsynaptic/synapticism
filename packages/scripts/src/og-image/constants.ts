// Facebook's recommended 1.91:1 card, the de facto standard across platforms
export const openGraphImageWidth = 1200;
export const openGraphImageHeight = 630;

// Right-hand image panel, separated from the text column by a teal seam
export const openGraphPanelWidth = 540;
export const openGraphSeamWidth = 2;

// Tighter padding on the split layout to protect the text measure
export const openGraphPaddingSplit = 72;
export const openGraphPaddingFull = 80;

// High-quality output because platforms re-encode OG images anyway
export const openGraphJpegQuality = 90;

// Bump to invalidate every cached card when element.tsx changes
export const openGraphTemplateVersion = '3';

// Freshness ledger for the card store; kept outside it so the store copies into dist wholesale
export const openGraphLedgerPath = '.cache/og-image.json';

// Frontmatter stores media as paths relative to this directory
export const mediaDir = 'packages/content/media';
