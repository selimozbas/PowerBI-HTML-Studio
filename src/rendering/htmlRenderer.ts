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
    conditionalFormatting: { enabled: boolean; rulesRaw: string };
    locale: string;
}

export interface RenderOutput {
    html: string;
    errors: TemplateError[];
    /** true when row wrappers carry a data-hf-row selection hook */
    rowMapped: boolean;
}

export function renderContent(input: RenderInput): RenderOutput {
    const { model } = input;
    if (!model.hasData) {
        return { html: emptyMessage(input.noDataMessage), errors: [], rowMapped: false };
    }

    const helpers = buildHelpers(input.locale);
    const md = (s: string): string => (input.markdown ? markdownToHtml(s) : s);
    const { rules, error: rulesError } = input.conditionalFormatting.enabled
        ? parseRules(input.conditionalFormatting.rulesRaw)
        : { rules: [] as CfRule[], error: undefined };
    const errors: TemplateError[] = rulesError
        ? [{ message: `Conditional formatting: ${rulesError}`, snippet: input.conditionalFormatting.rulesRaw.slice(0, 80) }]
        : [];

    const rowView = (row: ForgeRow): Record<string, unknown> => {
        const cf = rules.length ? evaluateRules(rules, row.fields as Record<string, unknown>) : { style: "", classes: [] };
        return {
            ...row.fields,
            content: row.content,
            "@index": row.index,
            cfStyle: cf.style,
            cfClass: cf.classes.join(" ")
        };
    };

    if (input.contentSource === "value") {
        if (input.renderMode === "row") {
            const html = model.rows.map((r) => wrapRow(r, rowView(r), md(r.content))).join("");
            return { html, errors, rowMapped: true };
        }
        const sep = input.separator || "";
        const html = md(model.rows.map((r) => r.content).join(sep));
        return { html, errors, rowMapped: false };
    }

    // template mode
    if (input.renderMode === "row") {
        const tpl = input.rowTemplate || "{{{content}}}";
        let html = "";
        for (const r of model.rows) {
            const res = renderTemplate(tpl, rowView(r), helpers);
            errors.push(...res.errors);
            html += wrapRow(r, rowView(r), md(res.html));
        }
        return { html, errors, rowMapped: true };
    }

    const body = input.bodyTemplate || "{{#each rows}}{{{content}}}{{/each}}";
    const view = {
        rows: model.rows.map(rowView),
        fieldNames: model.fieldNames,
        rowCount: model.rows.length
    };
    const res = renderTemplate(body, view, helpers);
    errors.push(...res.errors);
    return { html: md(res.html), errors, rowMapped: false };
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
