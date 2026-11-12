import type { ResultsState } from '#emoji-picker/client/search-results.ts';

import { wireCategoryBar } from '#emoji-picker/client/category-bar.ts';
import { CopyBubble } from '#emoji-picker/client/copy-bubble.ts';
import { queryDetailParts, renderDetail } from '#emoji-picker/client/detail-panel.ts';
import { isEmojiSize, pickerStore } from '#emoji-picker/client/emoji-picker-store.ts';
import {
	cellSelector,
	cloneCells,
	focusFirstCell,
	isCell,
	isGridKey,
	moveFocus,
	setActiveCell,
} from '#emoji-picker/client/grid-focus.ts';
import {
	ensureSearch,
	isSearchReady,
	lookupEntry,
	searchEmoji,
} from '#emoji-picker/client/search-client.ts';
import { queryResultsView, renderResults } from '#emoji-picker/client/search-results.ts';
import { markUnsupported, probeSupport } from '#emoji-picker/client/support-marking.ts';
import { TonePopover } from '#emoji-picker/client/tone-popover.ts';
import { whenIdle } from '#emoji-picker/client/when-idle.ts';

function isTyping(target: EventTarget | null) {
	return (
		target instanceof HTMLElement &&
		(target.isContentEditable || target.matches('input, textarea, select'))
	);
}

class EmojiPicker extends HTMLElement {
	#abort: AbortController | undefined;
	#announcer: HTMLElement | undefined;
	#baseGlyphs = new Map<string, string>();
	#bubble: CopyBubble | undefined;
	#cells = new Map<string, HTMLButtonElement>();
	#focused: string | undefined;
	#query = '';
	#recents: HTMLElement | undefined;
	#refreshCategories: (() => void) | undefined;
	#scroller: HTMLElement | undefined;
	#search: HTMLInputElement | undefined;
	#searchFailed = false;
	#tones: TonePopover | undefined;

	connectedCallback() {
		if (this.#abort) return;

		const scroller = this.querySelector<HTMLElement>(':scope .ep-scroll');
		const search = this.querySelector<HTMLInputElement>(':scope .ep-search input');
		const recents = this.querySelector<HTMLElement>(':scope .ep-recents');

		if (!scroller || !search || !recents) return;

		this.#abort = new AbortController();
		this.#scroller = scroller;
		this.#search = search;
		this.#recents = recents;
		this.#announcer = this.querySelector<HTMLElement>(':scope .ep-announcer') ?? undefined;

		this.#indexCells();
		recents.hidden = false;
		this.#applySize();
		this.#applyTones();
		this.#renderRecents();
		this.#wire(scroller, search, this.#abort.signal);
		probeSupport(this, this.#cells);
		whenIdle(() => {
			void this.#loadSearch();
		});
	}

	disconnectedCallback() {
		this.#abort?.abort();
		this.#abort = undefined;
		this.#bubble?.hide();
	}

	#announce(message: string) {
		if (this.#announcer) this.#announcer.textContent = message;
	}

	#applySize() {
		const { size } = pickerStore.getState();

		this.dataset.size = size;

		for (const button of this.querySelectorAll<HTMLButtonElement>(':scope .ep-size button')) {
			button.setAttribute('aria-pressed', String(button.dataset.size === size));
		}
	}

	// Clones in recents and results carry the hexcode too, so they follow a tone change in place
	#applyTones() {
		const { tones } = pickerStore.getState();

		for (const cell of this.querySelectorAll<HTMLButtonElement>(`:scope ${cellSelector}`)) {
			const hexcode = cell.dataset.hexcode ?? '';
			const tone = tones[hexcode] ?? 0;
			const glyph =
				tone > 0 ? cell.dataset.skins?.split(' ')[tone - 1] : this.#baseGlyphs.get(hexcode);

			if (glyph !== undefined && cell.textContent !== glyph) cell.textContent = glyph;
		}
	}

	async #copy(cell: HTMLButtonElement) {
		const glyph = cell.textContent;
		const hexcode = cell.dataset.hexcode;

		if (hexcode === undefined) return;

		this.#setFocused(hexcode);

		try {
			await navigator.clipboard.writeText(glyph);
		} catch {
			this.#notify(cell, 'Copy blocked by the browser', true);
			return;
		}

