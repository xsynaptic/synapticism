import type { TileInput } from '../core/options.ts';

import { generateTileSvg, tileBackgroundStyle } from '../core/render.ts';

// Scalar options and how each parses from a string attribute
// `seamless` is a boolean, handled separately
const TILE_FIELDS = {
	bevel: 'number',
	colorA: 'string',
	colorB: 'string',
	gloss: 'number',
	glossBlend: 'string',
	glossColor: 'string',
	grain: 'number',
	grainGrout: 'number',
	grout: 'string',
	groutWidth: 'number',
	jitter: 'number',
	macroLighting: 'number',
	seed: 'string',
	stagger: 'number',
	theme: 'string',
	tileSize: 'number',
	unitCells: 'number',
} as const satisfies Record<string, 'number' | 'string'>;

class StationTile extends HTMLElement {
	static readonly observedAttributes = [
		...Object.keys(TILE_FIELDS).map((key) => camelToKebab(key)),
		'seamless',
	];

	attributeChangedCallback() {
		if (this.isConnected) this.#render();
	}

	connectedCallback() {
		if (!this.style.display) this.style.display = 'block';
		this.#render();
	}

	#readInput(): TileInput {
		const input: Record<string, number | string> = {};
		for (const [key, kind] of Object.entries(TILE_FIELDS)) {
			const raw = this.getAttribute(camelToKebab(key));
			if (raw === null || raw.trim() === '') continue;
			if (kind === 'number') {
				const value = Number(raw);
				if (Number.isFinite(value)) input[key] = value;
			} else {
				input[key] = raw;
			}
		}
		const seamless = this.hasAttribute('seamless') && this.getAttribute('seamless') !== 'false';
		return { ...input, seamless };
	}

	#render() {
		const input = this.#readInput();
		const generated = generateTileSvg(input);

		if (input.seamless) {
			this.replaceChildren();
			Object.assign(this.style, tileBackgroundStyle(generated));
			return;
		}

		this.style.backgroundImage = '';
		this.innerHTML = generated.svg;
	}
}

function camelToKebab(value: string): string {
	return value.replaceAll(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

if (!customElements.get('station-tile')) {
	customElements.define('station-tile', StationTile);
}

declare global {
	interface HTMLElementTagNameMap {
		'station-tile': StationTile;
	}
}
