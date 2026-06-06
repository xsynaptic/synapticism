/** @type {import('stylelint').Config} */
export default {
	extends: ['@xsynaptic/stylelint-config'],
	// Pagefind ships its own BEM-cased classes; overriding them here can't satisfy kebab-case
	ignoreFiles: ['src/styles/pagefind.css'],
	reportDescriptionlessDisables: true,
};
