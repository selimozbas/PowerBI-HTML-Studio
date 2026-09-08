import { describe, it, expect } from "vitest";
import { buildHelpers } from "../src/rendering/helpers";
import { buildFontCss } from "../src/theme/fonts";

describe("locale helpers", () => {
    const en = buildHelpers("en-US");
    const de = buildHelpers("de-DE");

    it("number() respects locale grouping", () => {
        expect(en.number(1234567.5, 1)).toBe("1,234,567.5");
        expect(de.number(1234567.5, 1)).toBe("1.234.567,5");
    });

    it("percent() scales and formats", () => {
        expect(en.percent(0.1234, 1)).toBe("12.3%");
    });

    it("currency() uses the given ISO code", () => {
        const out = String(en.currency(1000, "EUR"));
        expect(out).toContain("1,000");
        expect(out).toMatch(/€|EUR/);
    });

    it("date() formats a parseable date, passes through junk", () => {
        expect(en.date("2024-01-05", "short")).toMatch(/1\/5\/(20)?24|1\/5\/2024/);
        expect(en.date("not a date", "short")).toBe("not a date");
    });
});

describe("buildFontCss", () => {
    it("emits a Google Fonts @import with weights", () => {
        const css = buildFontCss("Roboto:400;700, Open Sans", "");
        expect(css).toContain("fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Open+Sans");
        expect(css).toContain("display=swap");
    });

    it("passes @font-face blocks through", () => {
        const face = "@font-face{font-family:'X';src:url(data:font/woff2;base64,AA)}";
        expect(buildFontCss("", face)).toBe(face);
    });

    it("returns empty string when nothing configured", () => {
        expect(buildFontCss("", "")).toBe("");
    });
});
