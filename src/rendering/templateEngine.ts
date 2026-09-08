/**
 * A small, CSP-safe template engine (Handlebars-ish subset).
 *
 * Expressions are parsed into an AST and interpreted - no dynamic code
 * generation of any kind. This keeps the visual runnable inside the
 * Power BI sandbox and clean for Microsoft certification.
 *
 * Partials: `{{> name key=expr}}` renders `partials[name]` (built-in
 * component library + user-defined) with a context = the flattened
 * current scope chain merged with the evaluated hash params. Recursion is
 * capped at depth 20.
 *
 * Supported syntax:
 *   {{ path.to.value }}            HTML-escaped output
 *   {{{ path.to.value }}}          raw output
 *   {{ helper(a, b) }}            helper call (nesting allowed)
 *   {{ a > b }}                   comparison => "true" / ""
 *   {{#if expr}} ... {{else}} ... {{/if}}
 *   {{#unless expr}} ... {{/unless}}
 *   {{#each items}} ... {{this}} {{@index}} ... {{/each}}
 *   {{> partialName key=expr key2=expr}}   render a named partial
 *
 * Paths resolve against a context stack; `this`, `@index`, `@first`,
 * `@last`, `@key` are available inside {{#each}}.
 */

export type Helper = (...args: unknown[]) => unknown;
export interface TemplateError { message: string; snippet: string; }

interface Ctx {
    stack: unknown[];
    helpers: Record<string, Helper>;
    partials: Record<string, string>;
    depth: number;
    errors: TemplateError[];
}

type Node =
    | { t: "text"; v: string }
    | { t: "interp"; expr: string; raw: boolean }
    | { t: "block"; kind: "if" | "unless" | "each"; expr: string; body: Node[]; alt: Node[] }
    | { t: "partial"; name: string; params: Array<[string, string]> };

const TOKEN = /\{\{\{([^]*?)\}\}\}|\{\{([^]*?)\}\}/g;

export function renderTemplate(
    template: string,
    data: unknown,
    helpers: Record<string, Helper> = {},
    partials: Record<string, string> = {}
): { html: string; errors: TemplateError[] } {
    const ctx: Ctx = { stack: [data], helpers, partials, depth: 0, errors: [] };
    let ast: Node[];
    try {
        ast = parse(template);
    } catch (e) {
        return { html: "", errors: [{ message: (e as Error).message, snippet: template.slice(0, 120) }] };
    }
    return { html: renderNodes(ast, ctx), errors: ctx.errors };
}

/* ----------------------------- parser ----------------------------------- */

function tokenize(input: string): Array<{ text?: string; tag?: string; raw?: boolean }> {
    const flat: Array<{ text?: string; tag?: string; raw?: boolean }> = [];
    let last = 0;
    input.replace(TOKEN, (match: string, tripleBody: string, doubleBody: string, offset: number) => {
        if (offset > last) flat.push({ text: input.slice(last, offset) });
        if (tripleBody !== undefined) flat.push({ tag: tripleBody.trim(), raw: true });
        else flat.push({ tag: doubleBody.trim(), raw: false });
        last = offset + match.length;
        return match;
    });
    if (last < input.length) flat.push({ text: input.slice(last) });
    return flat;
}

function parse(input: string): Node[] {
    const flat = tokenize(input);
    let i = 0;

    function walk(stopper?: string): Node[] {
        const out: Node[] = [];
        while (i < flat.length) {
            const piece = flat[i];
            if (piece.text !== undefined) {
                out.push({ t: "text", v: piece.text });
                i++;
                continue;
            }
            const tag = piece.tag as string;
            if (stopper && (tag === stopper || tag === "else")) {
                return out;
            }
            if (tag.charAt(0) === "#") {
                const sp = tag.indexOf(" ");
                const kw = (sp === -1 ? tag.slice(1) : tag.slice(1, sp)) as "if" | "unless" | "each";
                const expr = sp === -1 ? "" : tag.slice(sp + 1).trim();
                if (kw !== "if" && kw !== "unless" && kw !== "each") {
                    throw new Error(`Unknown block helper {{#${kw}}}`);
                }
                i++;
                const body = walk(`/${kw}`);
                let alt: Node[] = [];
                if (i < flat.length && flat[i].tag === "else") {
                    i++;
                    alt = walk(`/${kw}`);
                }
                if (i >= flat.length || flat[i].tag !== `/${kw}`) {
                    throw new Error(`Missing {{/${kw}}}`);
                }
                i++;
                out.push({ t: "block", kind: kw, expr, body, alt });
                continue;
            }
            if (tag.charAt(0) === ">") {
                out.push(parsePartial(tag.slice(1).trim()));
                i++;
                continue;
            }
            if (tag.charAt(0) === "/") {
                throw new Error(`Unexpected {{${tag}}}`);
            }
            out.push({ t: "interp", expr: tag, raw: !!piece.raw });
            i++;
        }
        return out;
    }

    const ast = walk();
    if (i < flat.length) throw new Error(`Unexpected {{${flat[i].tag}}}`);
    return ast;
}

