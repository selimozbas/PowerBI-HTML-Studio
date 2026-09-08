import { describe, it, expect } from "vitest";
import { renderTemplate } from "../src/rendering/templateEngine";
import { buildHelpers } from "../src/rendering/helpers";
import { COMPONENT_LIBRARY, parseUserPartials } from "../src/components/library";

const H = buildHelpers("en-US");

describe("partials", () => {
    it("renders a named partial with hash params", () => {
        const partials = { badge: '<span class="{{cls}}">{{text}}</span>' };
        const out = renderTemplate('{{> badge text="Hi" cls="b"}}', {}, H, partials);
        expect(out.errors).toEqual([]);
        expect(out.html).toBe('<span class="b">Hi</span>');
    });

    it("param expressions are evaluated against the current context", () => {
        const partials = { p: "{{x}}-{{y}}" };
        const out = renderTemplate('{{> p x=Name y=upper(Name)}}', { Name: "abc" }, H, partials);
        expect(out.html).toBe("abc-ABC");
    });

    it("reports an unknown partial without throwing", () => {
        const out = renderTemplate("{{> nope}}", {}, H, {});
        expect(out.html).toBe("");
        expect(out.errors[0].message).toContain("Unknown partial");
    });

    it("built-in kpi component renders", () => {
        const out = renderTemplate("{{> kpi label=content value=Actual target=Target}}", { content: "Sales", Actual: 120, Target: 100 }, H, COMPONENT_LIBRARY);
        expect(out.errors).toEqual([]);
        expect(out.html).toContain("Sales");
        expect(out.html).toContain("120");
        expect(out.html).toContain("bg-success");
    });

    it("parseUserPartials splits @partial blocks; user overrides built-ins", () => {
        const map = parseUserPartials("@partial kpi\n<b>{{label}}</b>\n@partial x\n<i>{{y}}</i>");
        expect(map.kpi).toBe("<b>{{label}}</b>");
        expect(map.x).toBe("<i>{{y}}</i>");
    });

    it("guards against runaway recursion", () => {
        const out = renderTemplate("{{> loop}}", {}, H, { loop: "{{> loop}}" });
        expect(out.errors.some((e) => /recursion/i.test(e.message))).toBe(true);
    });
});
