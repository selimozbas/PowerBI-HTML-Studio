/**
 * Viewer write-back. Form controls in authored HTML that carry
 * `data-hf-state="key"` have their value remembered:
 *
 *   <input type="checkbox" data-hf-state="signoff.legal"> Legal reviewed
 *   <textarea data-hf-state="notes"></textarea>
 *
 * State is a flat `{ key: value }` map persisted by the visual through
 * `persistProperties`, so it becomes part of the report and is shared by
 * everyone who opens it (a shared checklist / sign-off, not a personal
 * note). It survives refresh and a report save.
 */
export type FormState = Record<string, string | boolean>;

function readControl(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string | boolean {
    if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
        return el.type === "checkbox" ? el.checked : el.value;
    }
    return el.value;
}

function writeControl(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string | boolean): void {
    if (el instanceof HTMLInputElement && el.type === "checkbox") {
        el.checked = value === true || value === "true";
    } else if (el instanceof HTMLInputElement && el.type === "radio") {
        el.checked = el.value === String(value);
    } else {
        el.value = String(value ?? "");
    }
}

export class FormStateBinder {
    private state: FormState = {};

    setState(state: FormState): void {
        this.state = { ...state };
    }

    getState(): FormState {
        return { ...this.state };
    }

    /** Push the remembered values onto the controls currently in the DOM. */
    restore(root: HTMLElement): void {
        root.querySelectorAll<HTMLElement>("[data-hf-state]").forEach((el) => {
            const key = el.getAttribute("data-hf-state") || "";
            if (!(key in this.state)) return;
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
                writeControl(el, this.state[key]);
            }
        });
    }

    attach(root: HTMLElement, enabled: boolean, onChange: (state: FormState) => void): () => void {
        if (!enabled) return () => undefined;

        let timer = 0;
        const flush = (): void => {
            timer = 0;
            onChange(this.getState());
        };

        const handler = (ev: Event): void => {
            const el = ev.target as HTMLElement;
            const holder = el?.closest?.("[data-hf-state]") as HTMLElement | null;
            if (!holder || holder !== el) return;
            if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return;
            const key = el.getAttribute("data-hf-state") || "";
            if (!key) return;
            this.state[key] = readControl(el);
            // update the DOM live, but debounce the persist so typing doesn't
            // fire persistProperties (and a full re-render) on every keystroke.
            if (ev.type === "input") {
                if (timer) clearTimeout(timer);
                timer = setTimeout(flush, 600) as unknown as number;
            } else {
                if (timer) { clearTimeout(timer); timer = 0; }
                onChange(this.getState());
            }
        };

        root.addEventListener("change", handler);
        root.addEventListener("input", handler);
        return () => {
            if (timer) clearTimeout(timer);
            root.removeEventListener("change", handler);
            root.removeEventListener("input", handler);
        };
    }
}
