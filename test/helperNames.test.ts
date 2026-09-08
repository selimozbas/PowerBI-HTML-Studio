import { describe, it, expect } from "vitest";
import { buildHelpers } from "../src/rendering/helpers";
import { HELPER_NAMES } from "../src/editor/templateLanguage";

describe("HELPER_NAMES stays in sync with the runtime registry", () => {
    it("lists exactly the helpers buildHelpers() exposes", () => {
        const runtime = Object.keys(buildHelpers()).sort();
        const declared = [...HELPER_NAMES].sort();
        expect(declared).toEqual(runtime);
    });
});
