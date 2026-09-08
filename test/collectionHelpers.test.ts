import { describe, it, expect } from "vitest";
import { buildHelpers } from "../src/rendering/helpers";
import { renderTemplate } from "../src/rendering/templateEngine";

const H = buildHelpers("en-US");
const rows = [
    { Name: "A", Region: "North", Actual: 100 },
    { Name: "B", Region: "North", Actual: 40 },
    { Name: "C", Region: "South", Actual: 60 }
];

describe("collection helpers", () => {
    it("sum / avg / min / max over a field", () => {
        expect(H.sum(rows, "Actual")).toBe(200);
        expect(H.avg(rows, "Actual")).toBeCloseTo(66.667, 2);
        expect(H.min(rows, "Actual")).toBe(40);
        expect(H.max(rows, "Actual")).toBe(100);
    });

    it("top / bottom / rank", () => {
        expect((H.top(rows, 2, "Actual") as Array<{ Name: string }>).map((r) => r.Name)).toEqual(["A", "C"]);
        expect((H.bottom(rows, 1, "Actual") as Array<{ Name: string }>)[0].Name).toBe("B");
        expect(H.rank(rows, "Actual", rows[2])).toBe(2);
    });

    it("where / pctOfTotal", () => {
        expect((H.where(rows, "Region", "north") as unknown[]).length).toBe(2);
        expect(H.pctOfTotal(60, rows, "Actual")).toBeCloseTo(30);
    });

    it("groupBy yields keyed buckets usable by #each", () => {
        const out = renderTemplate(
            "{{#each groupBy(rows, 'Region')}}{{key}}={{count}} {{/each}}",
            { rows },
            H
        );
        expect(out.html.trim()).toBe("North=2 South=1");
    });

    it("colorScale interpolates between two hex colours", () => {
        expect(H.colorScale(0, 0, 100, "#000000", "#ffffff")).toBe("#000000");
        expect(H.colorScale(100, 0, 100, "#000000", "#ffffff")).toBe("#ffffff");
        expect(H.colorScale(50, 0, 100, "#000000", "#ffffff")).toBe("#808080");
    });

    it("duration formats seconds", () => {
        expect(H.duration(90)).toBe("1:30");
        expect(H.duration(3661)).toBe("1:01:01");
    });

    it("composes: subtotal row via sum inside a template", () => {
        const out = renderTemplate(
            "{{#each rows}}{{Name}}:{{Actual}};{{/each}}Total:{{sum(rows,'Actual')}}",
            { rows },
            H
        );
        expect(out.html).toBe("A:100;B:40;C:60;Total:200");
    });
});
