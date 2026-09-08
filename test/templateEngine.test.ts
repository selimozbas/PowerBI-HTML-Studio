import { describe, it, expect } from "vitest";
import { renderTemplate } from "../src/rendering/templateEngine";
import { buildHelpers } from "../src/rendering/helpers";

const H = buildHelpers("en-US");

describe("renderTemplate", () => {
    it("interpolates and escapes by default", () => {
        const r = renderTemplate("<p>{{name}}</p>", { name: "<b>x</b>" });
        expect(r.html).toBe("<p>&lt;b&gt;x&lt;/b&gt;</p>");
    });

    it("supports raw output with triple braces", () => {
        const r = renderTemplate("{{{html}}}", { html: "<i>ok</i>" });
        expect(r.html).toBe("<i>ok</i>");
    });

    it("iterates rows with #each and @index", () => {
        const r = renderTemplate("{{#each rows}}{{@index}}:{{v}};{{/each}}", { rows: [{ v: "a" }, { v: "b" }] });
        expect(r.html).toBe("0:a;1:b;");
    });

    it("evaluates #if comparisons", () => {
        const r = renderTemplate("{{#if score >= 50}}pass{{else}}fail{{/if}}", { score: 42 });
        expect(r.html).toBe("fail");
    });

    it("runs helpers including nested calls", () => {
        const r = renderTemplate("{{format(add(a, b), '0.0')}}", { a: 1.2, b: 2.1 }, H);
        expect(r.html).toBe("3.3");
    });

    it("reports unbalanced blocks as errors, not throws", () => {
        const r = renderTemplate("{{#if x}}oops", { x: 1 });
        expect(r.html).toBe("");
        expect(r.errors.length).toBeGreaterThan(0);
    });

    it("emits an inline svg bar from a helper", () => {
        const r = renderTemplate("{{{bar(actual, target)}}}", { actual: 50, target: 100 }, H);
        expect(r.html).toContain("<svg");
        expect(r.html).toContain("width=\"50.0\"");
    });

    it("@index is the loop position even when the row has an @index field (M1)", () => {
        const rows = [{ "@index": 5, v: "a" }, { "@index": 2, v: "b" }];
        const r = renderTemplate("{{#each rows}}{{@index}}:{{v}} {{/each}}", { rows });
        expect(r.html.trim()).toBe("0:a 1:b");
    });

    it("@key is available when iterating an object (M2)", () => {
        const r = renderTemplate("{{#each o}}{{@key}}={{this}} {{/each}}", { o: { a: 1, b: 2 } });
        expect(r.html.trim()).toBe("a=1 b=2");
    });

    it("partial params tolerate spaces around = (M3)", () => {
        const r = renderTemplate('{{> p a = x  b=y}}', { x: "1", y: "2" }, H, { p: "{{a}}-{{b}}" });
        expect(r.errors).toEqual([]);
        expect(r.html).toBe("1-2");
    });

    it("supports unary ! and flags stray {{else}}", () => {
        expect(renderTemplate("{{#if !ok}}no{{/if}}", { ok: false }).html).toBe("no");
        const bad = renderTemplate("a {{else}} b", {});
        expect(bad.errors.length).toBeGreaterThan(0);
    });
});
