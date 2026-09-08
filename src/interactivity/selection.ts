import powerbi from "powerbi-visuals-api";
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;
import { ForgeRow } from "../dataView/transform";

export interface SelectionOptions {
    enabled: boolean;
    contextMenu: boolean;
    dimUnselectedPercent: number;
}

/**
 * Binds click / right-click on elements carrying `data-hf-row="<index>"`
 * (or any ancestor of the click target) to the Power BI selection
 * manager, and reflects selection state by dimming unselected rows.
 */
export class SelectionBinder {
    private manager: ISelectionManager;
    private byIndex = new Map<number, ISelectionId>();

    constructor(manager: ISelectionManager) {
        this.manager = manager;
    }

    setRows(rows: ForgeRow[]): void {
        this.byIndex.clear();
        rows.forEach((r) => this.byIndex.set(r.index, r.selectionId));
    }

    attach(root: HTMLElement, opts: SelectionOptions): () => void {
        const findIndex = (el: EventTarget | null): number | null => {
            const node = (el as HTMLElement)?.closest?.("[data-hf-row]") as HTMLElement | null;
            if (!node) return null;
            const n = parseInt(node.getAttribute("data-hf-row") || "", 10);
            return isNaN(n) ? null : n;
        };

        const onClick = (ev: MouseEvent): void => {
            if (!opts.enabled) return;
            const idx = findIndex(ev.target);
            if (idx == null) return;
            const id = this.byIndex.get(idx);
            if (!id) return;
            ev.stopPropagation();
            void this.manager.select(id, ev.ctrlKey || ev.metaKey).then(() => this.applyDim(root, opts));
        };

        const onContext = (ev: MouseEvent): void => {
            if (!opts.contextMenu) return;
            const idx = findIndex(ev.target);
            const id = idx != null ? this.byIndex.get(idx) : undefined;
            ev.preventDefault();
            this.manager.showContextMenu(id || {}, { x: ev.clientX, y: ev.clientY });
        };

        const onClear = (ev: MouseEvent): void => {
            if (!opts.enabled) return;
            if (findIndex(ev.target) == null) {
                void this.manager.clear().then(() => this.applyDim(root, opts));
            }
        };

        root.addEventListener("click", onClick);
        root.addEventListener("contextmenu", onContext);
        root.addEventListener("click", onClear);
        this.applyDim(root, opts);

        return () => {
            root.removeEventListener("click", onClick);
            root.removeEventListener("contextmenu", onContext);
            root.removeEventListener("click", onClear);
        };
    }

    applyDim(root: HTMLElement, opts: SelectionOptions): void {
        const ids = this.manager.getSelectionIds() as ISelectionId[];
        const hasSelection = ids.length > 0;
        const dim = Math.max(0, Math.min(100, opts.dimUnselectedPercent)) / 100;
        root.querySelectorAll<HTMLElement>("[data-hf-row]").forEach((node) => {
            const n = parseInt(node.getAttribute("data-hf-row") || "", 10);
            const id = this.byIndex.get(n);
            const selected = !!id && ids.some((s) => (s as unknown as { equals?: (o: unknown) => boolean }).equals?.(id));
            node.style.opacity = hasSelection && !selected ? String(1 - dim) : "";
        });
    }
}
