/**
 * Sandbox-safe interactive components. No inline <script> in authored
 * content is needed (or allowed) - the visual wires behaviour through a
 * single delegated listener based on data- attributes.
 *
 * Tabs:
 *   <div class="hf-tabs" data-hf-tabs="sales">
 *     <button data-hf-tab="q1">Q1</button><button data-hf-tab="q2">Q2</button>
 *     <div data-hf-panel="q1">...</div><div data-hf-panel="q2">...</div>
 *   </div>
 *
 * Accordion:
 *   <div class="hf-accordion">
 *     <button data-hf-acc="a">Section A</button><div data-hf-acc-panel="a">...</div>
 *   </div>
 */

export type ComponentState = Record<string, string>;

export interface ComponentOptions {
    persist: boolean;
    initialState: ComponentState;
    onStateChange: (state: ComponentState) => void;
}

function setHidden(el: HTMLElement, hidden: boolean): void {
    el.hidden = hidden;
    // a class as well, so author / preset CSS like `.card{display:flex}`
    // can't override the UA `[hidden]` rule
    el.classList.toggle("hf-hidden", hidden);
}

/** Give every unnamed <… data-hf-tabs> a unique id so groups don't share state. */
function nameGroups(root: HTMLElement): void {
    let n = 0;
    root.querySelectorAll<HTMLElement>("[data-hf-tabs]").forEach((g) => {
        if (!g.getAttribute("data-hf-tabs")) g.setAttribute("data-hf-tabs", `_g${n++}`);
    });
}

export function activateComponents(root: HTMLElement, opts: ComponentOptions): () => void {
    const state: ComponentState = { ...opts.initialState };

    nameGroups(root);
    applyTabs(root, state);
    applyAccordions(root, state);

    const onClick = (ev: Event): void => {
        const target = (ev.target as HTMLElement).closest("[data-hf-tab],[data-hf-acc]") as HTMLElement | null;
        if (!target || !root.contains(target)) return;

        if (target.hasAttribute("data-hf-tab")) {
            const group = target.closest("[data-hf-tabs]") as HTMLElement | null;
            const groupId = group?.getAttribute("data-hf-tabs") || "_g0";
            state[`tab:${groupId}`] = target.getAttribute("data-hf-tab") || "";
            applyTabs(root, state);
        } else {
            const key = `acc:${target.getAttribute("data-hf-acc")}`;
            state[key] = state[key] === "open" ? "closed" : "open";
            applyAccordions(root, state);
        }
        if (opts.persist) opts.onStateChange({ ...state });
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
}

function applyTabs(root: HTMLElement, state: ComponentState): void {
    root.querySelectorAll<HTMLElement>("[data-hf-tabs]").forEach((group) => {
        const groupId = group.getAttribute("data-hf-tabs") || "_g0";
        const buttons = Array.from(group.querySelectorAll<HTMLElement>("[data-hf-tab]"));
        if (!buttons.length) return;
        let active = state[`tab:${groupId}`];
        if (!active || !buttons.some((b) => b.getAttribute("data-hf-tab") === active)) {
            active = buttons[0].getAttribute("data-hf-tab") || "";
            state[`tab:${groupId}`] = active;
        }
        buttons.forEach((b) => {
            const on = b.getAttribute("data-hf-tab") === active;
            b.classList.toggle("hf-active", on);
            b.setAttribute("aria-selected", String(on));
            b.setAttribute("role", "tab");
            b.tabIndex = on ? 0 : -1;
        });
        group.querySelectorAll<HTMLElement>("[data-hf-panel]").forEach((panel) => {
            setHidden(panel, panel.getAttribute("data-hf-panel") !== active);
            panel.setAttribute("role", "tabpanel");
        });
    });
}

function applyAccordions(root: HTMLElement, state: ComponentState): void {
    root.querySelectorAll<HTMLElement>("[data-hf-acc]").forEach((btn) => {
        const id = btn.getAttribute("data-hf-acc");
        const open = state[`acc:${id}`] === "open";
        btn.classList.toggle("hf-open", open);
        btn.setAttribute("aria-expanded", String(open));
        // scope the panel lookup so duplicate ids in different accordions don't
        // all resolve to the first match
        const scope = btn.closest(".hf-accordion") || btn.parentElement || root;
        const panel = scope.querySelector<HTMLElement>(`[data-hf-acc-panel="${cssEsc(id)}"]`);
        if (panel) setHidden(panel, !open);
    });
}

function cssEsc(v: string | null): string {
    return String(v ?? "").replace(/["\\\]]/g, "\\$&");
}
