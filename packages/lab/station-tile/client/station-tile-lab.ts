import './station-tile.ts';

import type { GlossBlend, TileTheme } from '../core/appearance.ts';
import type { TileInput } from '../core/options.ts';

import {
	DEFAULT_TILE_THEME,
	GLOSS_BLENDS,
	TILE_DEFAULTS,
	TILE_THEMES,
} from '../core/appearance.ts';
import styles from './station-tile-lab.css?inline';

interface ColorSpec {
	key: 'glossColor' | 'grout';
	label: string;
	value: string;
}

type NumericOption =
	| 'bevel'
	| 'gloss'
	| 'grain'
	| 'grainGrout'
	| 'groutWidth'
	| 'jitter'
	| 'macroLighting'
	| 'stagger'
	| 'tileSize'
	| 'unitCells';

interface RangeSpec {
	key: NumericOption;
	label: string;
	max: number;
	min: number;
	step: number;
	value: number;
}

const RANGES: ReadonlyArray<RangeSpec> = [
	{ key: 'tileSize', label: 'Tile size', max: 64, min: 10, step: 1, value: 28 },
	{ key: 'jitter', label: 'Jitter', max: 1, min: 0, step: 0.05, value: 0.8 },
	{ key: 'gloss', label: 'Gloss', max: 1, min: 0, step: 0.05, value: 0.25 },
	{ key: 'bevel', label: 'Bevel', max: 1, min: 0, step: 0.05, value: 0.35 },
	{ key: 'macroLighting', label: 'Macro light', max: 1, min: 0, step: 0.05, value: 0.3 },
	{ key: 'stagger', label: 'Stagger', max: 0.5, min: 0, step: 0.05, value: 0 },
	{ key: 'unitCells', label: 'Unit cells', max: 24, min: 4, step: 1, value: 12 },
	{ key: 'groutWidth', label: 'Grout width', max: 8, min: 1, step: 0.5, value: 2 },
	{ key: 'grain', label: 'Tile grain', max: 0.3, min: 0, step: 0.01, value: 0.05 },
	{ key: 'grainGrout', label: 'Grout grain', max: 1, min: 0, step: 0.05, value: 0.5 },
];

const COLORS: ReadonlyArray<ColorSpec> = [
	{ key: 'grout', label: 'Grout', value: '#8a8a85' },
	{ key: 'glossColor', label: 'Gloss tint', value: '#ffffff' },
];

const DEFAULT_GLOSS_BLEND = TILE_DEFAULTS.glossBlend;

class StationTileLab extends HTMLElement {
	#frame = 0;
	#input: TileInput = {};
	#root = this.attachShadow({ mode: 'open' });
	#tile = document.createElement('station-tile');

	connectedCallback() {
		// A reconnect keeps the built shadow tree; re-apply in case a pending frame was cancelled on the way out
		if (this.#root.childElementCount > 0) {
			this.#apply();
			return;
		}

		const initialTheme = (this.getAttribute('theme') ?? DEFAULT_TILE_THEME) as TileTheme;
		const initialSeed = this.getAttribute('seed') ?? TILE_DEFAULTS.seed;

		this.#input = { glossBlend: DEFAULT_GLOSS_BLEND, seed: initialSeed, theme: initialTheme };
		for (const range of RANGES) this.#input[range.key] = range.value;
		for (const color of COLORS) this.#input[color.key] = color.value;

		const controls = document.createElement('div');
		controls.className = 'controls';
		controls.append(
			this.#selectField('Theme', Object.keys(TILE_THEMES), initialTheme, (value) => {
				this.#input.theme = value as TileTheme;
			}),
			this.#seedField(initialSeed),
			...RANGES.map((range) => this.#rangeField(range)),
			...COLORS.map((color) => this.#colorField(color)),
			this.#selectField('Gloss blend', GLOSS_BLENDS, DEFAULT_GLOSS_BLEND, (value) => {
				this.#input.glossBlend = value as GlossBlend;
			}),
			this.#seamlessField(),
		);

		const preview = document.createElement('div');
		preview.className = 'preview';
		preview.append(this.#tile);

		const lab = document.createElement('div');
		lab.className = 'lab';
		lab.append(preview, controls);

		const style = document.createElement('style');
		style.textContent = styles;
		this.#root.append(style, lab);

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
		if (this.#frame > 0) return;

		this.#frame = requestAnimationFrame(() => {
			this.#frame = 0;
			this.#tile.options = { ...this.#input };
		});
	}

	#colorField(color: ColorSpec): HTMLElement {
		const input = document.createElement('input');
		input.type = 'color';
		input.value = color.value;
		input.setAttribute('aria-label', color.label);
		input.addEventListener('input', () => {
			this.#input[color.key] = input.value;
			this.#apply();
		});

		return this.#field(color.label, undefined, input);
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

	#rangeField(range: RangeSpec): HTMLElement {
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
			this.#input[range.key] = Number(input.value);
			this.#apply();
		});

		return this.#field(range.label, value, input);
	}

	#seamlessField(): HTMLElement {
		const input = document.createElement('input');
		input.type = 'checkbox';
		input.addEventListener('change', () => {
			this.#input.seamless = input.checked;
			this.#apply();
		});

		const field = document.createElement('label');
		field.className = 'field toggle';
		const name = document.createElement('span');
		name.className = 'field-name';
		name.textContent = 'Seamless';
		field.append(input, name);
		return field;
	}

	#seedField(initial: string): HTMLElement {
		const input = document.createElement('input');
		input.type = 'text';
		input.value = initial;
		input.setAttribute('aria-label', 'Seed');
		input.addEventListener('input', () => {
			this.#input.seed = input.value;
			this.#apply();
		});

		const shuffle = document.createElement('button');
		shuffle.type = 'button';
		shuffle.textContent = '↻';
		shuffle.setAttribute('aria-label', 'Randomize seed');
		shuffle.addEventListener('click', () => {
			input.value = randomSeed();
			this.#input.seed = input.value;
			this.#apply();
		});

		const row = document.createElement('div');
		row.className = 'seed-row';
		row.append(input, shuffle);
		return this.#field('Seed', undefined, row);
	}

	#selectField(
		label: string,
		values: ReadonlyArray<string>,
		initial: string,
		onChange: (value: string) => void,
	): HTMLElement {
		const select = document.createElement('select');
		for (const name of values) {
			const option = document.createElement('option');
			option.value = name;
			option.textContent = name;
			option.selected = name === initial;
			select.append(option);
		}
		select.setAttribute('aria-label', label);
		select.addEventListener('change', () => {
			onChange(select.value);
			this.#apply();
		});
		return this.#field(label, undefined, select);
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
