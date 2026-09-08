/**
 * Rule-based conditional formatting evaluated in the visual (no DAX).
 *
 * Rules are authored as JSON in the formatting pane:
 *   [
 *     { "field": "Revenue", "op": ">", "value": 1000,
 *       "style": { "color": "#0a0", "fontWeight": "bold" }, "class": "hf-good" },
 *     { "field": "Status", "op": "==", "value": "Late",
 *       "style": { "background": "#fde7e9" } }
 *   ]
 *
 * The engine returns an inline `style="..."` string and a list of class
 * names for a given row, which the renderer applies to the row wrapper.
 */

export interface CfRule {
    field: string;
    op: ">" | ">=" | "<" | "<=" | "==" | "!=" | "contains" | "between";
    value: unknown;
    value2?: unknown;
    style?: Record<string, string>;
    "class"?: string;
}

export interface CfResult { style: string; classes: string[]; }

const STYLE_KEYS: Record<string, string> = {
    color: "color",
    background: "background-color",
    backgroundColor: "background-color",
    fontWeight: "font-weight",
    fontStyle: "font-style",
    border: "border",
    borderLeft: "border-left",
    textAlign: "text-align",
    opacity: "opacity"
};

export function parseRules(raw: string): { rules: CfRule[]; error?: string } {
    if (!raw || !raw.trim()) return { rules: [] };
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return { rules: [], error: "Rules must be a JSON array" };
        return { rules: parsed as CfRule[] };
    } catch (e) {
        return { rules: [], error: (e as Error).message };
    }
}

export function evaluateRules(rules: CfRule[], row: Record<string, unknown>): CfResult {
    const styleObj: Record<string, string> = {};
    const classes: string[] = [];

    for (const rule of rules) {
        if (!matches(rule, row[rule.field])) continue;
        if (rule.class) classes.push(rule.class);
        if (rule.style) {
            for (const k of Object.keys(rule.style)) {
                styleObj[STYLE_KEYS[k] || k] = rule.style[k];
            }
        }
    }

    const style = Object.keys(styleObj)
        .map((k) => `${k}:${styleObj[k]}`)
        .join(";");
    return { style, classes };
}

function matches(rule: CfRule, cell: unknown): boolean {
    const a = numericish(cell);
    const b = numericish(rule.value);
    switch (rule.op) {
        case ">": return a > b;
        case ">=": return a >= b;
        case "<": return a < b;
        case "<=": return a <= b;
        case "==": return looseEq(cell, rule.value);
        case "!=": return !looseEq(cell, rule.value);
        case "contains": return String(cell ?? "").toLowerCase().indexOf(String(rule.value ?? "").toLowerCase()) !== -1;
        case "between": return a >= b && a <= numericish(rule.value2);
        default: return false;
    }
}

function numericish(v: unknown): number {
    if (typeof v === "number") return v;
    const n = parseFloat(String(v ?? "").replace(/[^0-9.\-eE]/g, ""));
    return isNaN(n) ? NaN : n;
}

function looseEq(a: unknown, b: unknown): boolean {
    return String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();
}
