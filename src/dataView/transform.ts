import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;
import DataViewTable = powerbi.DataViewTable;
import PrimitiveValue = powerbi.PrimitiveValue;
import ISelectionId = powerbi.visuals.ISelectionId;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

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

    const columnRefs: Record<string, { table: string; column: string }> = {};
    columns.forEach((col) => {
        if (col.isMeasure || !col.roles || !(col.roles.content || col.roles.data)) return;
        const qn = String(col.queryName || "");
        const dot = qn.indexOf(".");
        if (dot > 0) {
            columnRefs[String(col.displayName)] = { table: qn.slice(0, dot), column: qn.slice(dot + 1) };
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
            value: raw[colIndex] == null ? "" : String(raw[colIndex])
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

    return { rows, fieldNames, contentColumnName, columnRefs, hasData: true };
}
