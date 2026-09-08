"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import VisualObjectInstancesToPersist = powerbi.VisualObjectInstancesToPersist;

import { VisualFormattingSettingsModel } from "./settings";
import { transform, ForgeModel } from "./dataView/transform";
import { renderContent } from "./rendering/htmlRenderer";
import { sanitizeToFragment } from "./rendering/sanitize";
import { buildThemeVars } from "./theme/themeVars";
import { buildFontCss } from "./theme/fonts";
import { activateComponents, ComponentState } from "./rendering/components";
import { RowWindow } from "./rendering/rowWindow";
import { SelectionBinder, SelectionOptions } from "./interactivity/selection";
import { TooltipBinder } from "./interactivity/tooltip";
import { renderDebugPanel } from "./ui/debugPanel";
import { renderLanding } from "./landing/landing";
import { mountFragment, clearElement } from "./dom/inject";
import { makeTranslator, Translate } from "./i18n";
import { TemplateEditorDialog, EditorInitialState, EditorResultState } from "./dialog/templateEditorDialog";
import {
    HtmlSubSelectionHelper,
    HtmlSubSelectableClass,
    SubSelectableObjectNameAttribute,
    SubSelectableDisplayNameAttribute,
    SubSelectableTypeAttribute
} from "powerbi-visuals-utils-onobjectutils";
import { getSubSelectionStyles, getSubSelectionShortcuts, HF_OBJECT_MAP } from "./onObject/subSelection";
import { initBootstrap, disposeBootstrap, injectBootstrapCss, BsDisposable } from "./framework/bootstrapRuntime";
import { COMPONENT_LIBRARY, parseUserPartials } from "./components/library";
import { renderCharts, disposeCharts, ChartInstance } from "./framework/canvasCharts";

import DialogAction = powerbi.DialogAction;
import ViewMode = powerbi.ViewMode;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;

