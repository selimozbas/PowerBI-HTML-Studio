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
import { activateComponents, ComponentState } from "./rendering/components";
import { SelectionBinder, SelectionOptions } from "./interactivity/selection";
import { renderDebugPanel } from "./ui/debugPanel";
import { renderLanding } from "./landing/landing";
import { mountFragment, clearElement } from "./dom/inject";

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private styleEl: HTMLStyleElement;
    private contentEl: HTMLElement;
    private debugEl: HTMLElement;

    private events: IVisualEventService;
    private selectionManager: ISelectionManager;
    private selectionBinder: SelectionBinder;
    private formattingService: FormattingSettingsService;
    private settings!: VisualFormattingSettingsModel;

    private detachComponents: (() => void) | null = null;
    private detachSelection: (() => void) | null = null;
    private componentState: ComponentState = {};

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.events = options.host.eventService;
        this.formattingService = new FormattingSettingsService();
        this.selectionManager = this.host.createSelectionManager();
        this.selectionBinder = new SelectionBinder(this.selectionManager);

        this.root = options.element;
        this.root.classList.add("hf-visual");

        this.styleEl = document.createElement("style");
        this.contentEl = document.createElement("div");
        this.contentEl.className = "hf-content";
        this.debugEl = document.createElement("div");
        this.debugEl.className = "hf-debug";
        this.debugEl.hidden = true;

        this.root.appendChild(this.styleEl);
        this.root.appendChild(this.contentEl);
        this.root.appendChild(this.debugEl);

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

            if (!model.hasData && !this.settings.content.noDataMessage.value) {
                this.teardownDynamic();
                renderLanding(this.contentEl);
                this.styleEl.textContent = "";
                this.debugEl.hidden = true;
            } else {
                this.renderModel(model);
            }
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

        const rendered = renderContent({
            model,
            contentSource: this.enumValue(s.content.contentSource.value, "value") as "value" | "template",
            renderMode: this.enumValue(s.content.renderMode.value, "aggregate") as "aggregate" | "row",
            bodyTemplate: s.content.bodyTemplate.value || String(s.content.bodyTemplate.placeholder || ""),
            rowTemplate: s.content.rowTemplate.value || "",
            separator: this.decodeSeparator(s.content.separator.value),
            noDataMessage: s.content.noDataMessage.value,
            conditionalFormatting: {
                enabled: s.conditionalFormatting.enabled.value,
                rulesRaw: s.conditionalFormatting.rules.value
            },
            locale: this.host.locale || "en-US"
        });

        const sanitized = sanitizeToFragment(rendered.html, {
            enabled: s.sanitization.enabled.value,
            allowSvg: s.sanitization.allowSvg.value,
            allowStyleTag: s.sanitization.allowStyleTag.value,
            allowScripts: s.content.unsafeAllowScripts.value,
            extraTags: splitList(s.sanitization.extraAllowedTags.value),
            extraAttrs: splitList(s.sanitization.extraAllowedAttrs.value)
        });

        this.styleEl.textContent = this.composeCss(themeVars, s.stylesheet.css.value);
        this.applyWrapperStyles();

        this.teardownDynamic();
        mountFragment(this.contentEl, sanitized.fragment);
        this.contentEl.setAttribute("aria-label", s.accessibility.ariaLabel.value || "HTML content");
        this.contentEl.setAttribute("role", "region");

        if (s.hyperlinks.enabled.value) this.interceptLinks();

        this.selectionBinder.setRows(model.rows);
        this.detachSelection = this.selectionBinder.attach(this.contentEl, this.currentSelectionOptions());

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
            renderDebugPanel(this.debugEl, {
                templateErrors: rendered.errors,
                removedTags: sanitized.removed,
                rowCount: model.rows.length,
                fieldNames: model.fieldNames
            });
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingService.buildFormattingModel(this.settings);
    }

    /* --------------------------- helpers ------------------------------ */

    private currentSelectionOptions(): SelectionOptions {
        const s = this.settings;
        return {
            enabled: s.crossFilter.enabled.value,
            contextMenu: s.crossFilter.contextMenu.value,
            dimUnselectedPercent: s.crossFilter.transparencyPercent.value
        };
    }

    private interceptLinks(): void {
        this.contentEl.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
            const href = a.getAttribute("href") || "";
            if (/^https?:\/\//i.test(href)) {
                a.addEventListener("click", (ev) => {
                    ev.preventDefault();
                    this.host.launchUrl(href);
                });
            }
        });
    }

    private composeCss(themeVars: string, userCss: string): string {
        return `.hf-visual{${themeVars}}\n${userCss || ""}`;
    }

    private applyWrapperStyles(): void {
        const st = this.settings.styling;
        const c = this.contentEl.style;
        c.fontFamily = st.font.fontFamily.value;
        c.fontSize = `${st.font.fontSize.value}px`;
        c.color = st.fontColor.value.value;
        c.textAlign = this.enumValue(st.align.value, "left");
        c.padding = `${st.padding.value}px`;
        c.overflow = this.enumValue(st.overflow.value, "auto");
        c.background = st.background.value.value || "";
        this.root.style.height = "100%";
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
        this.detachComponents = null;
        this.detachSelection = null;
        clearElement(this.contentEl);
    }
}

function splitList(v: string): string[] {
    return (v || "")
        .split(/[,\s]+/)
        .map((x) => x.trim())
        .filter(Boolean);
}
