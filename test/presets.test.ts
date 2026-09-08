import { describe, it, expect } from "vitest";
import { THEME_PRESETS, SANITIZE_PRESETS } from "../src/theme/presets";

describe("presets", () => {
    it("every theme preset scopes to .hf-content (or is empty)", () => {
        for (const [name, css] of Object.entries(THEME_PRESETS)) {
            if (name === "none") {
                expect(css).toBe("");
            } else {
                expect(css).toContain(".hf-content");
            }
        }
    });

    it("strict drops <style>; trusted turns sanitising off; each preset differs", () => {
        expect(SANITIZE_PRESETS.custom).toBeNull();
        expect(SANITIZE_PRESETS.strict).toEqual({ enabled: true, allowSvg: true, allowStyleTag: false });
        expect(SANITIZE_PRESETS.standard).toEqual({ enabled: true, allowSvg: true, allowStyleTag: true });
        expect(SANITIZE_PRESETS.trusted).toEqual({ enabled: false, allowSvg: true, allowStyleTag: true });
        // no two named presets are identical
        const seen = new Set(
            Object.entries(SANITIZE_PRESETS)
                .filter(([, v]) => v)
                .map(([, v]) => JSON.stringify(v))
        );
        expect(seen.size).toBe(3);
    });
});
