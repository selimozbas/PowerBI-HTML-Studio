import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

/**
 * Default template used when the user switches Content source to "Template"
 * but has not written anything yet. Kept intentionally small; the landing
 * page / template gallery offers richer starting points.
 */
export const DEFAULT_BODY_TEMPLATE = [
    "{{#each rows}}",
    "  <div class=\"hf-row\">{{{content}}}</div>",
    "{{/each}}"
].join("\n");

class ContentCard extends Card {
    contentSource = new formattingSettings.ItemDropdown({
        name: "contentSource",
        displayName: "Content source",
        items: [
            { value: "value", displayName: "Field value" },
            { value: "template", displayName: "Template" }
        ],
        value: { value: "value", displayName: "Field value" }
    });

    renderMode = new formattingSettings.ItemDropdown({
        name: "renderMode",
        displayName: "Render",
        items: [
            { value: "aggregate", displayName: "Single block" },
            { value: "row", displayName: "Per row" }
        ],
        value: { value: "aggregate", displayName: "Single block" }
    });

    separator = new formattingSettings.TextInput({
        name: "separator",
        displayName: "Row separator",
        placeholder: "e.g. <hr/> or newline",
        value: ""
    });

    bodyTemplate = new formattingSettings.TextArea({
        name: "bodyTemplate",
        displayName: "Body template",
        placeholder: DEFAULT_BODY_TEMPLATE,
        value: ""
    });

    rowTemplate = new formattingSettings.TextArea({
        name: "rowTemplate",
        displayName: "Row template",
        placeholder: "<div>{{content}}</div>",
        value: ""
    });

    partials = new formattingSettings.TextArea({
        name: "partials",
        displayName: "Partials",
        placeholder: "@partial myCard\n<div class=\"card\">{{title}}</div>",
        value: ""
    });

    noDataMessage = new formattingSettings.TextInput({
        name: "noDataMessage",
        displayName: "No-data message",
        placeholder: "Nothing to display",
        value: ""
    });

    renderMarkdown = new formattingSettings.ToggleSwitch({
        name: "renderMarkdown",
        displayName: "Treat content as Markdown",
        value: false
    });

    unsafeAllowScripts = new formattingSettings.ToggleSwitch({
        name: "unsafeAllowScripts",
        // The Power BI sandbox blocks external scripts and parser-inserted
        // <script> never executes; this just stops the tag being stripped.
        displayName: "Keep inline <script> tags",
        value: false
    });

    name = "content";
    displayName = "Content";
    slices = [
        this.contentSource,
        this.renderMode,
        this.renderMarkdown,
        this.separator,
        this.bodyTemplate,
        this.rowTemplate,
        this.partials,
        this.noDataMessage,
        this.unsafeAllowScripts
    ];
}

class StylingCard extends Card {
    font = new formattingSettings.FontControl({
        name: "font",
        displayName: "Font",
        fontFamily: new formattingSettings.FontPicker({
            name: "fontFamily",
            displayName: "Font family",
            value: "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif"
        }),
        fontSize: new formattingSettings.NumUpDown({
            name: "fontSize",
            displayName: "Text size",
            value: 12,
            options: { minValue: { value: 6, type: 0 }, maxValue: { value: 60, type: 1 } }
        }),
        bold: new formattingSettings.ToggleSwitch({ name: "bold", displayName: "Bold", value: false }),
        italic: new formattingSettings.ToggleSwitch({ name: "italic", displayName: "Italic", value: false }),
        underline: new formattingSettings.ToggleSwitch({ name: "underline", displayName: "Underline", value: false })
    });

    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Font color",
        value: { value: "#252423" }
    });

    background = new formattingSettings.ColorPicker({
        name: "background",
        displayName: "Background",
        value: { value: "" }
    });

    align = new formattingSettings.AlignmentGroup({
        name: "align",
        displayName: "Alignment",
        // powerbi.visuals.AlignmentGroupMode.Horizonal — inlined as its string value
        // so this file doesn't depend on the ambient `powerbi` global at runtime
        // (the API's own spelling is "Horizonal"; do not "correct" it).
        mode: "horizontalAlignment" as unknown as powerbi.visuals.AlignmentGroupMode,
        value: "left"
    });

    padding = new formattingSettings.NumUpDown({
        name: "padding",
        displayName: "Padding (px)",
        value: 8,
        options: { minValue: { value: 0, type: 0 }, maxValue: { value: 80, type: 1 } }
    });

    overflow = new formattingSettings.ItemDropdown({
        name: "overflow",
        displayName: "Overflow",
        items: [
            { value: "auto", displayName: "Scroll" },
            { value: "hidden", displayName: "Clip" },
            { value: "visible", displayName: "Visible" }
        ],
        value: { value: "auto", displayName: "Scroll" }
    });

    direction = new formattingSettings.ItemDropdown({
        name: "direction",
        displayName: "Text direction",
        items: [
            { value: "auto", displayName: "Auto (from locale)" },
            { value: "ltr", displayName: "Left to right" },
            { value: "rtl", displayName: "Right to left" }
        ],
        value: { value: "auto", displayName: "Auto (from locale)" }
    });

    name = "styling";
    displayName = "Styling";
    slices = [this.font, this.fontColor, this.background, this.align, this.padding, this.overflow, this.direction];
}

