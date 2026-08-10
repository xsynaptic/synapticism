import type { TileInput } from '../core/options.ts';

import { generateTileSvg, tileBackgroundStyle } from '../core/render.ts';

class StationTile extends HTMLElement {
	set options(input: TileInput) {
		this.#input = input;
		if (this.isConnected) this.#render();
	}

	#input: TileInput = {};

	connectedCallback() {
		if (!this.style.display) this.style.display = 'block';
		this.#render();
	}

	#render() {
		const generated = generateTileSvg(this.#input);

		if (this.#input.seamless) {
			this.replaceChildren();
			Object.assign(this.style, tileBackgroundStyle(generated));
			return;
		}

		this.style.backgroundImage = '';
		this.innerHTML = generated.svg;
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
