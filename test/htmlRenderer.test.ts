import { describe, it, expect } from "vitest";
import { renderContent } from "../src/rendering/htmlRenderer";
import type { ForgeModel } from "../src/dataView/transform";

function model(n: number): ForgeModel {
    return {
        hasData: true,
        fieldNames: ["Actual"],
        contentColumnName: "Name",
        rows: Array.from({ length: n }, (_, i) => ({
            content: `Row ${i}`,
            fields: { content: `Row ${i}`, Actual: i },
            tooltip: [],
            selectionId: {} as never,
            index: i
        }))
    };
}

const base = {
    contentSource: "value" as const,
    renderMode: "row" as const,
    markdown: false,
    bodyTemplate: "",
    rowTemplate: "",
    separator: "",
    noDataMessage: "",
    rowLimit: 0,
    partials: {},
    conditionalFormatting: { enabled: false, rulesRaw: "" },
    locale: "en-US"
};

describe("renderContent", () => {
    it("returns a per-row array for row-mapped value mode", () => {
        const out = renderContent({ ...base, model: model(3) });
        expect(out.rowMapped).toBe(true);
        expect(out.rows).toHaveLength(3);
        expect(out.rows?.[1].html).toContain('data-hf-row="1"');
    });

    it("returns a per-row array for row-mapped template mode", () => {
        const out = renderContent({ ...base, model: model(2), contentSource: "template", rowTemplate: "<i>{{content}}</i>" });
        expect(out.rows).toHaveLength(2);
        expect(out.rows?.[0].html).toContain("<i>Row 0</i>");
    });

    it("caps rows with rowLimit and appends a note", () => {
        const out = renderContent({ ...base, model: model(10), rowLimit: 4 });
        expect(out.rows).toHaveLength(4);
        expect(out.html).toContain("6 more rows");
    });

    it("aggregate value mode has no rows array", () => {
        const out = renderContent({ ...base, model: model(3), renderMode: "aggregate", separator: "|" });
        expect(out.rowMapped).toBe(false);
        expect(out.rows).toBeUndefined();
        expect(out.html).toBe("Row 0|Row 1|Row 2");
    });
});