function parsePartial(body: string): Extract<Node, { t: "partial" }> {
    const spaceMatch = body.match(/^(\S+)\s*([^]*)$/);
    const name = spaceMatch ? spaceMatch[1] : body;
    const rest = spaceMatch ? spaceMatch[2] : "";
    const params: Array<[string, string]> = [];
    // split "key=expr key2=expr" on top-level whitespace
    let depth = 0;
    let quote = "";
    let buf = "";
    const flush = (): void => {
        const eq = buf.indexOf("=");
        if (eq > 0) params.push([buf.slice(0, eq).trim(), buf.slice(eq + 1).trim()]);
        buf = "";
    };
    for (const ch of rest) {
        if (quote) {
            buf += ch;
            if (ch === quote) quote = "";
        } else if (ch === "'" || ch === '"') {
            quote = ch;
            buf += ch;
        } else if (ch === "(") { depth++; buf += ch; }
        else if (ch === ")") { depth--; buf += ch; }
        else if (/\s/.test(ch) && depth === 0) { if (buf.trim()) flush(); }
        else buf += ch;
    }
    if (buf.trim()) flush();
    return { t: "partial", name, params };
}

/* ----------------------------- renderer -------------------------------- */

function renderNodes(nodes: Node[], ctx: Ctx): string {
    let out = "";
    for (const n of nodes) {
        if (n.t === "text") {
            out += n.v;
        } else if (n.t === "interp") {
            const val = resolveExpr(n.expr, ctx);
            out += n.raw ? stringify(val) : escapeHtml(stringify(val));
        } else if (n.t === "partial") {
            out += renderPartial(n, ctx);
        } else {
            out += renderBlock(n, ctx);
        }
    }
    return out;
}

function renderPartial(n: Extract<Node, { t: "partial" }>, ctx: Ctx): string {
    if (ctx.depth >= 20) {
        ctx.errors.push({ message: "Partial recursion too deep", snippet: n.name });
        return "";
    }
    const tpl = ctx.partials[n.name];
    if (tpl === undefined) {
        ctx.errors.push({ message: `Unknown partial {{> ${n.name}}}`, snippet: n.name });
        return "";
    }
    const base: Record<string, unknown> = {};
    for (const scope of ctx.stack) {
        if (scope && typeof scope === "object") Object.assign(base, scope);
    }
    for (const [key, exprStr] of n.params) {
        base[key] = resolveExpr(exprStr, ctx);
    }
    let ast: Node[];
    try {
        ast = parse(tpl);
    } catch (e) {
        ctx.errors.push({ message: `Partial "${n.name}": ${(e as Error).message}`, snippet: tpl.slice(0, 80) });
        return "";
    }
    const child: Ctx = {
        stack: [base],
        helpers: ctx.helpers,
        partials: ctx.partials,
        depth: ctx.depth + 1,
        errors: ctx.errors
    };
    return renderNodes(ast, child);
}

function renderBlock(n: Extract<Node, { t: "block" }>, ctx: Ctx): string {
    const val = resolveExpr(n.expr, ctx);
    if (n.kind === "each") {
        const list = toArray(val);
        if (!list.length) return renderNodes(n.alt, ctx);
        let out = "";
        list.forEach((item, index) => {
            ctx.stack.push({
                "this": item,
                "@index": index,
                "@first": index === 0,
                "@last": index === list.length - 1,
                ...(item && typeof item === "object" ? (item as object) : {})
            });
            out += renderNodes(n.body, ctx);
            ctx.stack.pop();
        });
        return out;
    }
    const truthy = n.kind === "if" ? isTruthy(val) : !isTruthy(val);
    return renderNodes(truthy ? n.body : n.alt, ctx);
}

/* --------------------------- expression eval --------------------------- */

