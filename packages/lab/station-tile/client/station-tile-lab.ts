import '#station-tile/client/station-tile.ts';

import type { GlossBlend, TileTheme } from '#station-tile/core/appearance.ts';
import type { TileInput } from '#station-tile/core/options.ts';

import {
	formatRangeValue,
	LAB_ASPECT_RATIO,
	LAB_COLORS,
	LAB_RANGES,
} from '#station-tile/station-tile-lab-controls.ts';

// Markup arrives as declarative shadow DOM from station-tile-lab.astro; the form holds all state
class StationTileLab extends HTMLElement {
	#form: HTMLFormElement | undefined;
	#frame = 0;
	#tile: HTMLElementTagNameMap['station-tile'] | undefined;

	connectedCallback() {
		this.#wire();
		this.#apply();
	}

	disconnectedCallback() {
		if (this.#frame === 0) return;

		cancelAnimationFrame(this.#frame);
		this.#frame = 0;
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

		form.addEventListener('input', (event) => {
			if (event.target instanceof HTMLInputElement && event.target.type === 'range') {
				showRangeValue(event.target);
			}
			this.#apply();
		});

		form.addEventListener('submit', (event) => {
			event.preventDefault();
		});

		form.querySelector('button')?.addEventListener('click', () => {
			const seed = form.elements.namedItem('seed');

			if (!(seed instanceof HTMLInputElement)) return;

			seed.value = randomSeed();
			this.#apply();
		});
	}
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
		aspectRatio: LAB_ASPECT_RATIO,
		glossBlend: formText(data, 'glossBlend') as GlossBlend,
		seamless: data.has('seamless'),
		seed: formText(data, 'seed'),
		theme: formText(data, 'theme') as TileTheme,
	};

	for (const range of LAB_RANGES) input[range.key] = Number(formText(data, range.key));
	for (const color of LAB_COLORS) input[color.key] = formText(data, color.key);

	return input;
}

function showRangeValue(range: HTMLInputElement) {
	const output = range.closest('.field')?.querySelector('.field-value');

	if (output) output.textContent = formatRangeValue(range.valueAsNumber);
}

if (!customElements.get('station-tile-lab')) {
	customElements.define('station-tile-lab', StationTileLab);
}

declare global {
	interface HTMLElementTagNameMap {
		'station-tile-lab': StationTileLab;
	}
}
