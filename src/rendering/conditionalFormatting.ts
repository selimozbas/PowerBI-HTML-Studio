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
    if (isNaN(value)) return "";
    const clamp = (t: number) => Math.max(0, Math.min(1, t));
    if (scale.midColor !== undefined && scale.mid !== undefined) {
        if (value <= scale.mid) {
            return mix(scale.minColor, scale.midColor, clamp((value - scale.min) / (scale.mid - scale.min || 1)));
        }
        return mix(scale.midColor, scale.maxColor, clamp((value - scale.mid) / (scale.max - scale.mid || 1)));
    }
    return mix(scale.minColor, scale.maxColor, clamp((value - scale.min) / (scale.max - scale.min || 1)));
}

function mix(from: string, to: string, t: number): string {
    const a = hexToRgb(from);
    const b = hexToRgb(to);
    const c = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t);
    return `#${[c(0), c(1), c(2)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex: string): [number, number, number] {
    const h = String(hex || "").replace("#", "");
    const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
    const n = parseInt(full || "000000", 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
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
