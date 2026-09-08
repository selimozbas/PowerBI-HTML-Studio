/**
 * Rule-based conditional formatting evaluated in the visual (no DAX).
 *
 * Power BI's native "fx" conditional formatting is unavailable to
 * table-mapped custom visuals, so rules are authored as JSON here:
 *
 *   [
 *     { "field": "Revenue", "op": ">", "value": 1000,
 *       "style": { "color": "#0a0", "fontWeight": "bold" }, "class": "hf-good" },
 *     { "field": "Status", "op": "==", "value": "Late",
 *       "style": { "background": "#fde7e9" } },
 *     { "scale": { "field": "Score", "min": 0, "max": 100,
 *                  "minColor": "#fde7e9", "maxColor": "#d1e7dd" }, "target": "bg" }
 *   ]
 *
 * A DAX colour measure dropped in the Data well is simpler still - it is
 * available in templates as `{{ColourMeasure}}` (and as `{{cfBg}}` /
 * `{{cfColor}}` when named like "…color" / "…background").
 *
 * evaluateRules returns an inline `style` string + class names for a row.
 */

import { parseNumeric, toDate, hexToRgb } from "./numeric";

export interface CfScale {
    field?: string;
    min: number;
    mid?: number;
    max: number;
    minColor: string;
    midColor?: string;
    maxColor: string;
}

export interface CfRule {
    field?: string;
    op?: ">" | ">=" | "<" | "<=" | "==" | "!=" | "contains" | "between";
    value?: unknown;
    value2?: unknown;
    style?: Record<string, string>;
    "class"?: string;
    /** colour-scale rule; `target` chooses background (default) or text */
    scale?: CfScale;
    target?: "bg" | "color";
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
        if (rule.scale) {
            const field = rule.scale.field || rule.field;
            const color = scaleColor(rule.scale, numericish(field ? row[field] : NaN));
            if (color) styleObj[rule.target === "color" ? "color" : "background-color"] = color;
            continue;
        }
        if (rule.field === undefined || !matches(rule, row[rule.field])) continue;
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

function scaleColor(scale: CfScale, value: number): string {
    const min = Number(scale.min);
    const max = Number(scale.max);
    if (isNaN(value) || isNaN(min) || isNaN(max)) return "";
    const clamp = (t: number) => (isNaN(t) ? 0 : Math.max(0, Math.min(1, t)));
    if (scale.midColor !== undefined && scale.mid !== undefined) {
        const mid = Number(scale.mid);
        if (value <= mid) {
            return mix(scale.minColor, scale.midColor, clamp((value - min) / (mid - min || 1)));
        }
        return mix(scale.midColor, scale.maxColor, clamp((value - mid) / (max - mid || 1)));
    }
    return mix(scale.minColor, scale.maxColor, clamp((value - min) / (max - min || 1)));
}

function mix(from: string, to: string, t: number): string {
    const a = hexToRgb(from);
    const b = hexToRgb(to);
    if (!a || !b) return "";
    const c = (i: number) => Math.max(0, Math.min(255, Math.round(a[i] + (b[i] - a[i]) * t)));
    return `#${[c(0), c(1), c(2)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function matches(rule: CfRule, cell: unknown): boolean {
    let a = numericish(cell);
    let b = numericish(rule.value);
    // fall back to date comparison when both sides are dates
    if ((isNaN(a) || isNaN(b)) && /[<>]/.test(rule.op || "")) {
        const da = toDate(cell);
        const db = toDate(rule.value);
        if (da && db) { a = da.getTime(); b = db.getTime(); }
    }
    switch (rule.op) {
        case ">": return a > b;
        case ">=": return a >= b;
        case "<": return a < b;
        case "<=": return a <= b;
        case "==": return looseEq(cell, rule.value);
        case "!=": return !looseEq(cell, rule.value);
        case "contains": {
            const needle = String(rule.value ?? "");
            if (needle === "") return false; // a rule with no `value` must not match every row
            return String(cell ?? "").toLowerCase().indexOf(needle.toLowerCase()) !== -1;
        }
        case "between": {
            const b2 = numericish(rule.value2);
            if (isNaN(a) || isNaN(b) || isNaN(b2)) return false;
            return a >= Math.min(b, b2) && a <= Math.max(b, b2);
        }
        default: return false;
    }
}

function numericish(v: unknown): number {
    return parseNumeric(v);
}

function looseEq(a: unknown, b: unknown): boolean {
    return String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();
}
