import { TemplateError, escapeHtml } from "../rendering/templateEngine";
import { mountTrustedHtml } from "../dom/inject";
import { Translate } from "../i18n";

export interface DebugInfo {
    templateErrors: TemplateError[];
    /** already-formatted removal labels, e.g. "<script>", "@onclick" */
    removedTags: string[];
    rowCount: number;
    fieldNames: string[];
    /** true when Extra tags / attributes widened the sanitiser allow-list */
    sanitiserWeakened?: boolean;
}

/**
 * Small diagnostics panel shown at the bottom of the visual when the
 * author enables it. Surfaces template errors, sanitiser removals and the
 * field names available to templates - far more detail than a bare
 * "something went wrong".
 */
export function renderDebugPanel(host: HTMLElement, info: DebugInfo, t: Translate): void {
    const rows: string[] = [];
    rows.push(`<div class="hf-debug-line"><b>${info.rowCount}</b> ${escapeHtml(t("Debug_Rows", "row(s)"))}</div>`);
    if (info.fieldNames.length) {
        rows.push(
            `<div class="hf-debug-line">${escapeHtml(t("Debug_Fields", "Fields"))}: ${info.fieldNames
                .map((f) => `<code>{{${escapeHtml(f)}}}</code>`)
                .join(" ")}</div>`
        );
    }
    if (info.removedTags.length) {
        rows.push(
            `<div class="hf-debug-line hf-warn">${escapeHtml(t("Debug_Removed", "Sanitiser removed"))}: ${info.removedTags
                .map((tag) => `<code>${escapeHtml(tag)}</code>`)
                .join(" ")}</div>`
        );
    }
    if (info.sanitiserWeakened) {
        rows.push(
            `<div class="hf-debug-line hf-warn">${escapeHtml(
                t("Debug_Weakened", "Extra allowed tags / attributes are widening the sanitiser.")
            )}</div>`
        );
    }
    for (const err of info.templateErrors) {
        rows.push(
            `<div class="hf-debug-line hf-error">${escapeHtml(err.message)} — <code>${escapeHtml(
                err.snippet
            )}</code></div>`
        );
    }
    if (!info.templateErrors.length && !info.removedTags.length && !info.sanitiserWeakened) {
        rows.push(`<div class="hf-debug-line hf-ok">${escapeHtml(t("Debug_NoIssues", "No template or sanitiser issues."))}</div>`);
    }
    mountTrustedHtml(
        host,
        `<div class="hf-debug-title">${escapeHtml(t("Debug_Title", "HTML Studio diagnostics"))}</div>${rows.join("")}`
    );
}
