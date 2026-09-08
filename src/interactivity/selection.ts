import powerbi from "powerbi-visuals-api";
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;
import { ForgeRow } from "../dataView/transform";
import { parseSelectSpec, rowMatchesSpec } from "./selectMatch";

export interface SelectionOptions {
    enabled: boolean;
    contextMenu: boolean;
    dimUnselectedPercent: number;
}

/**
 * Binds click / right-click to the Power BI selection manager for two
 * kinds of hooks in the authored HTML:
 *   - `data-hf-row="<index>"`  - the row wrapper the visual emits itself;
 *   - `data-hf-select="Field:Value; ..."` - author-placed, cross-filters
 *     by field value across every matching row.
 * Selection state is reflected by dimming unselected rows and toggling an
 * `hf-selected` class on active `data-hf-select` elements.
 */
export class SelectionBinder {
    private manager: ISelectionManager;
    private rows: ForgeRow[] = [];
    private byIndex = new Map<number, ISelectionId>();

    constructor(manager: ISelectionManager) {
        this.manager = manager;
    }

    setRows(rows: ForgeRow[]): void {
        this.rows = rows;
        this.byIndex.clear();
        rows.forEach((r) => this.byIndex.set(r.index, r.selectionId));
    }

    private idsForTarget(el: EventTarget | null): ISelectionId[] {
        const rowNode = (el as HTMLElement)?.closest?.("[data-hf-row]") as HTMLElement | null;
        if (rowNode) {
            const n = parseInt(rowNode.getAttribute("data-hf-row") || "", 10);
            const id = isNaN(n) ? undefined : this.byIndex.get(n);
            return id ? [id] : [];
        }
        const selNode = (el as HTMLElement)?.closest?.("[data-hf-select]") as HTMLElement | null;
        if (selNode) {
            const pairs = parseSelectSpec(selNode.getAttribute("data-hf-select") || "");
            return this.rows
                .filter((r) => rowMatchesSpec(r.fields as Record<string, unknown>, pairs))
                .map((r) => r.selectionId);
        }
        return [];
    }

    attach(root: HTMLElement, opts: SelectionOptions): () => void {
        const onClick = (ev: MouseEvent): void => {
            if (!opts.enabled) return;
            const ids = this.idsForTarget(ev.target);
            if (!ids.length) {
                void this.manager.clear().then(() => this.applyDim(root, opts));
                return;
            }
            ev.stopPropagation();
            const multi = ev.ctrlKey || ev.metaKey;
            void this.manager
                .select(ids.length === 1 ? ids[0] : ids, multi)
                .then(() => this.applyDim(root, opts));
        };

        const onContext = (ev: MouseEvent): void => {
            if (!opts.contextMenu) return;
            const ids = this.idsForTarget(ev.target);
            ev.preventDefault();
            this.manager.showContextMenu(ids[0] || {}, { x: ev.clientX, y: ev.clientY });
        };

        root.addEventListener("click", onClick);
        root.addEventListener("contextmenu", onContext);
        this.applyDim(root, opts);

        return () => {
            root.removeEventListener("click", onClick);
            root.removeEventListener("contextmenu", onContext);
        };
    }

    applyDim(root: HTMLElement, opts: SelectionOptions): void {
        const ids = this.manager.getSelectionIds() as ISelectionId[];
        const hasSelection = ids.length > 0;
        const isSelected = (id: ISelectionId | undefined): boolean =>
            !!id && ids.some((s) => (s as unknown as { equals?: (o: unknown) => boolean }).equals?.(id));
        const dim = Math.max(0, Math.min(100, opts.dimUnselectedPercent)) / 100;

        root.querySelectorAll<HTMLElement>("[data-hf-row]").forEach((node) => {
            const n = parseInt(node.getAttribute("data-hf-row") || "", 10);
            const selected = isSelected(this.byIndex.get(n));
            node.style.opacity = hasSelection && !selected ? String(1 - dim) : "";
        });

        root.querySelectorAll<HTMLElement>("[data-hf-select]").forEach((node) => {
            const pairs = parseSelectSpec(node.getAttribute("data-hf-select") || "");
            const matchIds = this.rows
                .filter((r) => rowMatchesSpec(r.fields as Record<string, unknown>, pairs))
                .map((r) => r.selectionId);
            const active = matchIds.length > 0 && matchIds.every(isSelected);
            node.classList.toggle("hf-selected", hasSelection && active);
            node.style.opacity = hasSelection && !active ? String(1 - dim) : "";
        });
    }
}
