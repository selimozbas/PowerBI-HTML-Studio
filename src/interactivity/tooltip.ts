import powerbi from "powerbi-visuals-api";
import ITooltipService = powerbi.extensibility.ITooltipService;
import ISelectionId = powerbi.visuals.ISelectionId;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import { ForgeRow } from "../dataView/transform";

interface RowTooltip {
    items: VisualTooltipDataItem[];
    id: ISelectionId;
}

/**
 * Shows the Power BI default tooltip for measures placed in the
 * "Tooltips" field well when the pointer is over an element carrying
 * `data-hf-row`. Uses the host tooltip service directly - no d3.
 */
export class TooltipBinder {
    private service: ITooltipService;
    private byIndex = new Map<number, RowTooltip>();

    constructor(service: ITooltipService) {
        this.service = service;
    }

    setRows(rows: ForgeRow[]): void {
        this.byIndex.clear();
        rows.forEach((r) => {
            if (r.tooltip.length) this.byIndex.set(r.index, { items: r.tooltip, id: r.selectionId });
        });
    }

    attach(root: HTMLElement): () => void {
        if (!this.byIndex.size) return () => undefined;

        const rowAt = (target: EventTarget | null): RowTooltip | undefined => {
            const node = (target as HTMLElement)?.closest?.("[data-hf-row]") as HTMLElement | null;
            if (!node) return undefined;
            const n = parseInt(node.getAttribute("data-hf-row") || "", 10);
            return isNaN(n) ? undefined : this.byIndex.get(n);
        };

        const onMove = (ev: MouseEvent): void => {
            const row = rowAt(ev.target);
            if (!row) {
                this.service.hide({ immediately: false, isTouchEvent: false });
                return;
            }
            const args = {
                dataItems: row.items,
                identities: [row.id],
                coordinates: [ev.clientX, ev.clientY],
                isTouchEvent: false
            };
            this.service.show(args);
            this.service.move(args);
        };

        const onLeave = (): void => this.service.hide({ immediately: true, isTouchEvent: false });

        root.addEventListener("mousemove", onMove);
        root.addEventListener("mouseleave", onLeave);
        return () => {
            root.removeEventListener("mousemove", onMove);
            root.removeEventListener("mouseleave", onLeave);
            onLeave();
        };
    }
}
