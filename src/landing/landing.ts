import { mountTrustedHtml } from "../dom/inject";
import { escapeHtml } from "../rendering/templateEngine";
import { Translate } from "../i18n";

/**
 * First-run landing page shown when no data is bound. Static, self
 * contained markup - the richer template gallery arrives with the Monaco
 * advanced editor in a later phase.
 */
export function renderLanding(host: HTMLElement, t: Translate): void {
    const e = (k: string, f: string) => escapeHtml(t(k, f));
    mountTrustedHtml(
        host,
        `<div class="hf-landing">
            <h3>${e("Landing_Title", "HTML Studio")}</h3>
            <p>${e("Landing_Intro", "Add a column or measure to the Content field to render it as HTML or SVG.")}</p>
            <ul>
                <li>${e("Landing_Tip_Named", "Add extra measures to Data (named fields) and reference them in a template as {{Revenue}}.")}</li>
                <li>${e("Landing_Tip_Template", "Switch Content › Content source to Template for loops, conditionals and helpers like bar(Actual, Target).")}</li>
                <li>${e("Landing_Tip_Cf", "Use Conditional formatting for rule-based styling without DAX.")}</li>
            </ul>
        </div>`
    );
}
