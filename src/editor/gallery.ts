/**
 * Starter templates offered in the advanced editor. Each is valid input
 * for the template engine (see rendering/templateEngine.ts) and uses only
 * built-in helpers.
 */
export interface TemplateSample {
    id: string;
    name: string;
    description: string;
    template: string;
}

export const TEMPLATE_GALLERY: TemplateSample[] = [
    {
        id: "kpi-card",
        name: "KPI card",
        description: "Single figure with a caption and a progress bar.",
        template: [
            '<div class="hf-card" style="padding:12px;border:1px solid var(--hf-track);border-radius:8px">',
            '  {{#each rows}}',
            '  <div style="font-size:12px;color:var(--hf-muted)">{{content}}</div>',
            '  <div style="font-size:28px;font-weight:600">{{format(Actual, "#,##0")}}</div>',
            '  <div>{{{bar(Actual, Target)}}} <span style="font-size:11px">{{format(pct(Actual, Target), "0.0")}}% of target</span></div>',
            '  {{/each}}',
            '</div>'
        ].join("\n")
    },
    {
        id: "progress-list",
        name: "Progress list",
        description: "One row per item with a label, value and inline bar.",
        template: [
            '<table style="width:100%;border-collapse:collapse">',
            '  {{#each rows}}',
            '  <tr {{{selectAttr("content", content)}}}>',
            '    <td style="padding:4px 8px">{{content}}</td>',
            '    <td style="padding:4px 8px;text-align:right">{{format(Actual, "#,##0")}}</td>',
            '    <td style="padding:4px 8px;width:120px">{{{bar(Actual, Target, 120)}}}</td>',
            '  </tr>',
            '  {{/each}}',
            '</table>'
        ].join("\n")
    },
    {
        id: "tabs",
        name: "Tabbed sections",
        description: "A tab per row; click to switch panels.",
        template: [
            '<div class="hf-tabs" data-hf-tabs="g1">',
            '  {{#each rows}}<button data-hf-tab="t{{@index}}">{{content}}</button>{{/each}}',
            '  {{#each rows}}<div data-hf-panel="t{{@index}}" style="padding:8px">',
            '    <b>{{content}}</b><br/>Actual {{format(Actual, "#,##0")}} / Target {{format(Target, "#,##0")}}',
            '  </div>{{/each}}',
            '</div>'
        ].join("\n")
    },
    {
        id: "bootstrap-cards",
        name: "Bootstrap cards",
        description: "Responsive card grid using the bundled Bootstrap 5 + icons.",
        template: [
            '<div class="row g-2">',
            '  {{#each rows}}',
            '  <div class="col-sm-6 col-lg-4">',
            '    <div class="card h-100" {{{selectAttr("content", content)}}}>',
            '      <div class="card-body">',
            '        <h6 class="card-title"><i class="bi bi-graph-up-arrow me-1"></i>{{content}}</h6>',
            '        <p class="display-6 mb-1">{{number(Actual)}}</p>',
            '        <span class="badge text-bg-{{#if Actual >= Target}}success{{else}}danger{{/if}}">',
            '          {{percent(pct(Actual, Target), 0)}} of target',
            '        </span>',
            '      </div>',
            '    </div>',
            '  </div>',
            '  {{/each}}',
            '</div>'
        ].join("\n")
    },
    {
        id: "bootstrap-accordion",
        name: "Bootstrap accordion",
        description: "Collapsible sections via Bootstrap's data-bs-* API.",
        template: [
            '<div class="accordion" id="hfAcc">',
            '  {{#each rows}}',
            '  <div class="accordion-item">',
            '    <h2 class="accordion-header">',
            '      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#hfAcc{{@index}}">',
            '        {{content}}',
            '      </button>',
            '    </h2>',
            '    <div id="hfAcc{{@index}}" class="accordion-collapse collapse" data-bs-parent="#hfAcc">',
            '      <div class="accordion-body">Actual {{number(Actual)}} &middot; Target {{number(Target)}}</div>',
            '    </div>',
            '  </div>',
            '  {{/each}}',
            '</div>'
        ].join("\n")
    },
    {
        id: "badge-table",
        name: "Status table",
        description: "Rows with a coloured status pill (pair with Conditional formatting).",
        template: [
            '<table style="width:100%;border-collapse:collapse">',
            '  <thead><tr><th style="text-align:left">Item</th><th style="text-align:right">Actual</th><th>Status</th></tr></thead>',
            '  {{#each rows}}',
            '  <tr style="{{cfStyle}}" class="{{cfClass}}">',
            '    <td>{{content}}</td>',
            '    <td style="text-align:right">{{format(Actual, "#,##0")}}</td>',
            '    <td style="text-align:center">{{#if Actual >= Target}}✓{{else}}✗{{/if}}</td>',
            '  </tr>',
            '  {{/each}}',
            '</table>'
        ].join("\n")
    }
];
