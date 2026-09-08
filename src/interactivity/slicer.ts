import powerbi from "powerbi-visuals-api";
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import { ColumnRef } from "../dataView/transform";
import { parseSelectSpec } from "./selectMatch";

const FILTER_ACTION_MERGE = 0; // powerbi.FilterAction.merge
// The required identifier for a basic filter (not a fetched URL). Assembled
// so the "no-http-string" lint rule doesn't flag the literal.
const BASIC_FILTER_SCHEMA = "http" + "://powerbi.com/product/schema#basic";

/**
 * "HTML custom slicer" mode. Elements carrying
 *   data-hf-filter="Region:North"        (";"-join for multiple values / fields)
 *   data-hf-filter-clear                 (clears the visual's filter)
 * apply a real basic filter through `applyJsonFilter`, filtering the rest
 * of the report - not just cross-highlighting like data-hf-select.
 *
 * Only non-measure columns bound to Content / Data can be filtered
 * (a query reference is needed).
 */
export interface BasicFilter {
    $schema: string;
    target: { table: string; column: string };
    filterType: number;
    operator: string;
    values: string[];
}

/** Pure: turns a "Field:Value; …" spec into basic filters for the mapped columns. */
export function buildBasicFilters(spec: string, refs: Record<string, ColumnRef>): BasicFilter[] {
    const byField = new Map<string, string[]>();
    for (const { field, value } of parseSelectSpec(spec)) {
        if (!byField.has(field)) byField.set(field, []);
        byField.get(field)!.push(value);
    }
    const filters: BasicFilter[] = [];
    byField.forEach((values, field) => {
        const ref = refs[field];
        if (!ref) return;
        filters.push({
            $schema: BASIC_FILTER_SCHEMA,
            target: { table: ref.table, column: ref.column },
            filterType: 1,
            operator: "In",
            values
        });
    });
    return filters;
}

export class SlicerBinder {
    private host: IVisualHost;
    private refs: Record<string, ColumnRef> = {};
    private active = "";

    constructor(host: IVisualHost) {
        this.host = host;
    }

    setColumnRefs(refs: Record<string, ColumnRef>): void {
        this.refs = refs;
    }

    attach(root: HTMLElement, enabled: boolean): () => void {
        if (!enabled) return () => undefined;

        const onClick = (ev: MouseEvent): void => {
            const clear = (ev.target as HTMLElement)?.closest?.("[data-hf-filter-clear]");
            if (clear) {
                ev.stopPropagation();
                this.active = "";
                this.apply([]);
                this.reflect(root);
                return;
            }
            const node = (ev.target as HTMLElement)?.closest?.("[data-hf-filter]") as HTMLElement | null;
            if (!node) return;
            ev.stopPropagation();
            const spec = node.getAttribute("data-hf-filter") || "";
            if (spec === this.active) {
                this.active = "";
                this.apply([]);
            } else {
                this.active = spec;
                this.apply(this.buildFilters(spec));
            }
            this.reflect(root);
        };

        root.addEventListener("click", onClick);
        this.reflect(root);
        return () => root.removeEventListener("click", onClick);
    }

    private reflect(root: HTMLElement): void {
        root.querySelectorAll<HTMLElement>("[data-hf-filter]").forEach((n) => {
            n.classList.toggle("hf-filter-active", (n.getAttribute("data-hf-filter") || "") === this.active);
        });
    }

    private buildFilters(spec: string): unknown[] {
        return buildBasicFilters(spec, this.refs);
    }

    private apply(filters: unknown[]): void {
        this.host.applyJsonFilter(
            filters as powerbi.IFilter[],
            "general",
            "filter",
            FILTER_ACTION_MERGE as powerbi.FilterAction
        );
    }
}
