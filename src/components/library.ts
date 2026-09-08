/**
 * Built-in component library, available in every template as
 * `{{> name key=value ...}}`. Each entry is itself a template string, so
 * it can use helpers and other partials. Bootstrap 5 classes are used
 * freely - Bootstrap ships inside the visual.
 *
 * Authors can add or override these via the "Partials" setting.
 */
export const COMPONENT_LIBRARY: Record<string, string> = {
    // {{> kpi label=content value=Actual target=Target unit="$"}}
    kpi: `<div class="card h-100"><div class="card-body py-2">
  <div class="text-secondary small text-truncate">{{label}}</div>
  <div class="fs-3 fw-semibold">{{default(unit,"")}}{{number(value)}}</div>
  {{#if target}}<div class="d-flex align-items-center gap-2">
    <div class="progress flex-grow-1" style="height:6px"><div class="progress-bar bg-{{#if value >= target}}success{{else}}warning{{/if}}" style="width:{{pct(value,target)}}%"></div></div>
    <span class="small text-secondary">{{percent(pct(value,target),0)}}</span>
  </div>{{/if}}
</div></div>`,

    // {{> stat label="Orders" value=42 icon="cart"}}
    stat: `<div class="d-flex align-items-center gap-2">
  {{#if icon}}<i class="bi bi-{{icon}} fs-4 text-secondary"></i>{{/if}}
  <div><div class="fw-semibold">{{number(value)}}</div><div class="small text-secondary">{{label}}</div></div>
</div>`,

    // {{> progress label=content value=Actual max=Target}}
    progress: `<div class="mb-2"><div class="d-flex justify-content-between small"><span>{{label}}</span><span>{{number(value)}} / {{number(max)}}</span></div>
  <div class="progress" style="height:8px"><div class="progress-bar" style="width:{{pct(value,max)}}%"></div></div></div>`,

    // {{> ringStat label=content value=Actual max=Target}}
    ringStat: `<div class="text-center">{{{ring(value,max,64)}}}<div class="small text-secondary">{{label}}</div></div>`,

    // {{> trend label=content value=Actual prev=Prev}}
    trend: `<div class="d-flex align-items-baseline gap-2">
  <span class="fs-5 fw-semibold">{{number(value)}}</span>
  {{#if value >= prev}}<span class="text-success small"><i class="bi bi-arrow-up-short"></i>{{percent(pct(sub(value,prev),prev),1)}}</span>
  {{else}}<span class="text-danger small"><i class="bi bi-arrow-down-short"></i>{{percent(pct(sub(value,prev),prev),1)}}</span>{{/if}}
  <span class="text-secondary small">{{label}}</span>
</div>`,

    // {{> pill text=Status good="Open" }}  -> green when text == good, else grey
    pill: `<span class="badge rounded-pill text-bg-{{#if text == good}}success{{else}}secondary{{/if}}">{{text}}</span>`,

    // {{> deltaBadge value=Actual base=Target}}
    deltaBadge: `<span class="badge text-bg-{{#if value >= base}}success{{else}}danger{{/if}}">{{#if value >= base}}+{{/if}}{{percent(pct(sub(value,base),base),1)}}</span>`,

    // {{> ratingStars value=Score max=5}}
    ratingStars: `{{{rating(value,default(max,5),16)}}}`,

    // {{> sparkRow label=content series=Series value=Actual}}
    sparkRow: `<div class="d-flex align-items-center gap-2 py-1">
  <span class="flex-grow-1 text-truncate small">{{label}}</span>
  {{{sparkline(series,90,22)}}}
  <span class="fw-semibold small">{{number(value)}}</span>
</div>`,

    // {{> gauge value=Actual max=Target}}
    gauge: `<svg viewBox="0 0 100 56" width="120" role="img" aria-label="{{percent(pct(value,max),0)}}">
  <path d="M6 50 A44 44 0 0 1 94 50" fill="none" stroke="var(--hf-track,#e1dfdd)" stroke-width="10" stroke-linecap="round"/>
  <path d="M6 50 A44 44 0 0 1 94 50" fill="none" stroke="var(--hf-accent,#118dff)" stroke-width="10" stroke-linecap="round"
    stroke-dasharray="{{mul(1.382,pct(value,max))}} 999"/>
  <text x="50" y="46" text-anchor="middle" font-size="16" font-weight="600">{{percent(pct(value,max),0)}}</text>
</svg>`,

    // {{> comparison label=content actual=Actual target=Target}}
    comparison: `<div class="py-1"><div class="small">{{label}}</div>
  <div style="position:relative;height:14px;background:var(--hf-track,#e1dfdd);border-radius:3px">
    <div style="position:absolute;inset:0;width:{{pct(actual,maxOf(target,actual))}}%;background:var(--hf-accent,#118dff);border-radius:3px"></div>
    <div style="position:absolute;top:-2px;bottom:-2px;left:{{pct(target,maxOf(target,actual))}}%;width:2px;background:#000"></div>
  </div></div>`,

    // {{> calloutCard icon="info-circle" title="Note" text=content}}
    calloutCard: `<div class="alert alert-{{default(variant,"secondary")}} d-flex gap-2 py-2 mb-2">
  <i class="bi bi-{{default(icon,"info-circle")}} fs-5"></i><div><div class="fw-semibold">{{title}}</div><div class="small">{{text}}</div></div>
</div>`,

    // {{> avatarList names=Owners}}  -> comma-separated -> initials circles
    avatarList: `<span class="d-inline-flex">{{#each split(names)}}<span class="rounded-circle bg-secondary-subtle text-secondary-emphasis d-inline-flex align-items-center justify-content-center"
  style="width:24px;height:24px;font-size:10px;margin-left:-6px;border:1px solid #fff">{{initials(this)}}</span>{{/each}}</span>`,

    // {{> timelineItem time=Date title=content text=Note}}
    timelineItem: `<div class="d-flex gap-2 pb-2">
  <div class="text-secondary small" style="min-width:70px">{{date(time,"short")}}</div>
  <div class="border-start border-2 ps-2"><div class="fw-semibold small">{{title}}</div><div class="small text-secondary">{{text}}</div></div>
</div>`
};

export const COMPONENT_NAMES = Object.keys(COMPONENT_LIBRARY);

/**
 * Parses the "Partials" setting: blocks introduced by a line
 * `@partial <name>`, everything up to the next `@partial` (or EOF) is that
 * partial's template. User partials override built-ins of the same name.
 */
export function parseUserPartials(text: string): Record<string, string> {
    const out: Record<string, string> = {};
    if (!text || !text.trim()) return out;
    const lines = text.split(/\r?\n/);
    let name = "";
    let buf: string[] = [];
    const flush = (): void => {
        if (name) out[name] = buf.join("\n").trim();
    };
    for (const line of lines) {
        const m = line.match(/^@partial\s+([A-Za-z_$][\w$-]*)\s*$/);
        if (m) {
            flush();
            name = m[1];
            buf = [];
        } else if (name) {
            buf.push(line);
        }
    }
    flush();
    return out;
}
