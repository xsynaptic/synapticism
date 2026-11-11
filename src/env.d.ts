interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// Stamped by vite.define in the Astro config, not an astro:env field
interface ImportMetaEnv {
	readonly BUILD_VERSION: string | undefined;
}

declare namespace App {
	interface Locals {
		isExcerpt?: boolean;
	}
}
