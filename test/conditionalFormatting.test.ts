import { describe, it, expect } from "vitest";
import { parseRules, evaluateRules } from "../src/rendering/conditionalFormatting";
import { formatValue } from "../src/rendering/format";

describe("conditionalFormatting", () => {
    it("parses a JSON rule array", () => {
        const { rules, error } = parseRules('[{"field":"Rev","op":">","value":10,"style":{"color":"#0a0"}}]');
        expect(error).toBeUndefined();
        expect(rules).toHaveLength(1);
    });

    it("returns a parse error for bad JSON", () => {
        const { error } = parseRules("{not json");
        expect(error).toBeTruthy();
    });

    it("applies matching rule style and class", () => {
        const { rules } = parseRules(
            '[{"field":"Rev","op":">","value":10,"style":{"background":"#fee"},"class":"hot"}]'
        );
        const res = evaluateRules(rules, { Rev: 25 });
        expect(res.style).toContain("background-color:#fee");
        expect(res.classes).toContain("hot");
    });

    it("applies a two-stop colour scale to the background", () => {
        const { rules } = parseRules(
            '[{"scale":{"field":"Score","min":0,"max":100,"minColor":"#000000","maxColor":"#ffffff"}}]'
        );
        expect(evaluateRules(rules, { Score: 0 }).style).toBe("background-color:#000000");
        expect(evaluateRules(rules, { Score: 50 }).style).toBe("background-color:#808080");
        expect(evaluateRules(rules, { Score: 100 }).style).toBe("background-color:#ffffff");
    });

    it("colour scale can target text and supports a mid stop", () => {
        const { rules } = parseRules(
            '[{"scale":{"field":"n","min":0,"mid":50,"max":100,"minColor":"#ff0000","midColor":"#ffffff","maxColor":"#00ff00"},"target":"color"}]'
        );
        expect(evaluateRules(rules, { n: 50 }).style).toBe("color:#ffffff");
    });

    it("supports between and contains operators", () => {
        const { rules } = parseRules(
            '[{"field":"n","op":"between","value":1,"value2":5,"style":{"color":"red"}},' +
            '{"field":"s","op":"contains","value":" late","style":{"background":"orange"}}]'
        );
        const hit = evaluateRules(rules, { n: 3, s: "Very Late" }).style;
        expect(hit).toContain("color:red");
        expect(hit).toContain("background-color:orange");
        expect(evaluateRules(rules, { n: 9, s: "on time" }).style).toBe("");
    });
});

describe("formatValue", () => {
    it("formats percentages", () => {
        expect(formatValue(0.1234, "0.0%")).toBe("12.3%");
    });
    it("formats grouped currency", () => {
        expect(formatValue(12345.6, "$#,##0.00")).toBe("$12,345.60");
    });
    it("formats dates", () => {
        expect(formatValue(new Date(2024, 0, 5), "yyyy-MM-dd")).toBe("2024-01-05");
    });

    it("integer patterns keep 0 decimals (H3)", () => {
        expect(formatValue(1234.567, "#,##0")).toBe("1,235");
        expect(formatValue(5.126, "0")).toBe("5");
        expect(formatValue(1234.5, "#,##0.0")).toBe("1,234.5");
    });

    it("ISO date strings do not shift a day (H4)", () => {
        expect(formatValue("2024-03-15", "yyyy-MM-dd")).toBe("2024-03-15");
        expect(formatValue("2024-03-15", "dd/MM/yyyy")).toBe("15/03/2024");
    });

    it("a bare year number is not misread as a date", () => {
        expect(formatValue(2024, "yyyy")).toBe("2024");
    });

    it("accounting negatives and non-numeric decimals", () => {
        expect(formatValue("(1,234)", "#,##0")).toBe("-1,234");
    });
});
