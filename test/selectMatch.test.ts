import { describe, it, expect } from "vitest";
import { parseSelectSpec, rowMatchesSpec } from "../src/interactivity/selectMatch";
import { buildHelpers } from "../src/rendering/helpers";

describe("selectMatch", () => {
    it("parses single and multi-pair specs", () => {
        expect(parseSelectSpec("Region:North")).toEqual([{ field: "Region", value: "North" }]);
        expect(parseSelectSpec("Region:North; Segment:Retail")).toEqual([
            { field: "Region", value: "North" },
            { field: "Segment", value: "Retail" }
        ]);
    });

    it("ANDs all pairs, case/space-insensitive", () => {
        const pairs = parseSelectSpec("Region: north ; Segment:Retail");
        expect(rowMatchesSpec({ Region: "North", Segment: "Retail" }, pairs)).toBe(true);
        expect(rowMatchesSpec({ Region: "North", Segment: "Wholesale" }, pairs)).toBe(false);
    });

    it("empty spec never matches", () => {
        expect(rowMatchesSpec({ Region: "North" }, parseSelectSpec(""))).toBe(false);
    });

    it("selectAttr helper builds a safe attribute string", () => {
        const H = buildHelpers();
        expect(H.selectAttr("Region", "North")).toBe('data-hf-select="Region:North"');
    });
});
