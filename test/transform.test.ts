import { describe, it, expect } from "vitest";
import { transform } from "../src/dataView/transform";

// Minimal host stub - transform only uses the selection-id builder.
const host = {
    createSelectionIdBuilder: () => ({
        withTable: () => ({ createSelectionId: () => ({}) })
    })
} as never;

function dv(columns: any[], rows: any[][]) {
    return { table: { columns, rows } } as never;
}

const col = (displayName: string, roles: Record<string, boolean>, extra: Record<string, unknown> = {}) => ({
    displayName,
    roles,
    ...extra
});

describe("transform", () => {
    it("returns EMPTY when there are no rows", () => {
        const m = transform(dv([col("A", { content: true })], []), host);
        expect(m.hasData).toBe(false);
        expect(m.rows).toEqual([]);
    });

    it("maps content + named data fields", () => {
        const m = transform(
            dv(
                [col("Name", { content: true }), col("Rev", { data: true }, { isMeasure: true })],
                [["Alpha", 10], ["Beta", 20]]
            ),
            host
        );
        expect(m.hasData).toBe(true);
        expect(m.contentColumnName).toBe("Name");
        expect(m.fieldNames).toEqual(["Rev"]);
        expect(m.rows[0].content).toBe("Alpha");
        expect(m.rows[0].fields).toMatchObject({ Name: "Alpha", Rev: 10, content: "Alpha" });
    });

    it("columnRefs: only non-measure columns with a Table.Column queryName (M25)", () => {
        const m = transform(
            dv(
                [
                    col("Region", { data: true }, { queryName: "Geo.Region" }),
                    col("Level", { data: true }, { queryName: "Date.Calendar.Month" }),
                    col("Sales", { data: true }, { queryName: "Fact.Sales", isMeasure: true })
                ],
                [["North", "Jan", 1]]
            ),
            host
        );
        expect(m.columnRefs).toEqual({ Region: { table: "Geo", column: "Region" } });
    });

    it("sorts rows by the Sort by role (M26)", () => {
        const m = transform(
            dv(
                [col("Name", { content: true }), col("Ord", { sortBy: true })],
                [["c", 3], ["a", 1], ["b", 2]]
            ),
            host
        );
        expect(m.rows.map((r) => r.content)).toEqual(["a", "b", "c"]);
    });

    it("formats tooltip values with the column format string (M27)", () => {
        const m = transform(
            dv(
                [col("Name", { content: true }), col("Amt", { tooltips: true }, { format: "#,##0" })],
                [["x", 1234.6]]
            ),
            host
        );
        expect(m.rows[0].tooltip[0]).toEqual({ displayName: "Amt", value: "1,235" });
    });
});
