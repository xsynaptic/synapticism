function getYearMonth() {
	const date = new Date();
	const month = String(date.getMonth() + 1).padStart(2, '0');

	return `${String(date.getFullYear())}-${month}`;
}

class CvPrint extends HTMLElement {
	#controller: AbortController | undefined;
	#originalTitle: string | undefined;

	connectedCallback() {
		this.#controller = new AbortController();

		const { signal } = this.#controller;

		window.addEventListener('beforeprint', this.#handleBeforePrint, { signal });
		window.addEventListener('afterprint', this.#handleAfterPrint, { signal });
	}

	disconnectedCallback() {
		this.#controller?.abort();
		this.#controller = undefined;
	}

	#handleAfterPrint = () => {
		this.querySelector('[data-cv-phone]')?.replaceChildren();

		if (this.#originalTitle === undefined) return;

		document.title = this.#originalTitle;
		this.#originalTitle = undefined;
	};

	#handleBeforePrint = () => {
		const { filename, phone } = this.dataset;

		if (phone) this.#writePhone(atob(phone));
		if (!filename) return;

		this.#originalTitle = document.title;
		document.title = `${getYearMonth()}-${filename}`;
	};

	#writePhone(phone: string) {
		const link = document.createElement('a');

		link.className = 'anchor anchor-primary-bright';
		link.href = `tel:${phone.replaceAll(' ', '')}`;
		link.textContent = phone;
		this.querySelector('[data-cv-phone]')?.replaceChildren(link);
	}
}

if (!customElements.get('cv-print')) {
	customElements.define('cv-print', CvPrint);
}

export {};

declare global {
	interface HTMLElementTagNameMap {
		'cv-print': CvPrint;
	}
}
