import { describe, it, expect } from "vitest";
import { markdownToHtml } from "../src/rendering/markdown";

describe("markdownToHtml", () => {
    it("renders headings and emphasis", () => {
        const html = markdownToHtml("# Title\n\nsome **bold** text");
        expect(html).toContain("<h1");
        expect(html).toContain("<strong>bold</strong>");
    });

    it("renders GFM tables", () => {
        const html = markdownToHtml("| a | b |\n| - | - |\n| 1 | 2 |");
        expect(html).toContain("<table");
        expect(html).toContain("<td>1</td>");
    });

    it("returns empty string for empty input", () => {
        expect(markdownToHtml("")).toBe("");
    });
});
