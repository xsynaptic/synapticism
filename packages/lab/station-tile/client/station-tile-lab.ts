import '#station-tile/client/station-tile.ts';

import type { GlossBlend, TileTheme } from '#station-tile/core/appearance.ts';
import type { TileInput } from '#station-tile/core/options.ts';

import { downloadTile } from '#station-tile/client/station-tile-export.ts';
import { generateTileSvg } from '#station-tile/core/render.ts';
import {
	formatRangeValue,
	isExportFormat,
	isRangeActive,
	labAspectRatio,
	labColors,
	labRanges,
} from '#station-tile/station-tile-lab-controls.ts';

// Markup arrives as declarative shadow DOM from station-tile-lab.astro; the form holds all state
class StationTileLab extends HTMLElement {
	#form: HTMLFormElement | undefined;
	#frame = 0;
	#tile: HTMLElementTagNameMap['station-tile'] | undefined;

	connectedCallback() {
		this.#adoptTemplate();
		this.#wire();
		this.#apply();
	}

	disconnectedCallback() {
		if (this.#frame === 0) return;

		cancelAnimationFrame(this.#frame);
		this.#frame = 0;
	}

	// ClientRouter connects a swapped-in element before it attaches the declarative shadow root
	#adoptTemplate() {
		if (this.shadowRoot) return;

		const template = this.querySelector(':scope > template[shadowrootmode]');

		if (!(template instanceof HTMLTemplateElement)) return;

		this.attachShadow({ mode: 'open' }).append(template.content);
		template.remove();
	}

	// A dragged slider fires `input` far faster than a tile field can be regenerated
	// Coalesce to one render per frame so the queue can never outrun the display
	#apply() {
		const form = this.#form;
		const tile = this.#tile;

		if (!form || !tile || this.#frame > 0) return;

		this.#frame = requestAnimationFrame(() => {
			this.#frame = 0;
			tile.options = readInput(form);
		});
	}

	#wire() {
		if (this.#form) return;

		const form = this.shadowRoot?.querySelector('form');
		const tile = this.shadowRoot?.querySelector('station-tile');

		if (!form || !tile) return;

		this.#form = form;
		this.#tile = tile;

		form.addEventListener('input', () => {
			syncControls(form);
			this.#apply();
		});

		form.addEventListener('submit', (event) => {
			event.preventDefault();
		});

		form.querySelector('.randomize')?.addEventListener('click', () => {
			const seed = form.elements.namedItem('seed');

			if (!(seed instanceof HTMLInputElement)) return;

			seed.value = randomSeed();
			this.#apply();
		});

		wireDownloads(form);

		// A native reset button restores values after its click listeners run, too late to sync here
		form.querySelector('.reset')?.addEventListener('click', () => {
			form.reset();
			syncControls(form);
			this.#apply();
		});
	}
}

function wireDownloads(form: HTMLFormElement) {
	for (const button of form.querySelectorAll<HTMLButtonElement>('button[data-format]')) {
		button.addEventListener('click', () => {
			const format = button.dataset.format;

			if (!isExportFormat(format)) return;

			const input = readInput(form);

			void downloadTile(generateTileSvg(input), format, exportName(input));
		});
	}
}

function exportName(input: TileInput): string {
	const seed = String(input.seed ?? '')
		.toLowerCase()
		.replaceAll(/[^\da-z]+/g, '-')
		.replaceAll(/^-|-$/g, '');
	const parts = ['station-tile', input.theme, seed, input.seamless ? 'seamless' : undefined];

	return parts.filter(Boolean).join('-');
}

function formText(data: FormData, name: string): string {
	const value = data.get(name);

	return typeof value === 'string' ? value : '';
}

function randomSeed(): string {
	return Math.random().toString(36).slice(2, 9);
}

// Select values come from the typed lists that rendered their options
function readInput(form: HTMLFormElement): TileInput {
	const data = new FormData(form);
	const input: TileInput = {
		aspectRatio: labAspectRatio,
		glossBlend: formText(data, 'glossBlend') as GlossBlend,
		seamless: data.has('seamless'),
		seed: formText(data, 'seed'),
		theme: formText(data, 'theme') as TileTheme,
	};

	// Disabled controls drop out of FormData, leaving the generator's default in place
	for (const range of labRanges) {
		if (data.has(range.key)) input[range.key] = Number(formText(data, range.key));
	}
	for (const color of labColors) input[color.key] = formText(data, color.key);

	return input;
}

function syncControls(form: HTMLFormElement) {
	const seamless = form.elements.namedItem('seamless');
	const isSeamless = seamless instanceof HTMLInputElement && seamless.checked;

	for (const range of labRanges) {
		const control = form.elements.namedItem(range.key);

		if (!(control instanceof HTMLInputElement)) continue;

		control.disabled = !isRangeActive(range, isSeamless);

		const output = control.closest('.field')?.querySelector('.field-value');

		if (output) output.textContent = formatRangeValue(control.valueAsNumber);
	}
}

if (!customElements.get('station-tile-lab')) {
	customElements.define('station-tile-lab', StationTileLab);
}

declare global {
	interface HTMLElementTagNameMap {
		'station-tile-lab': StationTileLab;
	}
}
