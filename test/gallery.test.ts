import { describe, it, expect } from "vitest";
import { TEMPLATE_GALLERY } from "../src/editor/gallery";
import { renderTemplate } from "../src/rendering/templateEngine";
import { buildHelpers } from "../src/rendering/helpers";

const helpers = buildHelpers();
const sampleView = {
    rows: [
        { content: "Alpha", Actual: 120, Target: 100, "@index": 0 },
        { content: "Beta", Actual: 60, Target: 100, "@index": 1 }
    ],
    rowCount: 2
};

describe("template gallery", () => {
    for (const sample of TEMPLATE_GALLERY) {
        it(`"${sample.name}" renders without template errors`, () => {
            const res = renderTemplate(sample.template, sampleView, helpers);
            expect(res.errors).toEqual([]);
            expect(res.html.length).toBeGreaterThan(0);
        });
    }
});
