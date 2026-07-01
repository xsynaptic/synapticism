import './station-tile.ts';

import type { TileTheme } from './station-tile-themes.ts';

import { defaultTileSeed } from './station-tile-input.ts';
import { DEFAULT_TILE_THEME, TILE_THEMES } from './station-tile-themes.ts';

interface RangeSpec {
	attribute: string;
	label: string;
	max: number;
	min: number;
	step: number;
	value: number;
}

const RANGES: ReadonlyArray<RangeSpec> = [
	{ attribute: 'tile-size', label: 'Tile size', max: 64, min: 10, step: 1, value: 28 },
	{ attribute: 'jitter', label: 'Jitter', max: 1, min: 0, step: 0.05, value: 0.8 },
	{ attribute: 'gloss', label: 'Gloss', max: 1, min: 0, step: 0.05, value: 0.25 },
	{ attribute: 'bevel', label: 'Bevel', max: 1, min: 0, step: 0.05, value: 0.35 },
	{ attribute: 'macro-lighting', label: 'Macro light', max: 1, min: 0, step: 0.05, value: 0.3 },
	{ attribute: 'stagger', label: 'Stagger', max: 0.5, min: 0, step: 0.05, value: 0 },
];

const STYLE = `
	:host {
		--mtr-surface: var(--color-primary-100, #f4f4f5);
		--mtr-carbon: var(--color-primary-800, #27272a);
		--mtr-ink: var(--color-primary-700, #3f3f46);
		--mtr-ink-muted: var(--color-primary-600, #52525b);
		--mtr-hairline: var(--color-primary-200, #e4e4e7);
		--mtr-accent: var(--color-accent-600, #2b7e8f);
		--mtr-mono: var(--font-mono, var(--font-geist-mono, ui-monospace, monospace));
		display: block;
	}
	* { box-sizing: border-box; }
	.lab {
		overflow: hidden;
		font-family: var(--mtr-mono);
		color: var(--mtr-ink);
		background: var(--mtr-surface);
		border: 1px solid var(--mtr-hairline);
		border-radius: 0.25rem;
	}
	.preview {
		aspect-ratio: 16 / 7;
		background: var(--mtr-carbon);
	}
	.preview station-tile { display: block; width: 100%; height: 100%; }
	.controls {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 0.85rem 1rem;
		padding: 0.85rem 1rem;
		border-top: 1px solid var(--mtr-hairline);
	}
	.field { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.8rem; }
	.field-head { display: flex; justify-content: space-between; gap: 0.5rem; color: var(--mtr-ink-muted); }
	.field-value { color: var(--mtr-accent); }
	input[type='range'] { width: 100%; margin: 0; accent-color: var(--mtr-accent); }
	select, input[type='text'] {
		width: 100%;
		min-width: 0;
		padding: 0.3rem 0.45rem;
		font-family: var(--mtr-mono);
		font-size: 0.8rem;
		color: var(--mtr-ink);
		background: #fff;
		border: 1px solid var(--mtr-hairline);
		border-radius: 0.25rem;
	}
	.seed-row { display: flex; gap: 0.4rem; }
	button {
		flex: none;
		padding: 0 0.6rem;
		font-family: var(--mtr-mono);
		font-size: 0.9rem;
		color: #fff;
		cursor: pointer;
		background: var(--mtr-accent);
		border: none;
		border-radius: 0.25rem;
	}
	.toggle { flex-direction: row; align-items: center; gap: 0.5rem; }
	.toggle input { accent-color: var(--mtr-accent); }
	@media (prefers-reduced-motion: no-preference) {
		button, select, input { transition: border-color 0.2s, background-color 0.2s; }
	}
`;