class FontsCard extends Card {
    googleFamilies = new formattingSettings.TextInput({
        name: "googleFamilies",
        displayName: "Google Fonts families",
        placeholder: "Roboto, Open Sans:400;700",
        value: ""
    });

    fontFaceCss = new formattingSettings.TextArea({
        name: "fontFaceCss",
        displayName: "@font-face CSS",
        placeholder: "@font-face { font-family: 'My Font'; src: url(data:font/woff2;base64,...) }",
        value: ""
    });

    name = "fonts";
    displayName = "Fonts";
    slices = [this.googleFamilies, this.fontFaceCss];
}

class StylesheetCard extends Card {
    css = new formattingSettings.TextArea({
        name: "css",
        displayName: "Custom CSS",
        placeholder: ".hf-card { border-radius: 8px; }",
        value: ""
    });

    name = "stylesheet";
    displayName = "Stylesheet";
    slices = [this.css];
}

class ConditionalFormattingCard extends Card {
    enabled = new formattingSettings.ToggleSwitch({
        name: "enabled",
        displayName: "Enabled",
        value: false
    });

    rules = new formattingSettings.TextArea({
        name: "rules",
        displayName: "Rules (JSON)",
        placeholder: "[{\"field\":\"Revenue\",\"op\":\">\",\"value\":1000,\"style\":{\"color\":\"#0a0\"}}]",
        value: ""
    });

    name = "conditionalFormatting";
    displayName = "Conditional formatting";
    slices = [this.enabled, this.rules];
}

class ComponentsCard extends Card {
    enabled = new formattingSettings.ToggleSwitch({
        name: "enabled",
        displayName: "Interactive components",
        value: true
    });

    persistState = new formattingSettings.ToggleSwitch({
        name: "persistState",
        displayName: "Remember component state",
        value: true
    });

    name = "components";
    displayName = "Components";
    slices = [this.enabled, this.persistState];
}

class CrossFilterCard extends Card {
    enabled = new formattingSettings.ToggleSwitch({
        name: "enabled",
        displayName: "Cross-filter on click",
        value: true
    });

    transparencyPercent = new formattingSettings.NumUpDown({
        name: "transparencyPercent",
        displayName: "Dim unselected (%)",
        value: 50,
        options: { minValue: { value: 0, type: 0 }, maxValue: { value: 100, type: 1 } }
    });

    contextMenu = new formattingSettings.ToggleSwitch({
        name: "contextMenu",
        displayName: "Right-click context menu",
        value: true
    });

    name = "crossFilter";
    displayName = "Interactivity";
    slices = [this.enabled, this.transparencyPercent, this.contextMenu];
}

class HyperlinksCard extends Card {
    enabled = new formattingSettings.ToggleSwitch({
        name: "enabled",
        displayName: "Open http/https links",
        value: true
    });

    name = "hyperlinks";
    displayName = "Hyperlinks";
    slices = [this.enabled];
}

class SanitizationCard extends Card {
    preset = new formattingSettings.ItemDropdown({
        name: "preset",
        displayName: "Policy",
        items: [
            { value: "standard", displayName: "Standard" },
            { value: "strict", displayName: "Strict (certified-safe)" },
            { value: "trusted", displayName: "Trusted" },
            { value: "custom", displayName: "Custom (use toggles below)" }
        ],
        value: { value: "standard", displayName: "Standard" }
    });

    enabled = new formattingSettings.ToggleSwitch({
        name: "enabled",
        displayName: "Sanitize HTML",
        value: true
    });

    allowSvg = new formattingSettings.ToggleSwitch({
        name: "allowSvg",
        displayName: "Allow inline SVG",
        value: true
    });

    allowStyleTag = new formattingSettings.ToggleSwitch({
        name: "allowStyleTag",
        displayName: "Allow <style> blocks",
        value: true
    });

