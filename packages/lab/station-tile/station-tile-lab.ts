import './station-tile.ts';

import type { TileTheme } from './station-tile-themes.ts';

import { defaultTileSeed } from './station-tile-input.ts';
import styles from './station-tile-lab.css?inline';
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
		style.textContent = styles;
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
