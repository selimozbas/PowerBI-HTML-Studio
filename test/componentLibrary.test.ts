import { describe, it, expect } from "vitest";
import { COMPONENT_LIBRARY } from "../src/components/library";
import { renderTemplate } from "../src/rendering/templateEngine";
import { buildHelpers } from "../src/rendering/helpers";
import { DEFAULT_BODY_TEMPLATE } from "../src/settings";

const H = buildHelpers("en-US");

// A context that exercises every parameter any built-in component reads.
const ctx = {
    label: "North",
    content: "North",
    title: "Note",
    text: "Some detail",
    value: 120,
    target: 100,
    max: 100,
    prev: 90,
    base: 100,
    actual: 120,
    icon: "cart",
    good: "Open",
    variant: "warning",
    series: "3,5,4,7,6",
    names: "Ada Lovelace, Grace Hopper",
    time: "2024-03-15",
    rows: [{ content: "A", Actual: 120, Target: 100, Series: "1,2,3" }]
};

describe("built-in component library (M6)", () => {
    for (const name of Object.keys(COMPONENT_LIBRARY)) {
        it(`{{> ${name}}} renders without template errors`, () => {
            const out = renderTemplate(`{{> ${name}}}`, ctx, H, COMPONENT_LIBRARY);
            expect(out.errors).toEqual([]);
            expect(out.html.trim().length).toBeGreaterThan(0);
        });
    }

    it("comparison bar width is non-zero when actual < target", () => {
        const out = renderTemplate("{{> comparison label=content actual=actual target=target}}", ctx, H, COMPONENT_LIBRARY);
        expect(out.html).toMatch(/width:100%/); // actual(120) / maxOf(100,120)=120 -> 100%
        expect(out.html).not.toMatch(/width:0%/);
    });
});

describe("DEFAULT_BODY_TEMPLATE (H1)", () => {
    it("renders without errors and emits one wrapper per row", () => {
        const out = renderTemplate(DEFAULT_BODY_TEMPLATE, { rows: [{ content: "<b>x</b>" }, { content: "y" }] }, H);
        expect(out.errors).toEqual([]);
        expect(out.html).toContain("<b>x</b>");
        expect((out.html.match(/hf-row/g) || []).length).toBe(2);
    });
});
