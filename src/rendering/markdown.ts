import { marked } from "marked";

/**
 * Markdown -> HTML. GitHub-flavoured (tables, task lists, fenced code),
 * synchronous, no code execution. Output is still passed through
 * DOMPurify by the caller before it touches the DOM.
 */
marked.setOptions({
    gfm: true,
    breaks: false
});

export function markdownToHtml(src: string): string {
    if (!src) return "";
    const out = marked.parse(src, { async: false });
    return typeof out === "string" ? out : "";
}