		pickerStore.getState().addRecent(hexcode);
		this.#notify(this.#liveCell(cell, hexcode), 'Copied', false);
		this.#announce(`Copied ${glyph}`);
	}

	#handleCellKey(event: KeyboardEvent, cell: HTMLButtonElement) {
		if (event.key === 'Enter' && event.shiftKey) {
			event.preventDefault();
			this.#tones?.open(cell);
			return;
		}

		if (!isGridKey(event.key)) return;

		event.preventDefault();
		moveFocus(this, cell, event.key);
	}

	#handleEscape(event: KeyboardEvent) {
		if (this.#tones?.isOpen()) {
			event.preventDefault();
			this.#tones.close();
			return;
		}

		if (this.#query === '') return;

		event.preventDefault();
		this.#setQuery('');
		this.#search?.focus();
	}

	// The popover handles its own keys, Escape included
	#handleKeydown(event: KeyboardEvent) {
		if (event.target instanceof Element && event.target.closest('.ep-tones')) return;

		if (event.key === 'Escape') {
			this.#handleEscape(event);
			return;
		}

		if (event.target === this.#search && event.key === 'ArrowDown') {
			event.preventDefault();
			focusFirstCell(this, true);
			return;
		}

		if (isCell(event.target)) this.#handleCellKey(event, event.target);
	}

	#indexCells() {
		for (const cell of this.querySelectorAll<HTMLButtonElement>(
			`:scope .ep-group ${cellSelector}`,
		)) {
			const hexcode = cell.dataset.hexcode;

			if (hexcode === undefined) continue;

			this.#cells.set(hexcode, cell);
			this.#baseGlyphs.set(hexcode, cell.textContent);
		}
	}

	#liveCell(cell: HTMLButtonElement, hexcode: string) {
		if (cell.isConnected) return cell;

		return (
			this.#recents?.querySelector<HTMLButtonElement>(`[data-hexcode="${CSS.escape(hexcode)}"]`) ??
			cell
		);
	}

	// A query typed before the index lands runs when it does
	async #loadSearch() {
		if (isSearchReady()) return;

		this.#searchFailed = false;
		this.#searchFailed = !(await ensureSearch());

		if (!this.#abort) return;

		if (this.#query.trim() !== '') void this.#renderResults();

		void this.#renderDetail();
	}

	#notify(cell: HTMLButtonElement, message: string, isError: boolean) {
		this.#bubble?.show(cell, message, isError);

		if (isError) this.#announce(message);
	}

	// Once the index is up, the panel waits for the entry so keywords never flash empty
	async #renderDetail() {
		const hexcode = this.#focused;
		const parts = queryDetailParts(this);
		const cell = hexcode === undefined ? undefined : this.#cells.get(hexcode);

		if (!parts || !cell || hexcode === undefined) return;

		const entry = isSearchReady() ? await lookupEntry(hexcode) : undefined;

		if (this.#focused !== hexcode) return;

		renderDetail(parts, cell, entry);
	}

	// Copying from recents reorders them; the copied clone keeps focus across the re-render
	#renderRecents() {
		const container = this.#recents?.querySelector(':scope > .ep-cells');

		if (!container) return;

		const active = document.activeElement;
		const focused =
			isCell(active) && container.contains(active) ? active.dataset.hexcode : undefined;
		const clones = cloneCells(pickerStore.getState().recents, (hexcode) =>
			this.#cells.get(hexcode),
		);

		container.replaceChildren(...clones);

		const refocus = clones.find((clone) => clone.dataset.hexcode === focused);

		if (refocus) {
			setActiveCell(this, refocus, true);
			return;
		}

		if (!this.querySelector(`:scope ${cellSelector}[tabindex="0"]`)) focusFirstCell(this, false);
	}

	async #renderResults() {
		const query = this.#query;
		const isSearching = query.trim() !== '';

		this.#syncSearchField(query);

		const state = await this.#resultsState(query);
		const view = queryResultsView(this);

		// A slower answer for an earlier keystroke must not overwrite a newer one
		if (!view || this.#query !== query) return;

		this.toggleAttribute('data-searching', isSearching);
		view.section.hidden = !isSearching;
		renderResults(view, state, (hexcode) => this.#cells.get(hexcode));
		this.#scroller?.scrollTo({ top: 0 });
		this.#refreshCategories?.();
		focusFirstCell(this, false);
	}

	async #resultsState(query: string): Promise<ResultsState> {
		if (query.trim() === '') return { hexcodes: [], kind: 'ready' };

		if (this.#searchFailed) return { kind: 'failed' };

		if (!isSearchReady()) return { kind: 'pending' };

		return { hexcodes: await searchEmoji(query), kind: 'ready' };
	}

	#setFocused(hexcode: string | undefined) {
		if (hexcode === this.#focused) return;

		this.#focused = hexcode;
		void this.#renderDetail();
	}

	#setQuery(query: string) {
		if (query === this.#query) return;

		this.#query = query;
		void this.#renderResults();
	}

	#subscribe(signal: AbortSignal) {
		const unsubscribe = pickerStore.subscribe((state, previous) => {
			const cellsChanged =
				state.tones !== previous.tones || state.supportedVersion !== previous.supportedVersion;

			if (state.size !== previous.size) this.#applySize();

			if (cellsChanged) {
				this.#applyTones();
				markUnsupported(this.#cells);
				void this.#renderDetail();
			}

			if (cellsChanged || state.recents !== previous.recents) this.#renderRecents();
		});

		signal.addEventListener('abort', unsubscribe);
	}

	#syncSearchField(query: string) {
		if (this.#search && this.#search.value !== query) this.#search.value = query;
	}

	#wire(scroller: HTMLElement, search: HTMLInputElement, signal: AbortSignal) {
		const bubble = this.querySelector<HTMLElement>(':scope .ep-bubble');

		if (bubble) this.#bubble = new CopyBubble(bubble, scroller);

		this.#wireGrid(scroller, signal);
		this.#wireKeys(signal);
		this.#wireSearch(search, signal);
		this.#wireSize(signal);
		this.#wireTones(scroller, signal);
		this.#subscribe(signal);
		this.#refreshCategories = wireCategoryBar(
			{
				beforeJump: () => {
					this.#setQuery('');
				},
				root: this,
				scroller,
			},
			signal,
		);
	}

	#wireGrid(scroller: HTMLElement, signal: AbortSignal) {
		scroller.addEventListener(
			'click',
			(event) => {
				const cell =
					event.target instanceof Element ? event.target.closest(cellSelector) : undefined;

				if (isCell(cell)) void this.#copy(cell);
			},
			{ signal },
		);

		scroller.addEventListener(
			'focusin',
			(event) => {
				if (!isCell(event.target)) return;

				setActiveCell(this, event.target, false);
				this.#setFocused(event.target.dataset.hexcode);
			},
			{ signal },
		);

		scroller.addEventListener(
			'pointerover',
			(event) => {
				if (event.pointerType !== 'mouse' || !isCell(event.target)) return;

				this.#setFocused(event.target.dataset.hexcode);
			},
			{ signal },
		);
	}

	#wireKeys(signal: AbortSignal) {
		this.addEventListener(
			'keydown',
			(event) => {
				this.#handleKeydown(event);
			},
			{ signal },
		);

		document.addEventListener(
			'keydown',
			(event) => {
				if (event.key !== '/' || event.metaKey || event.ctrlKey || isTyping(event.target)) return;

				event.preventDefault();
				this.#search?.focus();
			},
			{ signal },
		);
	}

	#wireSearch(search: HTMLInputElement, signal: AbortSignal) {
		search.addEventListener(
			'focus',
			() => {
				void this.#loadSearch();
			},
			{ signal },
		);

		search.addEventListener(
			'input',
			() => {
				this.#setQuery(search.value);
			},
			{ signal },
		);
	}

	#wireSize(signal: AbortSignal) {
		this.querySelector(':scope .ep-size')?.addEventListener(
			'click',
			(event) => {
				const button =
					event.target instanceof Element
						? event.target.closest<HTMLButtonElement>('.ep-size button')
						: undefined;
				const size = button?.dataset.size;

				if (isEmojiSize(size)) pickerStore.getState().setSize(size);
			},
			{ signal },
		);
	}

	#wireTones(scroller: HTMLElement, signal: AbortSignal) {
		const popover = this.querySelector<HTMLElement>(':scope .ep-tones');

		if (!popover) return;

		this.#tones = new TonePopover(
			{
				baseGlyph: (hexcode) => this.#baseGlyphs.get(hexcode),
				onChoose: (cell, tone) => {
					pickerStore.getState().setTone(cell.dataset.hexcode ?? '', tone);
					void this.#copy(cell);
				},
				onShow: () => {
					this.#bubble?.hide();
				},
				popover,
				scroller,
			},
			signal,
		);
	}
}

if (!customElements.get('emoji-picker')) {
	customElements.define('emoji-picker', EmojiPicker);
}

declare global {
	interface HTMLElementTagNameMap {
		'emoji-picker': EmojiPicker;
	}
}
