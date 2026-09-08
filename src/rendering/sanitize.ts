import createDOMPurify from "dompurify";

export interface SanitizeOptions {
    enabled: boolean;
    allowSvg: boolean;
    allowStyleTag: boolean;
    allowScripts: boolean;
    extraTags: string[];
    extraAttrs: string[];
}

export interface SanitizeResult {
    fragment: DocumentFragment;
    /** tag / attribute names the sanitiser stripped, for the diagnostics panel */
    removed: string[];
    /** true when the author's Extra tags / attributes widened the allow-list */
    weakened: boolean;
}

const HF_ATTRS = [
    "target", "rel",
    "data-hf-row", "data-hf-select", "data-hf-object", "data-hf-object-label",
    "data-hf-chart", "data-hf-filter", "data-hf-filter-clear", "data-hf-state",
    "data-hf-tab", "data-hf-tabs", "data-hf-panel", "data-hf-acc", "data-hf-acc-panel",
    "data-bs-toggle", "data-bs-target", "data-bs-dismiss", "data-bs-ride", "data-bs-slide",
    "data-bs-slide-to", "data-bs-parent", "data-bs-config", "data-bs-placement",
    "data-bs-trigger", "data-bs-content", "data-bs-interval", "data-bs-theme", "data-bs-spy"
];

/** Tags that re-open a scripting surface even through DOMPurify. */
const NEVER_ADD = new Set(["script", "iframe", "object", "embed", "base", "meta", "link", "form"]);
const NEVER_ADD_ATTR = /^(on|srcdoc$|xlink:href$)/i;

let purifier: ReturnType<typeof createDOMPurify> | null = null;

function getPurifier(): ReturnType<typeof createDOMPurify> {
    if (!purifier) {
        purifier = createDOMPurify(window);
    }
    return purifier;
}

/**
 * Sanitises authored HTML with DOMPurify and returns a ready-to-adopt
 * DocumentFragment - the visual never assigns an HTML string to a DOM
 * markup property.
 *
 * `<script>` is kept only when the author opts in via the "unsafe" toggle,
 * and even then it does not execute: DOMPurify builds the nodes with the
 * HTML parser and moving parser-created <script> into the live DOM never
 * runs it. The toggle just stops the tag being reported as "removed".
 */
export function sanitizeToFragment(html: string, opts: SanitizeOptions): SanitizeResult {
    const dp = getPurifier();
    const removed = new Set<string>();

    // Extra tags/attrs from the author's settings, minus anything that would
    // let script back in (e.g. iframe + srcdoc).
    const safeExtraTags = opts.extraTags.filter((t) => !NEVER_ADD.has(t.toLowerCase()));
    const safeExtraAttrs = opts.extraAttrs.filter((a) => !NEVER_ADD_ATTR.test(a.trim()));
    const weakened = safeExtraTags.length > 0 || safeExtraAttrs.length > 0;

    dp.addHook("uponSanitizeElement", (node: Node, data: { tagName: string; allowedTags: Record<string, boolean> }) => {
        if (data.tagName && data.tagName !== "#text" && data.tagName !== "#comment" && !data.allowedTags[data.tagName]) {
            removed.add(`<${data.tagName}>`);
        }
    });
    dp.addHook("uponSanitizeAttribute", (_node: Node, data: { attrName: string; keepAttr: boolean }) => {
        if (data.attrName && !data.keepAttr) removed.add(`@${data.attrName}`);
    });

    const config: Record<string, unknown> = {
        RETURN_DOM_FRAGMENT: true,
        FORCE_BODY: true,
        ADD_TAGS: [
            ...(opts.allowStyleTag ? ["style"] : []),
            ...(opts.allowScripts ? ["script"] : []),
            ...safeExtraTags
        ],
        ADD_ATTR: [...HF_ATTRS, ...safeExtraAttrs],
        USE_PROFILES: { html: true, svg: opts.allowSvg, svgFilters: opts.allowSvg }
    };

    let fragment: DocumentFragment;
    try {
        fragment = opts.enabled
            ? (dp.sanitize(html, config as never) as unknown as DocumentFragment)
            : rawFragment(html);
    } finally {
        dp.removeAllHooks();
    }

    // Note when SVG output was dropped because Allow inline SVG is off.
    if (opts.enabled && !opts.allowSvg && /<svg[\s>]/i.test(html)) removed.add("<svg>");

    return { fragment, removed: Array.from(removed), weakened };
}

/**
 * Used only when the author has explicitly disabled sanitisation. Parses
 * without executing scripts, but note: once these nodes are inserted into
 * the live document, inline handlers (`onerror`, `onload`) and
 * `javascript:` URLs on them DO run. That is the accepted cost of the
 * "sanitisation off" mode; only parser-inserted <script> stays inert.
 */
function rawFragment(html: string): DocumentFragment {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const frag = document.createDocumentFragment();
    Array.from(doc.body.childNodes).forEach((n) => frag.appendChild(document.importNode(n, true)));
    return frag;
}
