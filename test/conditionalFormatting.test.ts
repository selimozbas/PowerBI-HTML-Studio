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
});
