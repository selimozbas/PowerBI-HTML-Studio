import powerbi from "powerbi-visuals-api";
import DialogConstructorOptions = powerbi.extensibility.visual.DialogConstructorOptions;
import IDialogHost = powerbi.extensibility.visual.IDialogHost;

import { monaco } from "../editor/monacoSetup";
import { registerTemplateLanguage, TEMPLATE_LANGUAGE_ID } from "../editor/templateLanguage";
import { TEMPLATE_GALLERY } from "../editor/gallery";
import { lintTemplate, offsetToPosition } from "../editor/lintTemplate";
import { renderTemplate } from "../rendering/templateEngine";
import { buildHelpers } from "../rendering/helpers";
import { COMPONENT_LIBRARY } from "../components/library";
import { sanitizeToFragment } from "../rendering/sanitize";
import { mountFragment, mountTrustedHtml } from "../dom/inject";
import { escapeHtml } from "../rendering/templateEngine";

export interface EditorInitialState {
    template: string;
    fieldNames: string[];
    sampleRows: Record<string, unknown>[];
    title?: string;
}

export interface EditorResultState {
    template: string;
}

const DIALOG_CSS = `
.hfd { position:absolute; inset:0; display:flex; flex-direction:column; font:13px "Segoe UI",sans-serif; }
.hfd-body { flex:1; display:flex; min-height:0; }
.hfd-gallery { width:180px; border-right:1px solid #e1dfdd; overflow:auto; padding:6px; }
.hfd-gallery button { display:block; width:100%; text-align:left; border:1px solid transparent; background:none;
    padding:6px; border-radius:4px; cursor:pointer; font:inherit; }
.hfd-gallery button:hover { background:#f3f2f1; }
.hfd-gallery small { color:#605e5c; display:block; }
.hfd-editor { flex:1; min-width:0; }
.hfd-side { width:38%; border-left:1px solid #e1dfdd; display:flex; flex-direction:column; min-height:0; }
.hfd-tabs { display:flex; border-bottom:1px solid #e1dfdd; }
.hfd-tabs button { border:none; background:none; padding:6px 12px; cursor:pointer; font:inherit; color:#605e5c;
    border-bottom:2px solid transparent; }
.hfd-tabs button.on { color:#118dff; border-bottom-color:#118dff; }
.hfd-pane { flex:1; overflow:auto; padding:10px; }
.hfd-data table { border-collapse:collapse; font-size:11px; width:100%; }
.hfd-data th, .hfd-data td { border:1px solid #e1dfdd; padding:2px 6px; text-align:left; white-space:nowrap; }
.hfd-data th { background:#f3f2f1; position:sticky; top:0; }
`;

/**
 * Advanced template editor shown via `host.openModalDialog`. Monaco
 * (no-worker) with the hf-template language, a starter-template gallery,
 * a live preview, a bound-data table and inline lint markers. The current
 * text is pushed to the host through `setResult` on every change.
 */
export class TemplateEditorDialog {
    public static id = "TemplateEditorDialog";

    private host: IDialogHost;
    private editor: ReturnType<typeof monaco.editor.create>;
    private previewEl: HTMLElement;
    private dataEl: HTMLElement;
    private tabButtons: HTMLButtonElement[] = [];
    private sampleRows: Record<string, unknown>[];
    private fieldNames: string[];
    private helpers = buildHelpers();

