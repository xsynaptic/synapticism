import type { TileInput } from '#station-tile/core/options.ts';

import { generateTileSvg, svgDataUri, tileBackgroundStyle } from '#station-tile/core/render.ts';

class StationTile extends HTMLElement {
	get options() {
		return this.#input;
	}

	set options(input: TileInput) {
		this.#input = input;
		if (this.isConnected) this.#render();
	}

	#input: TileInput = {};
	#renderCount = 0;

	connectedCallback() {
		this.#upgradeOptions();

		if (!this.style.display) this.style.display = 'block';

		this.#render();
	}

	// Swapped only once decoded, so a slider drag never paints a blank frame
	#render() {
		const tile = generateTileSvg(this.#input);
		const image = new Image();
		const renderCount = ++this.#renderCount;
		const apply = () => {
			if (renderCount === this.#renderCount) Object.assign(this.style, tileBackgroundStyle(tile));
		};

		image.src = svgDataUri(tile.svg);
		void image.decode().then(apply).catch(apply);
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
