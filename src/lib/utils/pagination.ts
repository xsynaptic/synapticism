import type { Page } from 'astro';

import type { Pagination } from '#lib/utils/pagination-types.ts';

import { t } from '#lib/i18n/i18n-strings.ts';
import { joinUrl } from '#lib/utils/routing.ts';
import { formatStringTemplate } from '#lib/utils/text.ts';

interface PaginationOptions {
	currentPage: number;
	getPageUrl: (pageNumber: number) => string;
	lastPage: number;
}

export function getPagination({ currentPage, getPageUrl, lastPage }: PaginationOptions) {
	const options = Array.from({ length: lastPage }, (_, index) => {
		const pageNumber = index + 1;

		return {
			isCurrent: pageNumber === currentPage,
			label: formatStringTemplate(t('pagination.pageNumber'), { page: pageNumber }),
			url: getPageUrl(pageNumber),
		};
	});

	const pagination: Pagination = {
		counter: formatStringTemplate(t('pagination.counter'), {
			current: currentPage,
			total: lastPage,
		}),
		label: t('aria.pagination'),
		options,
		selectLabel: t('aria.pageSelect'),
		selectSuffix: formatStringTemplate(t('pagination.select.total'), { total: lastPage }),
		submitLabel: t('pagination.select.submit'),
	};

	if (currentPage > 1) {
		pagination.previous = {
			ariaLabel: t('aria.prevPage'),
			label: t('pagination.previous'),
			url: getPageUrl(currentPage - 1),
		};
	}

	if (currentPage < lastPage) {
		pagination.next = {
			ariaLabel: t('aria.nextPage'),
			label: t('pagination.next'),
			url: getPageUrl(currentPage + 1),
		};
	}

	return pagination;
}

// The site leaves `trailingSlash` at Astro's default, so paginate URLs arrive bare
export function getPagePagination(page: Page) {
	const { currentPage, lastPage, url } = page;

	const basePath = url.first ?? url.current;

	return getPagination({
		currentPage,
		getPageUrl: (pageNumber) =>
			pageNumber === 1 ? joinUrl(basePath, '/') : joinUrl(basePath, String(pageNumber), '/'),
		lastPage,
	});
}
