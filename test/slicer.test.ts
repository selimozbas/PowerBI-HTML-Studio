import { describe, it, expect } from "vitest";
import { buildBasicFilters } from "../src/interactivity/slicer";

const refs = {
    Region: { table: "Geo", column: "Region" },
    Segment: { table: "Cust", column: "Segment" }
};

describe("buildBasicFilters", () => {
    it("builds one basic filter per mapped field, grouping values", () => {
        const f = buildBasicFilters("Region:North; Region:South", refs);
        expect(f).toHaveLength(1);
        expect(f[0].target).toEqual({ table: "Geo", column: "Region" });
        expect(f[0].operator).toBe("In");
        expect(f[0].values).toEqual(["North", "South"]);
        expect(f[0].$schema).toContain("powerbi.com/product/schema#basic");
    });

    it("emits a filter per distinct field", () => {
        const f = buildBasicFilters("Region:North; Segment:Retail", refs);
        expect(f.map((x) => x.target.column).sort()).toEqual(["Region", "Segment"]);
    });

    it("skips fields with no column reference (e.g. measures)", () => {
        expect(buildBasicFilters("Revenue:100", refs)).toEqual([]);
    });
});