/** Row count above which "per row" mode switches to windowed rendering. */
const VIRTUALIZE_THRESHOLD = 250;

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private styleEl: HTMLStyleElement;
    private contentEl: HTMLElement;
    private debugEl: HTMLElement;
    private editBtn: HTMLButtonElement;

    private events: IVisualEventService;
    private selectionManager: ISelectionManager;
    private selectionBinder: SelectionBinder;
    private tooltipBinder: TooltipBinder;
    private subSelectionHelper: HtmlSubSelectionHelper;
    private formattingService: FormattingSettingsService;
    private translate: Translate;
    private settings!: VisualFormattingSettingsModel;

    private detachComponents: (() => void) | null = null;
    private detachSelection: (() => void) | null = null;
    private detachTooltip: (() => void) | null = null;
    private detachLinks: (() => void) | null = null;
    private rowWindow: RowWindow | null = null;
    private bsInstances: BsDisposable[] = [];
    private charts: ChartInstance[] = [];
    private componentState: ComponentState = {};
    private lastModel: ForgeModel = { rows: [], fieldNames: [], contentColumnName: null, hasData: false };
    private lastRenderKey = "";

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.events = options.host.eventService;
        this.formattingService = new FormattingSettingsService();
        this.selectionManager = this.host.createSelectionManager();
        this.selectionBinder = new SelectionBinder(this.selectionManager);
        this.tooltipBinder = new TooltipBinder(this.host.tooltipService);
        this.translate = makeTranslator(this.host.createLocalizationManager());

        injectBootstrapCss();

        this.root = options.element;
        this.root.classList.add("hf-visual");

        this.styleEl = document.createElement("style");
        this.contentEl = document.createElement("div");
        this.contentEl.className = "hf-content";
        this.debugEl = document.createElement("div");
        this.debugEl.className = "hf-debug";
        this.debugEl.hidden = true;

        this.editBtn = document.createElement("button");
        this.editBtn.className = "hf-edit-btn";
        this.editBtn.type = "button";
        this.editBtn.textContent = "✎ Template";
        this.editBtn.hidden = true;
        this.editBtn.addEventListener("click", () => this.openTemplateEditor());

        this.subSelectionHelper = HtmlSubSelectionHelper.createHtmlSubselectionHelper({
            hostElement: this.contentEl,
            subSelectionService: this.host.subSelectionService
        });
        this.contentEl.classList.add(HtmlSubSelectableClass);
        this.contentEl.setAttribute(SubSelectableObjectNameAttribute, "styling");
        this.contentEl.setAttribute(SubSelectableDisplayNameAttribute, "Content style");
        this.contentEl.setAttribute(SubSelectableTypeAttribute, String(SubSelectionStylesType.Text));

        this.root.appendChild(this.styleEl);
        this.root.appendChild(this.contentEl);
        this.root.appendChild(this.debugEl);
        this.root.appendChild(this.editBtn);

        this.selectionManager.registerOnSelectCallback(() => {
            this.selectionBinder.applyDim(this.contentEl, this.currentSelectionOptions());
        });
    }

    public update(options: VisualUpdateOptions): void {
        this.events.renderingStarted(options);
        try {
            const dataView = options.dataViews && options.dataViews[0];
            this.settings = this.formattingService.populateFormattingSettingsModel(
                VisualFormattingSettingsModel,
                dataView
            );

            this.restorePersistedState(dataView);

            const model: ForgeModel = transform(dataView, this.host);
            this.lastModel = model;
            this.editBtn.hidden = options.viewMode !== ViewMode.Edit;

            if (!model.hasData && !this.settings.content.noDataMessage.value) {
                this.teardownDynamic();
                renderLanding(this.contentEl, this.translate);
                this.styleEl.textContent = "";
                this.debugEl.hidden = true;
            } else {
                this.renderModel(model);
            }

            this.subSelectionHelper.setFormatMode(!!options.formatMode);
            this.subSelectionHelper.updateOutlinesFromSubSelections(options.subSelections ?? []);

            this.events.renderingFinished(options);
        } catch (err) {
            this.events.renderingFailed(options, String(err));
        }
    }

    private renderModel(model: ForgeModel): void {
        const s = this.settings;
        const palette = this.host.colorPalette;
        const themeVars = s.theme.injectVars.value
            ? buildThemeVars({
                palette,
                isHighContrast: (palette as unknown as { isHighContrast?: boolean }).isHighContrast
            })
            : "";

        // Style-only / resize updates: refresh the cheap bits and bail out
        // before re-running the template engine + sanitiser.
        this.styleEl.textContent = this.composeCss(themeVars);
        this.applyWrapperStyles();

        const renderKey = this.computeRenderKey(model);
        if (renderKey === this.lastRenderKey && this.contentEl.childNodes.length > 0) {
            this.rowWindow?.refresh();
            const w = this.contentEl.clientWidth;
            this.charts.forEach((c) => c.resize(w));
            return;
        }
        this.lastRenderKey = renderKey;

        const rendered = renderContent({
            model,
            contentSource: this.enumValue(s.content.contentSource.value, "value") as "value" | "template",
            renderMode: this.enumValue(s.content.renderMode.value, "aggregate") as "aggregate" | "row",
            markdown: s.content.renderMarkdown.value,
            bodyTemplate: s.content.bodyTemplate.value || String(s.content.bodyTemplate.placeholder || ""),
            rowTemplate: s.content.rowTemplate.value || "",
            separator: this.decodeSeparator(s.content.separator.value),
            noDataMessage: s.content.noDataMessage.value,
            rowLimit: s.performance.maxRows.value,
            partials: { ...COMPONENT_LIBRARY, ...parseUserPartials(s.content.partials.value) },
            conditionalFormatting: {
                enabled: s.conditionalFormatting.enabled.value,
                rulesRaw: s.conditionalFormatting.rules.value
            },
            locale: this.host.locale || "en-US"
        });

        const sanOpts = {
            enabled: s.sanitization.enabled.value,
            allowSvg: s.sanitization.allowSvg.value,
            allowStyleTag: s.sanitization.allowStyleTag.value,
            allowScripts: s.content.unsafeAllowScripts.value,
            extraTags: splitList(s.sanitization.extraAllowedTags.value),
            extraAttrs: splitList(s.sanitization.extraAllowedAttrs.value)
        };

        this.teardownDynamic();

        const rows = rendered.rows;
        const virtualize = !!rendered.rowMapped && !!rows && rows.length > VIRTUALIZE_THRESHOLD;
        let removed: string[] = [];

        if (virtualize && rows) {
            this.rowWindow = new RowWindow({
                scrollEl: this.contentEl,
                total: rows.length,
                estRowHeight: 28,
                buffer: 8,
                renderRange: (start, end) => {
                    const slice = sanitizeToFragment(rows.slice(start, end).map((r) => r.html).join(""), sanOpts);
                    removed = slice.removed;
                    return slice.fragment;
                },
                afterRender: () => {
                    this.markAuthorObjects();
                    this.initFramework();
                    if (this.allowInteractions()) {
                        this.selectionBinder.applyDim(this.contentEl, this.currentSelectionOptions());
                    }
                }
            });
        } else {
            const sanitized = sanitizeToFragment(rendered.html, sanOpts);
            removed = sanitized.removed;
            mountFragment(this.contentEl, sanitized.fragment);
            this.markAuthorObjects();
            this.initFramework();
            disposeCharts(this.charts);
            this.charts = renderCharts(
                this.contentEl,
                model.rows.map((r) => ({ ...r.fields, content: r.content, "@index": r.index }))
            );
        }

        this.contentEl.setAttribute(
            "aria-label",
            s.accessibility.ariaLabel.value || this.translate("Aria_Default", "HTML content")
        );
        this.contentEl.setAttribute("role", "region");

        if (s.hyperlinks.enabled.value) this.detachLinks = this.interceptLinks();

        this.tooltipBinder.setRows(model.rows);
        this.detachTooltip = this.tooltipBinder.attach(this.contentEl);

        this.selectionBinder.setRows(model.rows);
        if (this.allowInteractions()) {
            this.detachSelection = this.selectionBinder.attach(this.contentEl, this.currentSelectionOptions());
        }

        if (s.components.enabled.value) {
            this.detachComponents = activateComponents(this.contentEl, {
                persist: s.components.persistState.value,
                initialState: this.componentState,
                onStateChange: (state) => {
                    this.componentState = state;
                    this.persistState();
                }
            });
        }

        this.debugEl.hidden = !s.debug.showPanel.value;
        if (s.debug.showPanel.value) {
            renderDebugPanel(
                this.debugEl,
                {
                    templateErrors: rendered.errors,
                    removedTags: removed,
                    rowCount: model.rows.length,
                    fieldNames: model.fieldNames
                },
                this.translate
            );
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingService.buildFormattingModel(this.settings);
    }

    public visualOnObjectFormatting: powerbi.extensibility.visual.VisualOnObjectFormatting = {
        getSubSelectionStyles: (subSelections) => getSubSelectionStyles(subSelections),
        getSubSelectionShortcuts: (subSelections) => getSubSelectionShortcuts(subSelections, this.cardUid("styling")),
        getSubSelectables: (filter) => this.subSelectionHelper.getAllSubSelectables(filter)
    };

    public destroy(): void {
        this.teardownDynamic();
        this.subSelectionHelper.destroy();
    }

    /**
     * Translate author-placed `data-hf-object="..."` hooks in the rendered
     * content into the real sub-selection attributes the helper understands.
     */
    private initFramework(): void {
        disposeBootstrap(this.bsInstances);
        this.bsInstances = this.settings.bootstrap.enableJs.value ? initBootstrap(this.contentEl) : [];
    }

    private markAuthorObjects(): void {
        this.contentEl.querySelectorAll<HTMLElement>("[data-hf-object]").forEach((el) => {
            const key = (el.getAttribute("data-hf-object") || "").toLowerCase();
            const objectName = HF_OBJECT_MAP[key];
            if (!objectName) return;
            el.classList.add(HtmlSubSelectableClass);
            el.setAttribute(SubSelectableObjectNameAttribute, objectName);
            el.setAttribute(SubSelectableDisplayNameAttribute, el.getAttribute("data-hf-object-label") || key);
            el.setAttribute(SubSelectableTypeAttribute, String(SubSelectionStylesType.Text));
        });
    }

    private cardUid(objectName: string): string {
        try {
            const model = this.formattingService.buildFormattingModel(this.settings);
            const cards = (model as unknown as { cards?: Array<{ uid?: string }> }).cards || [];
            const hit = cards.find((c) => typeof c.uid === "string" && c.uid.indexOf(objectName) === 0);
            return hit?.uid || objectName;
        } catch {
            return objectName;
        }
    }

    /* --------------------------- helpers ------------------------------ */

    private allowInteractions(): boolean {
        const caps = this.host.hostCapabilities as { allowInteractions?: boolean } | undefined;
        return !caps || caps.allowInteractions !== false;
    }

    private currentSelectionOptions(): SelectionOptions {
        const s = this.settings;
        return {
            enabled: s.crossFilter.enabled.value,
            contextMenu: s.crossFilter.contextMenu.value,
            dimUnselectedPercent: s.crossFilter.transparencyPercent.value
        };
    }

    /** Delegated so it also covers rows mounted later by the virtualizer. */
    private interceptLinks(): () => void {
        const onClick = (ev: MouseEvent): void => {
            const anchor = (ev.target as HTMLElement)?.closest?.("a[href]") as HTMLAnchorElement | null;
            if (!anchor) return;
            const href = anchor.getAttribute("href") || "";
            if (/^https?:\/\//i.test(href)) {
                ev.preventDefault();
                this.host.launchUrl(href);
            }
        };
        this.contentEl.addEventListener("click", onClick);
        return () => this.contentEl.removeEventListener("click", onClick);
    }

    private composeCss(themeVars: string): string {
        const s = this.settings;
        const fontCss = buildFontCss(s.fonts.googleFamilies.value, s.fonts.fontFaceCss.value);
        return `${fontCss}\n.hf-visual{${themeVars}}\n${s.stylesheet.css.value || ""}`;
    }

    private applyWrapperStyles(): void {
        const st = this.settings.styling;
        const c = this.contentEl.style;
        c.fontFamily = st.font.fontFamily.value;
        c.fontSize = `${st.font.fontSize.value}px`;
        c.fontWeight = st.font.bold?.value ? "bold" : "";
        c.fontStyle = st.font.italic?.value ? "italic" : "";
        c.textDecoration = st.font.underline?.value ? "underline" : "";
        c.color = st.fontColor.value.value;
        c.textAlign = this.enumValue(st.align.value, "left");
        c.padding = `${st.padding.value}px`;
        c.overflow = this.enumValue(st.overflow.value, "auto");
        c.background = st.background.value.value || "";
        this.contentEl.dir = this.resolveDirection(this.enumValue(st.direction.value, "auto"));
        this.root.style.height = "100%";
    }

    private resolveDirection(setting: string): string {
        if (setting === "ltr" || setting === "rtl") return setting;
        const loc = (this.host.locale || "en").toLowerCase().split("-")[0];
        return ["ar", "he", "fa", "ur", "ps", "dv", "syr", "ckb", "yi"].indexOf(loc) !== -1 ? "rtl" : "ltr";
    }

    private computeRenderKey(model: ForgeModel): string {
        const s = this.settings;
        const fp = {
            cs: s.content.contentSource.value,
            rm: s.content.renderMode.value,
            md: s.content.renderMarkdown.value,
            bt: s.content.bodyTemplate.value,
            rt: s.content.rowTemplate.value,
            pt: s.content.partials.value,
            sep: s.content.separator.value,
            ndm: s.content.noDataMessage.value,
            uas: s.content.unsafeAllowScripts.value,
            maxRows: s.performance.maxRows.value,
            dbg: s.debug.showPanel.value,
            hl: s.hyperlinks.enabled.value,
            bs: s.bootstrap.enableJs.value,
            cmp: [s.components.enabled.value, s.components.persistState.value],
            cf: [s.conditionalFormatting.enabled.value, s.conditionalFormatting.rules.value],
            san: [
                s.sanitization.enabled.value,
                s.sanitization.allowSvg.value,
                s.sanitization.allowStyleTag.value,
                s.sanitization.extraAllowedTags.value,
                s.sanitization.extraAllowedAttrs.value
            ]
        };
        const rows = model.rows.map((r) => [r.content, r.fields]);
        return JSON.stringify({ fp, rows, fields: model.fieldNames });
    }

    private decodeSeparator(raw: string): string {
        if (!raw) return "";
        return raw.replace(/\\n/g, "\n").replace(/newline/gi, "<br/>");
    }

    private enumValue(v: unknown, fallback: string): string {
        if (v && typeof v === "object" && "value" in (v as Record<string, unknown>)) {
            return String((v as Record<string, unknown>).value);
        }
        return v ? String(v) : fallback;
    }

    /* --------------------- state persistence -------------------------- */

    private restorePersistedState(dataView: powerbi.DataView | undefined): void {
        const raw = dataView?.metadata?.objects?.persistedState?.componentState;
        if (typeof raw === "string" && raw) {
            try {
                this.componentState = JSON.parse(raw) as ComponentState;
            } catch {
                this.componentState = {};
            }
        }
    }

    private openTemplateEditor(): void {
        const s = this.settings;
        const isRow = this.enumValue(s.content.renderMode.value, "aggregate") === "row";
        const current = isRow
            ? s.content.rowTemplate.value
            : s.content.bodyTemplate.value || String(s.content.bodyTemplate.placeholder || "");

        const sampleRows = this.lastModel.rows.slice(0, 25).map((r) => ({
            ...r.fields,
            content: r.content,
            "@index": r.index
        })) as Record<string, unknown>[];

        const initial: EditorInitialState = {
            template: current,
            fieldNames: ["content", ...this.lastModel.fieldNames],
            sampleRows
        };

        this.host
            .openModalDialog(
                TemplateEditorDialog.id,
                {
                    title: "Template editor",
                    size: { width: 940, height: 580 },
                    actionButtons: [DialogAction.OK, DialogAction.Cancel]
                },
                initial as unknown as object
            )
            .then((result) => {
                if (result.actionId !== DialogAction.OK) return;
                const text = (result.resultState as EditorResultState)?.template;
                if (typeof text === "string") this.persistTemplate(isRow ? "rowTemplate" : "bodyTemplate", text);
            })
            .catch(() => undefined);
    }

    private persistTemplate(property: "bodyTemplate" | "rowTemplate", text: string): void {
        const instances = {
            merge: [
                {
                    objectName: "content",
                    selector: null,
                    properties: { contentSource: "template", [property]: text }
                }
            ]
        } as unknown as VisualObjectInstancesToPersist;
        this.host.persistProperties(instances);
    }

    private persistState(): void {
        const instances = {
            merge: [
                {
                    objectName: "persistedState",
                    selector: null,
                    properties: { componentState: JSON.stringify(this.componentState) }
                }
            ]
        } as unknown as VisualObjectInstancesToPersist;
        this.host.persistProperties(instances);
    }

    private teardownDynamic(): void {
        this.detachComponents?.();
        this.detachSelection?.();
        this.detachTooltip?.();
        this.detachLinks?.();
        this.rowWindow?.destroy();
        disposeBootstrap(this.bsInstances);
        disposeCharts(this.charts);
        this.bsInstances = [];
        this.charts = [];
        this.detachComponents = null;
        this.detachSelection = null;
        this.detachTooltip = null;
        this.detachLinks = null;
        this.rowWindow = null;
        clearElement(this.contentEl);
    }
}

function splitList(v: string): string[] {
    return (v || "")
        .split(/[,\s]+/)
        .map((x) => x.trim())
        .filter(Boolean);
}
