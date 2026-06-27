// Facebook's recommended 1.91:1 card, the de facto standard across platforms
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// High-quality output because platforms re-encode OG images anyway
export const OG_JPEG_QUALITY = 90;

// Astro's cacheDir, where the build writes the data store (og-image always runs post-build)
export const ASTRO_CACHE_DIR = './node_modules/.astro';