    extraAllowedTags = new formattingSettings.TextInput({
        name: "extraAllowedTags",
        displayName: "Extra allowed tags",
        placeholder: "comma,separated",
        value: ""
    });

    extraAllowedAttrs = new formattingSettings.TextInput({
        name: "extraAllowedAttrs",
        displayName: "Extra allowed attributes",
        placeholder: "comma,separated",
        value: ""
    });

    name = "sanitization";
    displayName = "Security";
    slices = [this.preset, this.enabled, this.allowSvg, this.allowStyleTag, this.extraAllowedTags, this.extraAllowedAttrs];
}

class ThemeCard extends Card {
    preset = new formattingSettings.ItemDropdown({
        name: "preset",
        displayName: "Style preset",
        items: [
            { value: "none", displayName: "None" },
            { value: "card", displayName: "Cards" },
            { value: "minimal", displayName: "Minimal" },
            { value: "dark", displayName: "Dark" },
            { value: "newspaper", displayName: "Newspaper" },
            { value: "tile", displayName: "Accent tiles" }
        ],
        value: { value: "none", displayName: "None" }
    });

    injectVars = new formattingSettings.ToggleSwitch({
        name: "injectVars",
        displayName: "Expose report theme as CSS variables",
        value: true
    });

    name = "theme";
    displayName = "Appearance";
    slices = [this.preset, this.injectVars];
}

class AccessibilityCard extends Card {
    ariaLabel = new formattingSettings.TextInput({
        name: "ariaLabel",
        displayName: "ARIA label",
        placeholder: "Describes the visual for screen readers",
        value: ""
    });

    name = "accessibility";
    displayName = "Accessibility";
    slices = [this.ariaLabel];
}

class WritebackCard extends Card {
    enabled = new formattingSettings.ToggleSwitch({
        name: "enabled",
        displayName: "Remember form input (data-hf-state)",
        value: false
    });

    name = "writeback";
    displayName = "Viewer write-back";
    slices = [this.enabled];
}

class SlicerCard extends Card {
    enabled = new formattingSettings.ToggleSwitch({
        name: "enabled",
        displayName: "Filter the report from data-hf-filter elements",
        value: false
    });

    name = "slicer";
    displayName = "HTML slicer";
    slices = [this.enabled];
}

class BootstrapCard extends Card {
    enableJs = new formattingSettings.ToggleSwitch({
        name: "enableJs",
        displayName: "Interactive components (collapse, tabs, dropdowns, tooltips…)",
        value: true
    });

    name = "bootstrap";
    displayName = "Bootstrap 5";
    slices = [this.enableJs];
}

class PerformanceCard extends Card {
    maxRows = new formattingSettings.NumUpDown({
        name: "maxRows",
        displayName: "Max rows rendered (0 = all)",
        value: 0,
        options: { minValue: { value: 0, type: 0 }, maxValue: { value: 30000, type: 1 } }
    });

    printMode = new formattingSettings.ToggleSwitch({
        name: "printMode",
        displayName: "Optimize for export / print",
        value: false
    });

    name = "performance";
    displayName = "Performance";
    slices = [this.maxRows, this.printMode];
}

class DebugCard extends Card {
    showPanel = new formattingSettings.ToggleSwitch({
        name: "showPanel",
        displayName: "Show diagnostics panel",
        value: false
    });

    name = "debug";
    displayName = "Diagnostics";
    slices = [this.showPanel];
}

export class VisualFormattingSettingsModel extends Model {
    content = new ContentCard();
    styling = new StylingCard();
    fonts = new FontsCard();
    stylesheet = new StylesheetCard();
    conditionalFormatting = new ConditionalFormattingCard();
    components = new ComponentsCard();
    crossFilter = new CrossFilterCard();
    slicer = new SlicerCard();
    writeback = new WritebackCard();
    hyperlinks = new HyperlinksCard();
    sanitization = new SanitizationCard();
    theme = new ThemeCard();
    bootstrap = new BootstrapCard();
    accessibility = new AccessibilityCard();
    performance = new PerformanceCard();
    debug = new DebugCard();

    cards = [
        this.content,
        this.styling,
        this.fonts,
        this.stylesheet,
        this.conditionalFormatting,
        this.components,
        this.crossFilter,
        this.slicer,
        this.writeback,
        this.hyperlinks,
        this.sanitization,
        this.theme,
        this.bootstrap,
        this.accessibility,
        this.performance,
        this.debug
    ];
}
