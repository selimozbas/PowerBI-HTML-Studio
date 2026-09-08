/**
 * Windowed virtualization for "per row" render mode.
 *
 * Only the rows near the viewport are kept in the DOM; a full-height
 * spacer preserves the native scrollbar and a `translateY` on the row
 * slot places the window. Row height is estimated, then measured once
 * from the first painted window and corrected.
 *
 * Assumes roughly uniform row heights (typical for a per-row template).
 * Interactivity keeps working because SelectionBinder / TooltipBinder
 * listen on the scroll container via event delegation, not per row.
 */
export interface RowWindowOptions {
    scrollEl: HTMLElement;
    total: number;
    estRowHeight: number;
    buffer: number;
    renderRange: (start: number, end: number) => DocumentFragment;
    afterRender?: () => void;
}

export class RowWindow {
    private opts: RowWindowOptions;
    private wrap: HTMLElement;
    private slot: HTMLElement;
    private rowH: number;
    private measured = false;
    private start = -1;
    private end = -1;
    private raf = 0;

    constructor(opts: RowWindowOptions) {
        this.opts = opts;
        this.rowH = Math.max(8, opts.estRowHeight);

        this.wrap = document.createElement("div");
        this.wrap.className = "hf-vwrap";
        this.wrap.style.position = "relative";
        this.wrap.style.width = "100%";

        this.slot = document.createElement("div");
        this.slot.className = "hf-vslot";
        this.slot.style.position = "absolute";
        this.slot.style.top = "0";
        this.slot.style.left = "0";
        this.slot.style.right = "0";
        this.slot.style.willChange = "transform";

        this.wrap.appendChild(this.slot);
        opts.scrollEl.replaceChildren(this.wrap);
        // Attach the listener only after the first render succeeds, so a throw
        // in renderRange doesn't leave an orphaned listener + DOM on scrollEl.
        try {
            this.render();
        } catch (e) {
            opts.scrollEl.replaceChildren();
            throw e;
        }
        opts.scrollEl.addEventListener("scroll", this.onScroll, { passive: true });
    }

    destroy(): void {
        cancelAnimationFrame(this.raf);
        this.opts.scrollEl.removeEventListener("scroll", this.onScroll);
    }

    /** Force a re-window and re-measure row height, e.g. after a resize. */
    refresh(): void {
        this.start = -1;
        this.end = -1;
        this.measured = false;
        this.render();
    }

    private onScroll = (): void => {
        cancelAnimationFrame(this.raf);
        this.raf = requestAnimationFrame(() => this.render());
    };

    private render(): void {
        const { scrollEl, total, buffer } = this.opts;
        const viewport = scrollEl.clientHeight || 400;
        const start = Math.max(0, Math.floor(scrollEl.scrollTop / this.rowH) - buffer);
        const visible = Math.ceil(viewport / this.rowH) + buffer * 2;
        const end = Math.min(total, start + visible);
        if (start === this.start && end === this.end) return;
        this.start = start;
        this.end = end;

        this.wrap.style.height = `${Math.round(total * this.rowH)}px`;
        this.slot.style.transform = `translateY(${Math.round(start * this.rowH)}px)`;
        this.slot.replaceChildren(this.opts.renderRange(start, end));

        if (!this.measured && end > start) {
            const avg = this.slot.scrollHeight / (end - start);
            if (avg > 4) {
                this.measured = true; // only latch once we got a real measurement
                if (Math.abs(avg - this.rowH) > 3) {
                    this.rowH = avg;
                    this.start = -1;
                    this.end = -1;
                    this.render();
                    return;
                }
            }
        }
        this.opts.afterRender?.();
    }
}
