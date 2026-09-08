import { renderTemplate } from "../rendering/templateEngine";
import { HELPER_NAMES } from "./templateLanguage";

/**
 * Lightweight template linter for the Monaco editor: parse / render errors
 * plus unknown-helper warnings. Offsets are into the raw template string;
 * the dialog turns them into Monaco markers.
 */
export interface LintMark {
    offset: number;
    length: number;
    message: string;
    severity: "error" | "warning";
}

const BLOCK_WORDS = new Set(["if", "unless", "each", "else", "switch", "case", "default"]);

export function lintTemplate(
    template: string,
    _fieldNames: string[],
    sampleRow: Record<string, unknown>,
    partials: Record<string, string> = {}
): LintMark[] {
    const marks: LintMark[] = [];
    if (!template.trim()) return marks;

    const res = renderTemplate(template, { rows: [sampleRow], ...sampleRow }, {}, partials);
    for (const err of res.errors) {
        marks.push({ ...locate(template, err.message, err.snippet || ""), message: err.message, severity: "error" });
    }

    const known = new Set(HELPER_NAMES);
    const MOUSTACHE = /\{\{\{?([^]*?)\}?\}\}/g;
    template.replace(MOUSTACHE, (match: string, body: string, offset: number) => {
        const bodyStart = offset + match.indexOf(body);
        const CALL = /([A-Za-z_$][\w$]*)\s*\(/g;
        body.replace(CALL, (_c: string, name: string, cOffset: number) => {
            if (!known.has(name) && !BLOCK_WORDS.has(name)) {
                marks.push({
                    offset: bodyStart + cOffset,
                    length: name.length,
                    message: `Unknown helper "${name}"`,
                    severity: "warning"
                });
            }
            return _c;
        });
        return match;
    });

    return marks;
}

/** Best-effort mapping of a parse-error message to a span in the template. */
function locate(template: string, message: string, snippet: string): { offset: number; length: number } {
    const missing = message.match(/Missing \{\{\/(\w+)\}\}/);
    if (missing) {
        const open = template.indexOf(`{{#${missing[1]}`);
        if (open >= 0) return { offset: open, length: missing[1].length + 3 };
    }
    const unexpected = message.match(/Unexpected \{\{([^}]+)\}\}/);
    if (unexpected) {
        const at = template.indexOf(`{{${unexpected[1]}}}`);
        if (at >= 0) return { offset: at, length: unexpected[1].length + 4 };
    }
    const needle = snippet.trim().slice(0, 40);
    const idx = needle ? template.indexOf(needle) : -1;
    return idx >= 0 ? { offset: idx, length: Math.min(needle.length, 40) } : { offset: 0, length: 1 };
}

export function offsetToPosition(text: string, offset: number): { line: number; column: number } {
    let line = 1;
    let last = 0;
    for (let i = 0; i < offset && i < text.length; i++) {
        if (text[i] === "\n") {
            line++;
            last = i + 1;
        }
    }
    return { line, column: Math.max(1, offset - last + 1) };
}