const CMP = ["===", "!==", "==", "!=", "<=", ">=", "<", ">"];

function resolveExpr(expr: string, ctx: Ctx): unknown {
    try {
        return interpret(expr.trim(), ctx);
    } catch (e) {
        ctx.errors.push({ message: (e as Error).message, snippet: expr });
        return "";
    }
}

function interpret(expr: string, ctx: Ctx): unknown {
    if (!expr) return "";

    for (const op of CMP) {
        const idx = topLevelIndexOf(expr, op);
        if (idx > 0) {
            const l = interpret(expr.slice(0, idx).trim(), ctx);
            const r = interpret(expr.slice(idx + op.length).trim(), ctx);
            return compare(l, r, op);
        }
    }

    const call = expr.match(/^([A-Za-z_$][\w$]*)\s*\(([^]*)\)$/);
    if (call && ctx.helpers[call[1]]) {
        const args = splitArgs(call[2]).map((a) => interpret(a.trim(), ctx));
        return ctx.helpers[call[1]](...args);
    }

    if (/^-?\d+(\.\d+)?$/.test(expr)) return parseFloat(expr);
    if (/^'([^']*)'$/.test(expr) || /^"([^"]*)"$/.test(expr)) return expr.slice(1, -1);
    if (expr === "true") return true;
    if (expr === "false") return false;
    if (expr === "null") return null;

    return resolvePath(expr, ctx);
}

function resolvePath(path: string, ctx: Ctx): unknown {
    const parts = path.split(".");
    for (let s = ctx.stack.length - 1; s >= 0; s--) {
        const scope = ctx.stack[s];
        if (scope == null || typeof scope !== "object") continue;
        const rec = scope as Record<string, unknown>;
        if (parts[0] === "this") {
            let cur: unknown = "this" in rec ? rec["this"] : scope;
            for (let p = 1; p < parts.length && cur != null; p++) cur = (cur as Record<string, unknown>)[parts[p]];
            return cur;
        }
        if (parts[0] in rec) {
            let cur: unknown = rec[parts[0]];
            for (let p = 1; p < parts.length && cur != null; p++) cur = (cur as Record<string, unknown>)[parts[p]];
            return cur;
        }
    }
    return undefined;
}

/* ----------------------------- utilities ------------------------------ */

function topLevelIndexOf(s: string, op: string): number {
    let depth = 0;
    let quote = "";
    for (let i = 0; i <= s.length - op.length; i++) {
        const ch = s[i];
        if (quote) {
            if (ch === quote) quote = "";
            continue;
        }
        if (ch === "'" || ch === '"') quote = ch;
        else if (ch === "(") depth++;
        else if (ch === ")") depth--;
        else if (depth === 0 && s.startsWith(op, i)) return i;
    }
    return -1;
}

function splitArgs(s: string): string[] {
    if (!s.trim()) return [];
    const out: string[] = [];
    let depth = 0;
    let quote = "";
    let buf = "";
    for (const ch of s) {
        if (quote) {
            buf += ch;
            if (ch === quote) quote = "";
        } else if (ch === "'" || ch === '"') {
            quote = ch;
            buf += ch;
        } else if (ch === "(") {
            depth++;
            buf += ch;
        } else if (ch === ")") {
            depth--;
            buf += ch;
        } else if (ch === "," && depth === 0) {
            out.push(buf);
            buf = "";
        } else {
            buf += ch;
        }
    }
    if (buf.trim()) out.push(buf);
    return out;
}

function compare(l: unknown, r: unknown, op: string): boolean {
    const ln = typeof l === "string" && l !== "" && !isNaN(+l) ? +l : l;
    const rn = typeof r === "string" && r !== "" && !isNaN(+r) ? +r : r;
    switch (op) {
        case "===": return l === r;
        case "!==": return l !== r;
        case "==": return ln === rn;
        case "!=": return ln !== rn;
        case "<": return (ln as number) < (rn as number);
        case "<=": return (ln as number) <= (rn as number);
        case ">": return (ln as number) > (rn as number);
        case ">=": return (ln as number) >= (rn as number);
        default: return false;
    }
}

function isTruthy(v: unknown): boolean {
    if (Array.isArray(v)) return v.length > 0;
    return !!v;
}

function toArray(v: unknown): unknown[] {
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") return Object.values(v);
    return [];
}

function stringify(v: unknown): string {
    if (v == null) return "";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
}

export function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
