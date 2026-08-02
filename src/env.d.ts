interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// Astro.locals typing; must be namespaced "App" and in this file
declare namespace App {
	interface Locals {
		isRss: boolean;
	}
}
