import { navigate } from 'astro:transitions/client';

/**
 * Progressive-enhancement dropdown pagination; DOM contract:
 *
 * <pagination-select
 *   data-current-page="3"
 *   data-last-page="100"
 *   data-base-path="/notes/"        <-- normalized, trailing slash
 *   data-page-label="Page {page}">  <-- option text template
 *   <nav aria-label="Pagination">
 *     <div>
 *       <span data-pagination-counter>Page 3 of 100</span>
 *       <form data-pagination-form hidden>              <-- revealed + populated here
 *         <select data-pagination-control></select>
 *         <span>of 100</span>
 *         <button type="submit">Go</button>
 *       </form>
 *     </div>
 *     <a>Previous</a> <a>Next</a>                       <-- optional
 *   </nav>
 * </pagination-select>
 *
 * No JS: prev/next links and the counter work, the empty form stays hidden
 * With JS: the <select> is filled from the data attributes (no per-page markup shipped), the form
 * revealed, the counter hidden. Navigation commits on `change` only for a pointer-driven pick on a
 * fine pointer, otherwise via Go or Enter
 */
class PaginationSelect extends HTMLElement {
	#abortController: AbortController | undefined;
	#form: HTMLFormElement | undefined;
	#initialized = false;
	#isPointerDriven = false;
	#select: HTMLSelectElement | undefined;
	#submit: HTMLButtonElement | undefined;

	connectedCallback() {
		if (!this.#initialized) {
			this.#enhance();
			this.#initialized = true;
		}

		if (!this.#form || !this.#select) return;

		this.#abortController = new AbortController();

		const { signal } = this.#abortController;

		this.#form.addEventListener('submit', this.#handleSubmit, { signal });
		this.#select.addEventListener('change', this.#handleChange, { signal });
		this.#select.addEventListener('pointerdown', this.#handlePointerDown, { signal });
		this.#select.addEventListener('keydown', this.#handleKeyDown, { signal });
	}

	disconnectedCallback() {
		this.#abortController?.abort();
		this.#abortController = undefined;
	}

	#buildOptions(lastPage: number) {
		const currentPage = Number(this.dataset.currentPage);
		const pageLabel = this.dataset.pageLabel ?? 'Page {page}';
		const fragment = document.createDocumentFragment();

		for (let pageNumber = 1; pageNumber <= lastPage; pageNumber += 1) {
			const option = document.createElement('option');

			option.value = String(pageNumber);
			option.textContent = pageLabel.replace('{page}', () => String(pageNumber));
			option.selected = pageNumber === currentPage;
			if (pageNumber === currentPage) option.dataset.currentPage = '';
			fragment.append(option);
		}

		return fragment;
	}

	#enhance() {
		const lastPage = Number(this.dataset.lastPage);

		if (!Number.isSafeInteger(lastPage) || lastPage <= 1) return;

		const form = this.querySelector<HTMLFormElement>('[data-pagination-form]');
		const select = this.querySelector<HTMLSelectElement>('[data-pagination-control]');

		if (!form || !select) return;

		select.append(this.#buildOptions(lastPage));
		this.querySelector<HTMLElement>('[data-pagination-counter]')?.toggleAttribute('hidden', true);
		form.hidden = false;

		this.#lockSelectWidth(select, lastPage);

		this.#form = form;
		this.#select = select;
		this.#submit = form.querySelector<HTMLButtonElement>('[data-pagination-submit]') ?? undefined;
		this.#syncSubmit();
	}

	#getPageUrl(pageNumber: number): string {
		const basePath = this.dataset.basePath ?? '';

		return pageNumber === 1 ? basePath : `${basePath}${String(pageNumber)}/`;
	}

	#handleChange = () => {
		// A coarse-pointer picker is easy to mis-tap, so touch commits through Go
		// Firefox changes a closed select on arrow keys and wheel, so keyboard changes never navigate
		const shouldNavigate = this.#isPointerDriven && !matchMedia('(pointer: coarse)').matches;

		this.#isPointerDriven = false;

		// Syncing here would flash Go while the navigation resolves
		if (shouldNavigate) {
			this.#navigateToSelectedPage();
			return;
		}

		this.#syncSubmit();
	};

	#handleKeyDown = () => {
		this.#isPointerDriven = false;
	};

	#handlePointerDown = () => {
		this.#isPointerDriven = true;
	};

	#handleSubmit = (event: SubmitEvent) => {
		event.preventDefault();
		this.#navigateToSelectedPage();
	};

	// Pin a width floor to the widest label (lastPage) so changing pages never resizes the control
	// The 0.5ch buffer absorbs per-digit width variance and font slack, so exact measurement isn't needed
	#lockSelectWidth(select: HTMLSelectElement, lastPage: number) {
		const lockWidth = () => {
			const selectedValue = select.value;

			select.style.minInlineSize = '';
			select.value = String(lastPage);

			const width = Math.ceil(select.getBoundingClientRect().width);

			select.value = selectedValue;

			if (width > 0) select.style.minInlineSize = `calc(${String(width)}px + 0.5ch)`;
		};

		lockWidth();

		// Fallback metrics mis-size the floor, so re-measure once webfonts settle
		if (document.fonts.status !== 'loaded') {
			void (async () => {
				await document.fonts.ready;
				lockWidth();
			})();
		}
	}

	#navigateToSelectedPage() {
		if (!this.#select) return;

		const currentPage = Number(this.dataset.currentPage);
		const pageNumber = Number(this.#select.value);

		if (pageNumber === currentPage || !Number.isSafeInteger(pageNumber)) return;

		// `navigate`, not `location.assign`, so view transitions still run
		void navigate(this.#getPageUrl(pageNumber));
	}

	#syncSubmit() {
		if (!this.#submit || !this.#select) return;

		const isChanged = this.#select.value !== (this.dataset.currentPage ?? '');

		this.#submit.toggleAttribute('data-visible', isChanged);
	}
}

if (!customElements.get('pagination-select')) {
	customElements.define('pagination-select', PaginationSelect);
}

declare global {
	interface HTMLElementTagNameMap {
		'pagination-select': PaginationSelect;
	}
}
