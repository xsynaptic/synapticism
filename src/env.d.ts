// Not covered by astro:env but sometimes used in the application
// interface ImportMetaEnv {}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// Astro.locals typing; must be namespaced "App" and in this file
declare namespace App {
	interface Locals {
		isRss: boolean;
	}
}
