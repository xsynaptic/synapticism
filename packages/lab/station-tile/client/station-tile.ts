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
		Object.assign(this.style, tileBackgroundStyle(generateTileSvg(this.#input)));
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
