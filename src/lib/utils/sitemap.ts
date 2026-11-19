const excludedPrefixes = ['/about/cv'];

// Pagination repeats page one; a Month Archive repeats its Year Archive
const unindexedPatterns = [
	/^\/page\/\d+$/,
	/^\/(?:posts|projects)\/\d+$/,
	/^\/tags\/[^/]+\/\d+$/,
	/^\/\d{4}\/\d{2}(?:\/\d+)?$/,
];

export function getUrlPathIndexing(pathname: string) {
	const normalized = pathname.replace(/\/$/, '');

	if (
		excludedPrefixes.some((prefix) => normalized === prefix || normalized.startsWith(prefix + '/'))
	) {
		return { follow: false, index: false };
	}

	if (unindexedPatterns.some((pattern) => pattern.test(normalized))) {
		return { follow: true, index: false };
	}

	return { follow: true, index: true };
}