    constructor(options: DialogConstructorOptions, initialState: EditorInitialState) {
        this.host = options.host;
        this.sampleRows = initialState.sampleRows || [];
        this.fieldNames = initialState.fieldNames || [];

        const style = document.createElement("style");
        style.textContent = DIALOG_CSS;
        document.head.appendChild(style);

        mountTrustedHtml(
            options.element,
            `<div class="hfd"><div class="hfd-body">
                <div class="hfd-gallery" id="hfd-gallery"></div>
                <div class="hfd-editor" id="hfd-editor"></div>
                <div class="hfd-side">
                    <div class="hfd-tabs">
                        <button data-tab="preview" class="on">Preview</button>
                        <button data-tab="data">Data</button>
                    </div>
                    <div class="hfd-pane" id="hfd-preview"></div>
                    <div class="hfd-pane hfd-data" id="hfd-data" hidden></div>
                </div>
            </div></div>`
        );

        const galleryEl = options.element.querySelector<HTMLElement>("#hfd-gallery")!;
        const editorHost = options.element.querySelector<HTMLElement>("#hfd-editor")!;
        this.previewEl = options.element.querySelector<HTMLElement>("#hfd-preview")!;
        this.dataEl = options.element.querySelector<HTMLElement>("#hfd-data")!;
        this.tabButtons = Array.from(options.element.querySelectorAll<HTMLButtonElement>(".hfd-tabs button"));
        this.tabButtons.forEach((b) => b.addEventListener("click", () => this.showTab(b.getAttribute("data-tab") || "preview")));

        this.buildGallery(galleryEl);
        this.renderDataTable();

        registerTemplateLanguage(monaco, () => ({ fields: this.fieldNames }));

        this.editor = monaco.editor.create(editorHost, {
            value: initialState.template || "",
            language: TEMPLATE_LANGUAGE_ID,
            automaticLayout: true,
            minimap: { enabled: false },
            wordWrap: "on",
            fontSize: 13,
            scrollBeyondLastLine: false,
            tabSize: 2
        });

        this.editor.onDidChangeModelContent(() => this.sync());
        this.sync();
    }

    private showTab(tab: string): void {
        this.tabButtons.forEach((b) => b.classList.toggle("on", b.getAttribute("data-tab") === tab));
        this.previewEl.hidden = tab !== "preview";
        this.dataEl.hidden = tab !== "data";
    }

    private buildGallery(host: HTMLElement): void {
        TEMPLATE_GALLERY.forEach((sample) => {
            const btn = document.createElement("button");
            const title = document.createElement("span");
            title.textContent = sample.name;
            const desc = document.createElement("small");
            desc.textContent = sample.description;
            btn.appendChild(title);
            btn.appendChild(desc);
            btn.addEventListener("click", () => this.editor.setValue(sample.template));
            host.appendChild(btn);
        });
    }

    private renderDataTable(): void {
        if (!this.sampleRows.length) {
            mountTrustedHtml(this.dataEl, `<div style="color:#605e5c">No rows bound.</div>`);
            return;
        }
        const keys = Object.keys(this.sampleRows[0]).filter((k) => k !== "@index");
        const head = keys.map((k) => `<th>${escapeHtml(k)}</th>`).join("");
        const body = this.sampleRows
            .slice(0, 50)
            .map((r) => `<tr>${keys.map((k) => `<td>${escapeHtml(String(r[k] ?? ""))}</td>`).join("")}</tr>`)
            .join("");
        mountTrustedHtml(this.dataEl, `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`);
    }

    private sync(): void {
        const template = this.editor.getValue();
        this.host.setResult({ template } as EditorResultState);
        this.renderPreview(template);
        this.updateMarkers(template);
    }

    private updateMarkers(template: string): void {
        const model = this.editor.getModel();
        if (!model) return;
        const marks = lintTemplate(template, this.fieldNames, this.sampleRows[0] || {}, COMPONENT_LIBRARY);
        const markers = marks.map((mk) => {
            const start = offsetToPosition(template, mk.offset);
            const end = offsetToPosition(template, mk.offset + Math.max(1, mk.length));
            return {
                startLineNumber: start.line,
                startColumn: start.column,
                endLineNumber: end.line,
                endColumn: end.column,
                message: mk.message,
                severity: mk.severity === "error" ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning
            };
        });
        monaco.editor.setModelMarkers(model, "hf-template", markers);
    }

    private renderPreview(template: string): void {
        const view = { rows: this.sampleRows, rowCount: this.sampleRows.length };
        const res = renderTemplate(template, view, this.helpers, COMPONENT_LIBRARY);
        if (res.errors.length) {
            mountTrustedHtml(
                this.previewEl,
                `<div style="color:#a4262c;font-size:11px">${escapeHtml(res.errors[0].message)}</div>`
            );
            return;
        }
        const sanitized = sanitizeToFragment(res.html, {
            enabled: true,
            allowSvg: true,
            allowStyleTag: true,
            allowScripts: false,
            extraTags: [],
            extraAttrs: []
        });
        mountFragment(this.previewEl, sanitized.fragment);
    }
}

/* Register into the dialog registry the generated visualPlugin.ts reads. */
const registry = globalThis as unknown as { dialogRegistry?: Record<string, unknown> };
registry.dialogRegistry = registry.dialogRegistry || {};
registry.dialogRegistry[TemplateEditorDialog.id] = TemplateEditorDialog;