class StationTileLab extends HTMLElement {
	connectedCallback() {
		if (this.shadowRoot) return;
		const root = this.attachShadow({ mode: 'open' });

		const tile = document.createElement('station-tile');
		const initialTheme = (this.getAttribute('theme') ?? DEFAULT_TILE_THEME) as TileTheme;
		const initialSeed = this.getAttribute('seed') ?? defaultTileSeed;
		tile.setAttribute('theme', initialTheme);
		tile.setAttribute('seed', initialSeed);
		for (const range of RANGES) {
			tile.setAttribute(range.attribute, String(range.value));
		}

		const controls = document.createElement('div');
		controls.className = 'controls';
		controls.append(
			this.#themeField(tile, initialTheme),
			this.#seedField(tile, initialSeed),
			...RANGES.map((range) => this.#rangeField(tile, range)),
			this.#seamlessField(tile),
		);

		const preview = document.createElement('div');
		preview.className = 'preview';
		preview.append(tile);

		const lab = document.createElement('div');
		lab.className = 'lab';
		lab.append(preview, controls);

		const style = document.createElement('style');
		style.textContent = STYLE;
		root.append(style, lab);
	}

	#field(label: string, value: HTMLElement | undefined, control: HTMLElement): HTMLElement {
		const head = document.createElement('span');
		head.className = 'field-head';
		const name = document.createElement('span');
		name.className = 'field-name';
		name.textContent = label;
		head.append(name);
		if (value) head.append(value);

		const field = document.createElement('label');
		field.className = 'field';
		field.append(head, control);
		return field;
	}

	#rangeField(tile: HTMLElement, range: RangeSpec): HTMLElement {
		const value = document.createElement('span');
		value.className = 'field-value';
		value.textContent = formatValue(range.value);

		const input = document.createElement('input');
		input.type = 'range';
		input.min = String(range.min);
		input.max = String(range.max);
		input.step = String(range.step);
		input.value = String(range.value);
		input.setAttribute('aria-label', range.label);
		input.addEventListener('input', () => {
			value.textContent = formatValue(Number(input.value));
			tile.setAttribute(range.attribute, input.value);
		});

		return this.#field(range.label, value, input);
	}

	#seamlessField(tile: HTMLElement): HTMLElement {
		const input = document.createElement('input');
		input.type = 'checkbox';
		input.addEventListener('change', () => {
			tile.toggleAttribute('seamless', input.checked);
		});

		const field = document.createElement('label');
		field.className = 'field toggle';
		const name = document.createElement('span');
		name.className = 'field-name';
		name.textContent = 'Seamless';
		field.append(input, name);
		return field;
	}

	#seedField(tile: HTMLElement, initial: string): HTMLElement {
		const input = document.createElement('input');
		input.type = 'text';
		input.value = initial;
		input.setAttribute('aria-label', 'Seed');
		input.addEventListener('input', () => {
			tile.setAttribute('seed', input.value);
		});

		const shuffle = document.createElement('button');
		shuffle.type = 'button';
		shuffle.textContent = '↻';
		shuffle.setAttribute('aria-label', 'Randomize seed');
		shuffle.addEventListener('click', () => {
			input.value = randomSeed();
			tile.setAttribute('seed', input.value);
		});

		const row = document.createElement('div');
		row.className = 'seed-row';
		row.append(input, shuffle);
		return this.#field('Seed', undefined, row);
	}

	#themeField(tile: HTMLElement, initial: TileTheme): HTMLElement {
		const select = document.createElement('select');
		for (const name of Object.keys(TILE_THEMES)) {
			const option = document.createElement('option');
			option.value = name;
			option.textContent = name;
			option.selected = name === initial;
			select.append(option);
		}
		select.addEventListener('change', () => {
			tile.setAttribute('theme', select.value);
		});
		return this.#field('Theme', undefined, select);
	}
}

function formatValue(value: number): string {
	return Number.isSafeInteger(value) ? value.toString() : value.toFixed(2);
}

function randomSeed(): string {
	return Math.random().toString(36).slice(2, 9);
}

if (!customElements.get('station-tile-lab')) {
	customElements.define('station-tile-lab', StationTileLab);
}

declare global {
	interface HTMLElementTagNameMap {
		'station-tile-lab': StationTileLab;
	}
}
