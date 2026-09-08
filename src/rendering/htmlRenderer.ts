import { ForgeModel, ForgeRow } from "../dataView/transform";
import { renderTemplate, escapeHtml, TemplateError } from "./templateEngine";
import { buildHelpers } from "./helpers";
import { CfRule, evaluateRules, parseRules } from "./conditionalFormatting";
import { markdownToHtml } from "./markdown";

export interface RenderInput {
    model: ForgeModel;
    contentSource: "value" | "template";
    renderMode: "aggregate" | "row";
    markdown: boolean;
    bodyTemplate: string;
    rowTemplate: string;
    separator: string;
    noDataMessage: string;
    rowLimit: number;
    partials: Record<string, string>;
    conditionalFormatting: { enabled: boolean; rulesRaw: string };
    locale: string;
}

export interface RenderRow {
    index: number;
    html: string;
}

export interface RenderOutput {
    html: string;
    errors: TemplateError[];
    /** true when row wrappers carry a data-hf-row selection hook */
    rowMapped: boolean;
    /** per-row HTML for row-mapped modes, so the caller can virtualize */
    rows?: RenderRow[];
}

export function renderContent(input: RenderInput): RenderOutput {
    const { model } = input;
    if (!model.hasData) {
        return { html: emptyMessage(input.noDataMessage), errors: [], rowMapped: false };
    }

    const limit = input.rowLimit > 0 ? input.rowLimit : model.rows.length;
    const rows = model.rows.length > limit ? model.rows.slice(0, limit) : model.rows;
    const truncated = model.rows.length - rows.length;
    const moreNote = truncated > 0
        ? `<div class="hf-more">+ ${truncated} more row${truncated === 1 ? "" : "s"} not shown</div>`
        : "";

    const helpers = buildHelpers(input.locale);
    const md = (s: string): string => (input.markdown ? markdownToHtml(s) : s);
    const { rules, error: rulesError } = input.conditionalFormatting.enabled
        ? parseRules(input.conditionalFormatting.rulesRaw)
        : { rules: [] as CfRule[], error: undefined };
    const errors: TemplateError[] = rulesError
        ? [{ message: `Conditional formatting: ${rulesError}`, snippet: input.conditionalFormatting.rulesRaw.slice(0, 80) }]
        : [];

    const fieldKeys = model.fieldNames;
    const colorKey = fieldKeys.find((k) => /colou?r\s*$/i.test(k) && !/back/i.test(k));
    const bgKey = fieldKeys.find((k) => /(background|bg|fill)\s*$/i.test(k));

    const rowView = (row: ForgeRow): Record<string, unknown> => {
        const cf = rules.length ? evaluateRules(rules, row.fields as Record<string, unknown>) : { style: "", classes: [] };
        return {
            ...row.fields,
            content: row.content,
            "@index": row.index,
            cfStyle: cf.style,
            cfClass: cf.classes.join(" "),
            cfColor: colorKey ? row.fields[colorKey] : "",
            cfBg: bgKey ? row.fields[bgKey] : ""
        };
    };

    if (input.contentSource === "value") {
        if (input.renderMode === "row") {
            const out: RenderRow[] = rows.map((r) => ({ index: r.index, html: wrapRow(r, rowView(r), md(r.content)) }));
            return { html: out.map((o) => o.html).join("") + moreNote, errors, rowMapped: true, rows: out };
        }
        const sep = input.separator || "";
        const html = md(rows.map((r) => r.content).join(sep));
        return { html, errors, rowMapped: false };
    }

    // template mode
    if (input.renderMode === "row") {
        const tpl = input.rowTemplate || "{{{content}}}";
        const out: RenderRow[] = [];
        for (const r of rows) {
            const res = renderTemplate(tpl, rowView(r), helpers, input.partials);
            errors.push(...res.errors);
            out.push({ index: r.index, html: wrapRow(r, rowView(r), md(res.html)) });
        }
        return { html: out.map((o) => o.html).join("") + moreNote, errors, rowMapped: true, rows: out };
    }

    const body = input.bodyTemplate || "{{#each rows}}{{{content}}}{{/each}}";
    const view = {
        rows: rows.map(rowView),
        fieldNames: model.fieldNames,
        rowCount: rows.length,
        totalRowCount: model.rows.length
    };
    const res = renderTemplate(body, view, helpers, input.partials);
    errors.push(...res.errors);
    return { html: md(res.html) + moreNote, errors, rowMapped: false };
}

function wrapRow(row: ForgeRow, view: Record<string, unknown>, inner: string): string {
    const style = view.cfStyle ? ` style="${escapeAttr(String(view.cfStyle))}"` : "";
    const cls = view.cfClass ? ` ${escapeAttr(String(view.cfClass))}` : "";
    return `<div class="hf-row${cls}" data-hf-row="${row.index}"${style}>${inner}</div>`;
}

function emptyMessage(msg: string): string {
    return `<div class="hf-empty">${escapeHtml(msg || "")}</div>`;
}

function escapeAttr(s: string): string {
    return s.replace(/"/g, "&quot;");
}
