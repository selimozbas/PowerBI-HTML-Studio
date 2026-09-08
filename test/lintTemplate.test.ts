import { describe, it, expect } from "vitest";
import { lintTemplate, offsetToPosition } from "../src/editor/lintTemplate";
import { COMPONENT_LIBRARY } from "../src/components/library";

describe("lintTemplate", () => {
    it("flags an unbalanced block as an error at its position", () => {
        const marks = lintTemplate("hello {{#if x}}world", ["x"], { x: 1 });
        expect(marks.some((m) => m.severity === "error")).toBe(true);
    });

    it("warns about an unknown helper", () => {
        const marks = lintTemplate("{{ frobnicate(Value) }}", ["Value"], { Value: 1 });
        const w = marks.find((m) => m.message.includes("frobnicate"));
        expect(w?.severity).toBe("warning");
    });

    it("accepts known helpers and block keywords", () => {
        const marks = lintTemplate("{{#each rows}}{{format(Value, '0.0')}}{{/each}}", ["Value"], { Value: 1 });
        expect(marks).toEqual([]);
    });

    it("does not flag built-in components as unknown partials (M18)", () => {
        const marks = lintTemplate("{{> kpi label=x value=y}}", ["x", "y"], { x: "A", y: 1 }, COMPONENT_LIBRARY);
        expect(marks.filter((m) => /partial/i.test(m.message))).toEqual([]);
    });

    it("still flags a genuinely unknown partial", () => {
        const marks = lintTemplate("{{> definitelyNotAThing}}", [], {}, COMPONENT_LIBRARY);
        expect(marks.some((m) => /partial/i.test(m.message))).toBe(true);
    });

    it("offsetToPosition maps a newline-containing string", () => {
        expect(offsetToPosition("ab\ncd", 4)).toEqual({ line: 2, column: 2 });
    });
});
