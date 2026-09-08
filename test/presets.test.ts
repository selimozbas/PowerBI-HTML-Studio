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

    it("sanitize presets keep sanitisation on; strict drops <style>", () => {
        expect(SANITIZE_PRESETS.custom).toBeNull();
        expect(SANITIZE_PRESETS.strict).toEqual({ enabled: true, allowSvg: true, allowStyleTag: false });
        expect(SANITIZE_PRESETS.standard?.allowStyleTag).toBe(true);
        expect(SANITIZE_PRESETS.trusted?.enabled).toBe(true);
    });
});
