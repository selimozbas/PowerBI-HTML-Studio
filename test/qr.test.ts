import { describe, it, expect } from "vitest";
import { buildHelpers } from "../src/rendering/helpers";

const H = buildHelpers();

describe("qr helper", () => {
    it("returns an inline sized SVG QR", () => {
        const out = String(H.qr("https://example.com", 120));
        expect(out).toContain("<svg");
        expect(out).toContain("width:120px");
        expect(out).toContain("</svg>");
    });

    it("returns empty string for empty input", () => {
        expect(H.qr("", 96)).toBe("");
    });
});
