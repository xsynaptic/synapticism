interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// Stamped by vite.define in the Astro config, not an astro:env field
interface ImportMetaEnv {
	readonly BUILD_VERSION: string | undefined;
}

// Astro.locals typing; must be namespaced "App" and in this file
declare namespace App {
	interface Locals {
		isRss: boolean;
	}
}
