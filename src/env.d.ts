interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// Stamped by vite.define in the Astro config, not an astro:env field
interface ImportMetaEnv {
	readonly BUILD_VERSION: string | undefined;
}

interface Window {
	umami?: { track: (eventName: string, eventData?: Record<string, unknown>) => void };
}

declare namespace App {
	interface Locals {
		isExcerpt?: boolean;
	}
}
