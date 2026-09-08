import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;
import DataViewTable = powerbi.DataViewTable;
import PrimitiveValue = powerbi.PrimitiveValue;
import ISelectionId = powerbi.visuals.ISelectionId;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import { formatValue } from "../rendering/format";

export interface ForgeRow {
    /** Value of the field mapped to the "content" role for this row. */
    content: string;
    /** All named "data" fields plus content, keyed by column display name. */
    fields: Record<string, PrimitiveValue>;
    /** Measures dropped in the "tooltips" field well, formatted for display. */
    tooltip: VisualTooltipDataItem[];
    selectionId: ISelectionId;
    index: number;
}

export interface ColumnRef {
    table: string;
    column: string;
}

export interface ForgeModel {
    rows: ForgeRow[];
    /** Display names of the named "data" fields, in field-well order. */
    fieldNames: string[];
    contentColumnName: string | null;
    /** display name -> { table, column } for non-measure columns, for applyJsonFilter. */
    columnRefs: Record<string, ColumnRef>;
    hasData: boolean;
}

const EMPTY: ForgeModel = { rows: [], fieldNames: [], contentColumnName: null, columnRefs: {}, hasData: false };

export function transform(dataView: DataView | undefined, host: IVisualHost): ForgeModel {
    const table: DataViewTable | undefined = dataView && dataView.table;
    if (!table || !table.columns || !table.rows || table.rows.length === 0) {
        return EMPTY;
    }

    const columns = table.columns;
    const contentColIdx = columns.findIndex((c) => c.roles && c.roles.content);
    const dataColIdxs = columns
        .map((c, i) => ({ c, i }))
        .filter((x) => x.c.roles && x.c.roles.data)
        .map((x) => x.i);
    const tooltipColIdxs = columns
        .map((c, i) => ({ c, i }))
        .filter((x) => x.c.roles && x.c.roles.tooltips)
        .map((x) => x.i);

    const contentColumnName = contentColIdx >= 0 ? String(columns[contentColIdx].displayName) : null;
    const fieldNames = dataColIdxs.map((i) => String(columns[i].displayName));
    const sortColIdxs = columns
        .map((c, i) => ({ c, i }))
        .filter((x) => x.c.roles && x.c.roles.sortBy)
        .map((x) => x.i);

    const columnRefs: Record<string, { table: string; column: string }> = {};
    columns.forEach((col) => {
        if (col.isMeasure || !col.roles || !(col.roles.content || col.roles.data)) return;
        // queryName is "Table.Column"; a hierarchy level ("Date.Calendar.Month")
        // isn't a valid basic-filter target, and a column name never contains a
        // dot, so split on the last dot and reject the 3+ segment case.
        const qn = String(col.queryName || "");
        const parts = qn.split(".");
        if (parts.length === 2 && parts[0] && parts[1]) {
            columnRefs[String(col.displayName)] = { table: parts[0], column: parts[1] };
        }
    });

    const rows: ForgeRow[] = table.rows.map((raw, rowIndex) => {
        const fields: Record<string, PrimitiveValue> = {};
        columns.forEach((col, colIndex) => {
            if (col.roles && (col.roles.content || col.roles.data)) {
                fields[String(col.displayName)] = raw[colIndex];
            }
        });
        const contentValue = contentColIdx >= 0 ? raw[contentColIdx] : "";
        if (contentColumnName) fields["content"] = contentValue as PrimitiveValue;

        const tooltip: VisualTooltipDataItem[] = tooltipColIdxs.map((colIndex) => ({
            displayName: String(columns[colIndex].displayName),
            value: formatCell(raw[colIndex], columns[colIndex].format)
        }));

        const selectionId = host
            .createSelectionIdBuilder()
            .withTable(table, rowIndex)
            .createSelectionId();

        return {
            content: contentValue == null ? "" : String(contentValue),
            fields,
            tooltip,
            selectionId,
            index: rowIndex
        };
    });

    // The "Sort by" well is inert unless we sort ourselves - Power BI does not
    // order a table dataView by an arbitrary field well.
    if (sortColIdxs.length) {
        const tableRows = table.rows;
        rows.sort((a, b) => {
            for (const ci of sortColIdxs) {
                const av = tableRows[a.index][ci];
                const bv = tableRows[b.index][ci];
                if (av === bv) continue;
                const an = typeof av === "number" ? av : NaN;
                const bn = typeof bv === "number" ? bv : NaN;
                if (!isNaN(an) && !isNaN(bn)) return an - bn;
                return String(av ?? "").localeCompare(String(bv ?? ""), "en");
            }
            return 0;
        });
    }

    return { rows, fieldNames, contentColumnName, columnRefs, hasData: true };
}

function formatCell(v: PrimitiveValue, format: string | undefined): string {
    if (v == null) return "";
    if (typeof v === "number" && format) return formatValue(v, format);
    if (v instanceof Date) return format ? formatValue(v, format) : v.toLocaleString();
    return String(v);
}
