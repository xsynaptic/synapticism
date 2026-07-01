import type { TileInput } from './station-tile-input.ts';

import { generateTileSvg } from './station-tile-generate-svg.ts';
import { camelToKebab, resolveTileOptions, tileFieldsEnum } from './station-tile-input.ts';

// A self-rendering tile field; every attribute maps to a `TileInput` field
class StationTile extends HTMLElement {
	static readonly observedAttributes = [
		...Object.keys(tileFieldsEnum).map((key) => camelToKebab(key)),
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
		for (const [key, kind] of Object.entries(tileFieldsEnum)) {
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
		const { height, svg, width } = generateTileSvg(resolveTileOptions(input));

		if (input.seamless) {
			this.replaceChildren();
			const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
			this.style.backgroundImage = `url("${dataUri}")`;
			this.style.backgroundRepeat = 'repeat';
			this.style.backgroundSize = `${String(width)}px ${String(height)}px`;
			return;
		}

		this.style.backgroundImage = '';
		this.innerHTML = svg;
		const svgElement = this.querySelector('svg');
		if (svgElement) {
			svgElement.setAttribute('width', '100%');
			svgElement.setAttribute('height', '100%');
			svgElement.style.display = 'block';
		}
	}
}

if (!customElements.get('station-tile')) {
	customElements.define('station-tile', StationTile);
}

declare global {
	interface HTMLElementTagNameMap {
		'station-tile': StationTile;
	}
}
