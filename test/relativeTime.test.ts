import { describe, it, expect } from "vitest";
import { buildHelpers } from "../src/rendering/helpers";

const H = buildHelpers("en-US");
const ago = (s: number) => new Date(Date.now() - s * 1000);

// Intl.RelativeTimeFormat (numeric:"auto") phrasing is locale-data dependent,
// so assert on the unit word rather than exact "5 minutes ago" text.
describe("relativeTime (H2)", () => {
    it("5 minutes ago -> minutes, not seconds", () => {
        expect(String(H.relativeTime(ago(300)))).toMatch(/minute/);
    });
    it("3 hours ago -> hours", () => {
        expect(String(H.relativeTime(ago(3 * 3600)))).toMatch(/hour/);
    });
    it("2 days ago -> day(s)", () => {
        expect(String(H.relativeTime(ago(2 * 86400)))).toMatch(/day|yesterday/i);
    });
    it("under a minute -> second(s) / now", () => {
        expect(String(H.relativeTime(ago(10)))).toMatch(/second|now/i);
    });
    it("future date -> from now / in", () => {
        const out = String(H.relativeTime(new Date(Date.now() + 3600 * 1000)));
        expect(out).toMatch(/in |from now|hour/);
    });
    it("empty / bad input", () => {
        expect(H.relativeTime("")).toBe("");
        expect(H.relativeTime("not a date")).toBe("not a date");
    });
});
