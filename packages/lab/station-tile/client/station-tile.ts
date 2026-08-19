import type { TileInput } from '../core/options.ts';

import { generateTileSvg, tileBackgroundStyle } from '../core/render.ts';

class StationTile extends HTMLElement {
	get options() {
		return this.#input;
	}

	set options(input: TileInput) {
		this.#input = input;
		if (this.isConnected) this.#render();
	}

	#input: TileInput = {};

	connectedCallback() {
		this.#upgradeOptions();

		if (!this.style.display) this.style.display = 'block';

		this.#render();
	}

	#render() {
		Object.assign(this.style, tileBackgroundStyle(generateTileSvg(this.#input)));
	}

	// Options assigned before the element upgrades land as an own property that shadows the setter
	#upgradeOptions() {
		if (!Object.hasOwn(this, 'options')) return;

		const value = this.options;

		delete (this as Partial<StationTile>).options;

		this.options = value;
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
