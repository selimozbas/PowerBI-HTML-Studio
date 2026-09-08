import powerbi from "powerbi-visuals-api";
import DialogConstructorOptions = powerbi.extensibility.visual.DialogConstructorOptions;
import IDialogHost = powerbi.extensibility.visual.IDialogHost;

import { monaco } from "../editor/monacoSetup";
import { registerTemplateLanguage, TEMPLATE_LANGUAGE_ID } from "../editor/templateLanguage";
import { TEMPLATE_GALLERY } from "../editor/gallery";
import { renderTemplate } from "../rendering/templateEngine";
import { buildHelpers } from "../rendering/helpers";
import { sanitizeToFragment } from "../rendering/sanitize";
import { mountFragment, mountTrustedHtml } from "../dom/inject";

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
.hfd-preview { width:38%; border-left:1px solid #e1dfdd; overflow:auto; padding:10px; }
.hfd-preview h4 { margin:0 0 6px; font-size:11px; text-transform:uppercase; color:#605e5c; }
`;

/**
 * Advanced template editor shown via `host.openModalDialog`. Runs in its
 * own sandboxed iframe with the same visual bundle. Monaco (no-worker),
 * a starter-template gallery and a live preview. The current text is
 * pushed to the host through `setResult` on every change; the host's
 * OK / Cancel buttons close the dialog.
 */
export class TemplateEditorDialog {
    public static id = "TemplateEditorDialog";

    private host: IDialogHost;
    private editor: ReturnType<typeof monaco.editor.create>;
    private previewEl: HTMLElement;
    private sampleRows: Record<string, unknown>[];
    private helpers = buildHelpers();

    constructor(options: DialogConstructorOptions, initialState: EditorInitialState) {
        this.host = options.host;
        this.sampleRows = initialState.sampleRows || [];

        const style = document.createElement("style");
        style.textContent = DIALOG_CSS;
        document.head.appendChild(style);

        const rootHtml = `
            <div class="hfd">
                <div class="hfd-body">
                    <div class="hfd-gallery" id="hfd-gallery"></div>
                    <div class="hfd-editor" id="hfd-editor"></div>
                    <div class="hfd-preview"><h4>Preview</h4><div id="hfd-preview"></div></div>
                </div>
            </div>`;
        mountTrustedHtml(options.element, rootHtml);

        const galleryEl = options.element.querySelector<HTMLElement>("#hfd-gallery")!;
        const editorHost = options.element.querySelector<HTMLElement>("#hfd-editor")!;
        this.previewEl = options.element.querySelector<HTMLElement>("#hfd-preview")!;

        this.buildGallery(galleryEl);

        registerTemplateLanguage(monaco, () => ({ fields: initialState.fieldNames || [] }));

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

    private buildGallery(host: HTMLElement): void {
        TEMPLATE_GALLERY.forEach((sample) => {
            const btn = document.createElement("button");
            const title = document.createElement("span");
            title.textContent = sample.name;
            const desc = document.createElement("small");
            desc.textContent = sample.description;
            btn.appendChild(title);
            btn.appendChild(desc);
            btn.addEventListener("click", () => {
                this.editor.setValue(sample.template);
            });
            host.appendChild(btn);
        });
    }

    private sync(): void {
        const template = this.editor.getValue();
        this.host.setResult({ template } as EditorResultState);
        this.renderPreview(template);
    }

    private renderPreview(template: string): void {
        const view = { rows: this.sampleRows, rowCount: this.sampleRows.length };
        const res = renderTemplate(template, view, this.helpers);
        const sanitized = sanitizeToFragment(res.html, {
            enabled: true,
            allowSvg: true,
            allowStyleTag: true,
            allowScripts: false,
            extraTags: [],
            extraAttrs: []
        });
        if (res.errors.length) {
            mountTrustedHtml(
                this.previewEl,
                `<div style="color:#a4262c;font-size:11px">${escape(res.errors[0].message)}</div>`
            );
            return;
        }
        mountFragment(this.previewEl, sanitized.fragment);
    }
}

function escape(s: string): string {
    return s.replace(/[&<>]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"));
}

/* Register into the dialog registry the generated visualPlugin.ts reads. */
const registry = (globalThis as unknown as { dialogRegistry?: Record<string, unknown> });
registry.dialogRegistry = registry.dialogRegistry || {};
registry.dialogRegistry[TemplateEditorDialog.id] = TemplateEditorDialog;
