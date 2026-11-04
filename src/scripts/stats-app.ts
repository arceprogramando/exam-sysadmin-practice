import { domainCoverage, overallPercent, type CoverageKind, type DomainScore } from "../lib/coverage";
import { difficultyLabel, getUI, pageLocale, routePath, type Locale, type RouteId } from "../lib/i18n";
import { labById, labCode, loadEdition } from "../lib/labs";
import {
  aggregates,
  clearStore,
  countedLabs,
  deleteRun,
  filterRuns,
  isHard,
  activeRun,
  loadStore,
  markLabVideoReviewed,
  markLabVideosReviewed,
  parseImportedStore,
  PAUSABLE_ENABLED,
  reopenRun,
  replaceStore,
  wallSec,
  type Difficulty,
  type ExamMode,
  type LabAggregate,
  type Run,
  type Store,
} from "../lib/storage";
import { deltaLabel, formatClock, formatDelta, formatShort, formatWhen } from "../lib/time";
import { ask } from "./ask";

type LabFacet = "stuck" | "redo" | "help";
type LabSortKey = "lab" | "last" | "avg" | "best" | "delta" | "diff" | "help";
type SortDir = "asc" | "desc";

const DIFF_RANK: Record<Difficulty, number> = {
  very_low: 1,
  low: 2,
  normal: 3,
  high: 4,
  very_high: 5,
};

const SORT_KEYS: LabSortKey[] = ["lab", "last", "avg", "best", "delta", "diff", "help"];

function copy() {
  return getUI(pageLocale());
}

function to(route: RouteId): string {
  return routePath(pageLocale(), route);
}

function readMode(): ExamMode {
  if (!PAUSABLE_ENABLED) return "fixed";
  const raw = new URLSearchParams(location.search).get("mode");
  return raw === "pausable" ? "pausable" : "fixed";
}

function modeHref(mode: ExamMode): string {
  return `${to("stats")}?mode=${mode}`;
}

export function mountStats(host: HTMLElement): void {
  host.replaceChildren(view());
  revealImport();
}

function revealImport(): void {
  if (location.hash !== "#stats-import") return;
  const zone = document.getElementById("stats-import");
  if (!(zone instanceof HTMLElement)) return;
  const place = () => {
    if (!zone.isConnected) return;
    const top = zone.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo(0, Math.max(0, top));
  };
  requestAnimationFrame(place);
  window.setTimeout(place, 80);
}

function view(): HTMLElement {
  const mode = readMode();
  const store = filterRuns(loadStore(), mode);
  const page = el("div", "flex flex-col gap-6 pb-12");
  if (PAUSABLE_ENABLED) page.append(modeTabs(mode));

  if (store.runs.length === 0) {
    page.append(importDrop(), empty(mode));
    return page;
  }

  const comparable = store.runs
    .filter((run) => run.status === "completed" || run.status === "timed_out")
    .sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
  const latest = comparable.at(-1);
  const previous = comparable.at(-2);
  const delta = latest && previous ? wallSec(latest) - wallSec(previous) : null;

  const runs = store.runs.slice().sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
  page.append(
    coverageCard(store.runs),
    headline(delta, latest, previous, mode),
    totals(store.runs),
    labTable(mode),
    history(runs),
    tools(),
  );
  return page;
}

function modeTabs(mode: ExamMode): HTMLElement {
  const ui = copy();
  const row = el("div", "choice");
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", ui.statsHeading);
  const fixed = link(
    modeHref("fixed"),
    ui.statsModeFixed,
    mode === "fixed" ? "choice-option is-on" : "choice-option",
  );
  const pausable = link(
    modeHref("pausable"),
    ui.statsModePausable,
    mode === "pausable" ? "choice-option is-on" : "choice-option",
  );
  (mode === "fixed" ? fixed : pausable).setAttribute("aria-current", "page");
  row.append(fixed, pausable);
  return row;
}

function headline(
  delta: number | null,
  latest: Run | undefined,
  previous: Run | undefined,
  mode: ExamMode,
): HTMLElement {
  const card = el(
    "section",
    mode === "fixed"
      ? "is-window rounded-3xl border border-line bg-card p-6 sm:p-8"
      : "rounded-3xl border border-line bg-card p-6 sm:p-8",
  );
  const ui = copy();
  const locale = pageLocale();
  card.append(
    el(
      "p",
      "text-xs font-semibold tracking-[0.16em] text-muted uppercase",
      mode === "fixed" ? ui.improvementFixed : ui.statsModePausable,
    ),
  );
  if (!latest) {
    card.append(
      el("h1", "mt-2 text-3xl font-semibold tracking-tight", ui.noClosed),
      el("p", "mt-3 text-muted", ui.noClosedBody),
    );
    return card;
  }
  if (delta == null || !previous) {
    card.append(
      el("h1", "stat-value mt-2 text-4xl font-semibold", formatClock(wallSec(latest))),
      el("p", "mt-3 text-lg", ui.firstExam),
    );
    return card;
  }
  const faster = delta < -5;
  card.append(
    el(
      "h1",
      `stat-value mt-2 text-4xl font-semibold ${faster ? "text-good" : delta > 5 ? "text-bad" : "text-ink"}`,
      formatDelta(delta, locale),
    ),
    el("p", "mt-3 text-lg", `${deltaLabel(delta, locale)} ${ui.fasterThan(formatWhen(previous.startedAt, locale))}`),
    el("p", "mt-2 text-sm text-muted", ui.lastVsPrev(formatClock(wallSec(latest)), formatClock(wallSec(previous)))),
  );
  return card;
}

function coverageCard(runs: Run[]): HTMLElement {
  const ui = copy();
  const locale = pageLocale();
  const domains = domainCoverage(runs, loadEdition());
  const overall = overallPercent(domains);
  const section = el("section", "rounded-3xl border border-line bg-card p-5 sm:p-6");
  section.append(
    el("h2", "text-lg font-semibold", ui.coverageTitle),
    el("p", "mt-2 max-w-2xl text-sm text-muted", ui.coverageLead),
    el("p", "mt-2 text-sm font-medium", gapLine(domains, locale)),
  );
  const layout = el("div", "mt-5 grid items-center gap-6 lg:grid-cols-[minmax(260px,380px)_1fr]");
  layout.append(radialBars(domains, overall), domainList(domains));
  section.append(layout, el("p", "mt-5 text-sm text-muted", ui.coverageNote));
  return section;
}

function gapLine(domains: DomainScore[], locale: Locale): string {
  const ui = copy();
  const order = new Map(domains.map((domain, index) => [domain.id, index]));
  const sorted = domains.slice().sort((a, b) => a.percent - b.percent || (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  if (sorted.every((domain) => domain.percent >= 100)) return ui.coverageSolid;
  if (sorted.every((domain) => domain.percent === 0)) return ui.coverageNone;
  const floor = sorted[0]?.percent ?? 0;
  const names = sorted
    .filter((domain) => domain.percent === floor)
    .slice(0, 3)
    .map((domain) => ui.domainName[domain.id] ?? domain.id);
  return ui.coverageGap(joinNames(names, locale));
}

function joinNames(names: string[], locale: Locale): string {
  if (names.length <= 1) return names[0] ?? "";
  const and = locale === "en" ? " and " : " y ";
  if (names.length === 2) return names.join(and);
  return `${names.slice(0, -1).join(", ")}${and}${names.at(-1)}`;
}

function radialBars(domains: DomainScore[], overall: number): SVGSVGElement {
  const ui = copy();
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 560 560");
  svg.setAttribute("role", "img");
  svg.classList.add("mx-auto", "w-full", "max-w-[420px]");
  const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
  const detail = domains.map((domain) => `${ui.domainName[domain.id] ?? domain.id} ${domain.percent}%`).join(", ");
  title.textContent = `${ui.coverageTitle}: ${overall}%. ${detail}`;
  svg.append(title);

  const cx = 280;
  const cy = 280;
  const inner = 78;
  const outer = 168;
  const sweep = (Math.PI * 2) / domains.length;
  const bar = sweep * 0.72;

  domains.forEach((domain, index) => {
    const mid = -Math.PI / 2 + index * sweep;
    const a0 = mid - bar / 2;
    const a1 = mid + bar / 2;
    const track = document.createElementNS("http://www.w3.org/2000/svg", "path");
    track.setAttribute("d", ring(cx, cy, inner, outer, a0, a1));
    track.setAttribute("fill", token("--color-track"));
    svg.append(track);
    if (domain.percent > 0) {
      const reach = inner + ((outer - inner) * domain.percent) / 100;
      const fill = document.createElementNS("http://www.w3.org/2000/svg", "path");
      fill.setAttribute("d", ring(cx, cy, inner, reach, a0, a1));
      fill.setAttribute("fill", tone(domain.percent));
      svg.append(fill);
    }
    const labelR = 214;
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", String(cx + labelR * Math.cos(mid)));
    text.setAttribute("y", String(cy + labelR * Math.sin(mid)));
    text.setAttribute("text-anchor", anchor(mid));
    text.setAttribute("fill", token("--color-ink"));
    text.setAttribute("font-size", "15");
    text.setAttribute("font-family", "Figtree, Segoe UI, sans-serif");
    text.setAttribute("font-weight", "600");
    text.textContent = ui.domainShort[domain.id] ?? domain.id;
    const dy = Math.sin(mid) > 0.45 ? "0.85em" : Math.sin(mid) < -0.45 ? "-0.15em" : "0.35em";
    text.setAttribute("dy", dy);
    svg.append(text);
  });

  const value = document.createElementNS("http://www.w3.org/2000/svg", "text");
  value.setAttribute("x", String(cx));
  value.setAttribute("y", String(cy - 4));
  value.setAttribute("text-anchor", "middle");
  value.setAttribute("fill", tone(overall));
  value.setAttribute("font-size", "32");
  value.setAttribute("font-family", "IBM Plex Mono, ui-monospace, monospace");
  value.setAttribute("font-weight", "600");
  value.textContent = `${overall}%`;
  const caption = document.createElementNS("http://www.w3.org/2000/svg", "text");
  caption.setAttribute("x", String(cx));
  caption.setAttribute("y", String(cy + 18));
  caption.setAttribute("text-anchor", "middle");
  caption.setAttribute("fill", token("--color-muted"));
  caption.setAttribute("font-size", "12");
  caption.setAttribute("font-family", "Figtree, Segoe UI, sans-serif");
  caption.setAttribute("letter-spacing", "0.08em");
  caption.textContent = ui.coverageCenter.toUpperCase();
  svg.append(value, caption);
  return svg;
}

function ring(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const point = (radius: number, angle: number) =>
    `${cx + radius * Math.cos(angle)} ${cy + radius * Math.sin(angle)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${point(r1, a0)} A ${r1} ${r1} 0 ${large} 1 ${point(r1, a1)} L ${point(r0, a1)} A ${r0} ${r0} 0 ${large} 0 ${point(r0, a0)} Z`;
}

function anchor(angle: number): "start" | "middle" | "end" {
  const cos = Math.cos(angle);
  if (cos > 0.4) return "start";
  if (cos < -0.4) return "end";
  return "middle";
}

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function tone(percent: number): string {
  if (percent >= 80) return token("--color-good");
  if (percent >= 40) return token("--color-warn");
  return token("--color-bad");
}

function domainList(domains: DomainScore[]): HTMLElement {
  const ui = copy();
  const order = new Map(domains.map((domain, index) => [domain.id, index]));
  const sorted = domains
    .slice()
    .sort((a, b) => a.percent - b.percent || (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  const list = el("div", "flex flex-col gap-2");
  for (const domain of sorted) {
    const details = document.createElement("details");
    details.className = "coverage-domain rounded-2xl border border-line bg-paper px-3 py-2";
    const summary = document.createElement("summary");
    summary.className = "flex cursor-pointer items-center justify-between gap-3";
    const name = el("span", "font-medium", ui.domainName[domain.id] ?? domain.id);
    const percent = el("span", "stat-value text-sm font-semibold", `${domain.percent}%`);
    percent.style.color = domain.percent === 0 ? token("--color-bad") : tone(domain.percent);
    summary.append(name, percent);
    const meter = el("div", "coverage-meter mt-2");
    const fill = document.createElement("span");
    fill.style.width = `${domain.percent}%`;
    fill.style.background = domain.percent === 0 ? "transparent" : tone(domain.percent);
    meter.append(fill);
    const labs = el("ul", "mt-2 mb-1 flex flex-col gap-1");
    for (const lab of domain.labs) {
      const found = labById(lab.labId, pageLocale());
      const title = found ? `${labCode(found.id)} · ${found.title}` : lab.labId;
      const li = el("li", "flex items-baseline justify-between gap-3 text-sm");
      li.append(el("span", "", title), el("span", "shrink-0 text-muted", kindLabel(lab.kind)));
      labs.append(li);
    }
    details.append(summary, meter, labs);
    list.append(details);
  }
  return list;
}

function kindLabel(kind: CoverageKind): string {
  const ui = copy();
  if (kind === "done") return ui.coverageDone;
  if (kind === "help") return ui.coverageHelp;
  if (kind === "revisit") return ui.coverageRevisit;
  return ui.coverageMissing;
}

function totals(runs: Run[]): HTMLElement {
  const help = runs.reduce((sum, run) => sum + countedLabs(run.labs, run.edition).filter((lab) => lab.usedHelp).length, 0);
  const skipped = runs.reduce((sum, run) => sum + countedLabs(run.labs, run.edition).filter((lab) => lab.status === "skipped").length, 0);
  const done = runs.reduce((sum, run) => sum + countedLabs(run.labs, run.edition).filter((lab) => lab.status === "done").length, 0);
  const finished = runs.filter((run) => run.status === "completed" || run.status === "timed_out");
  const best = finished.filter((run) => run.status === "completed").sort((a, b) => wallSec(a) - wallSec(b))[0];
  const grid = el("section", "grid gap-3 sm:grid-cols-2 lg:grid-cols-5");
  grid.append(
    tile(copy().simulacros, String(runs.length)),
    tile(copy().best, best ? formatClock(wallSec(best)) : "—"),
    tile(copy().labsDone, String(done)),
    tile(copy().withHelp, String(help)),
    tile(copy().passed, String(skipped)),
  );
  return grid;
}

function tile(label: string, value: string): HTMLElement {
  const card = el("article", "rounded-3xl border border-line bg-card px-4 py-4");
  card.append(el("p", "text-sm text-muted", label), el("p", "stat-value mt-1 text-2xl font-semibold", value));
  return card;
}

function labTable(mode: ExamMode): HTMLElement {
  const ui = copy();
  const locale = pageLocale();
  let allRows = aggregates(loadStore(), mode).filter((row) => row.samples > 0);
  let query = "";
  const facets = new Set<LabFacet>();
  let sortKey: LabSortKey = "lab";
  let sortDir: SortDir = "asc";

  const section = el("section", "overflow-hidden rounded-3xl border border-line bg-card");
  const headBlock = el("div", "flex flex-wrap items-end justify-between gap-3 px-5 pt-5");
  headBlock.append(el("h2", "text-lg font-semibold", ui.byLab));
  const count = el("p", "stats-count", ui.statsResultCount(allRows.length));
  headBlock.append(count);

  const toolbar = el("div", "stats-toolbar px-5 pt-4");
  const search = document.createElement("input");
  search.type = "search";
  search.className = "stats-search";
  search.placeholder = ui.statsSearch;
  search.setAttribute("aria-label", ui.statsSearch);
  search.autocomplete = "off";
  search.addEventListener("input", () => {
    query = search.value.trim().toLowerCase();
    paint();
  });

  const facetRow = el("div", "stats-facets");
  facetRow.setAttribute("role", "group");
  facetRow.setAttribute("aria-label", ui.statsShowLabel);
  const facetLabels: Record<LabFacet, string> = {
    stuck: ui.statsFilterStuck,
    redo: ui.statsFilterRedo,
    help: ui.statsFilterHelp,
  };
  const facetInputs = {} as Record<LabFacet, HTMLInputElement>;
  for (const id of Object.keys(facetLabels) as LabFacet[]) {
    const input = facetCheck(facetLabels[id], id);
    facetInputs[id] = input;
    input.addEventListener("change", () => {
      if (input.checked) facets.add(id);
      else facets.delete(id);
      paint();
    });
    const label = el("label", "stats-facet");
    label.append(input, document.createTextNode(facetLabels[id]));
    facetRow.append(label);
  }

  const clear = button(ui.statsClearFilters, "stats-clear");
  clear.hidden = true;
  clear.addEventListener("click", () => {
    query = "";
    search.value = "";
    facets.clear();
    for (const input of Object.values(facetInputs)) input.checked = false;
    sortKey = "lab";
    sortDir = "asc";
    paint();
  });

  toolbar.append(search, facetRow, clear);

  const table = document.createElement("div");
  table.className = "mt-3 overflow-x-auto";
  const grid = document.createElement("table");
  grid.className = "w-full min-w-[720px] border-collapse text-left text-sm";
  const head = document.createElement("thead");
  const hr = document.createElement("tr");
  const sortButtons: Partial<Record<LabSortKey, HTMLButtonElement>> = {};
  ui.cols.forEach((label, index) => {
    const key = SORT_KEYS[index];
    const th = document.createElement("th");
    th.className = "border-b border-line px-4 py-2";
    const btn = button(label, "stats-sort");
    btn.type = "button";
    btn.addEventListener("click", () => {
      if (sortKey === key) sortDir = sortDir === "asc" ? "desc" : "asc";
      else {
        sortKey = key;
        sortDir = key === "lab" ? "asc" : "desc";
      }
      paint();
    });
    sortButtons[key] = btn;
    th.append(btn);
    hr.append(th);
  });
  head.append(hr);
  const body = document.createElement("tbody");
  grid.append(head, body);
  table.append(grid);
  const empty = el("p", "hidden px-5 py-6 text-sm text-muted", ui.statsEmptyFilter);
  const note = el("p", "px-5 py-4 text-sm text-muted", ui.statsNote);
  section.append(headBlock, toolbar, table, empty, note);

  function paint(): void {
    const active = Boolean(query) || facets.size > 0 || sortKey !== "lab" || sortDir !== "asc";
    clear.hidden = !active;
    for (const key of SORT_KEYS) {
      const btn = sortButtons[key];
      if (!btn) continue;
      const on = sortKey === key;
      btn.dataset.sort = on ? sortDir : "";
      btn.setAttribute("aria-sort", on ? (sortDir === "asc" ? "ascending" : "descending") : "none");
    }
    const rows = sortLabs(
      allRows.filter((row) => matchesLabRow(row, query, facets, locale)),
      sortKey,
      sortDir,
    );
    count.textContent = ui.statsResultCount(rows.length);
    body.replaceChildren();
    empty.classList.toggle("hidden", rows.length > 0);
    table.classList.toggle("hidden", rows.length === 0);
    for (const row of rows) {
      body.append(
        labRow(row, {
          onAll: () => {
            if (!markLabVideosReviewed(row.labId, mode)) return;
            allRows = aggregates(loadStore(), mode).filter((item) => item.samples > 0);
            paint();
          },
          onOne: (videoUrl) => {
            if (!markLabVideoReviewed(row.labId, mode, videoUrl)) return;
            allRows = aggregates(loadStore(), mode).filter((item) => item.samples > 0);
            paint();
          },
        }),
      );
    }
  }

  paint();
  return section;
}

function facetCheck(label: string, value: LabFacet): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.value = value;
  input.className = "stats-facet-input";
  input.setAttribute("aria-label", label);
  return input;
}

function matchesLabRow(row: LabAggregate, query: string, facets: Set<LabFacet>, locale: Locale): boolean {
  if (query) {
    const lab = labById(row.labId, locale);
    const hay = `${labCode(row.labId)} ${lab?.title ?? row.labId}`.toLowerCase();
    if (!hay.includes(query)) return false;
  }
  if (facets.size === 0) return true;
  return [...facets].some((facet) => {
    if (facet === "stuck") return row.lastSkipped;
    if (facet === "redo") return !row.lastSkipped && isHard(row.lastDifficulty);
    return row.help > 0;
  });
}

function sortLabs(rows: LabAggregate[], key: LabSortKey, dir: SortDir): LabAggregate[] {
  const sign = dir === "asc" ? 1 : -1;
  return rows.slice().sort((a, b) => {
    const left = sortValue(a, key);
    const right = sortValue(b, key);
    if (left == null && right == null) return labCode(a.labId).localeCompare(labCode(b.labId));
    if (left == null) return 1;
    if (right == null) return -1;
    if (left < right) return -1 * sign;
    if (left > right) return 1 * sign;
    return labCode(a.labId).localeCompare(labCode(b.labId));
  });
}

function sortValue(row: LabAggregate, key: LabSortKey): number | string | null {
  if (key === "lab") return labCode(row.labId);
  if (key === "diff") return hardRank(row);
  if (key === "help") return row.help;
  if (key === "delta") {
    if (row.lastSec == null || row.prevSec == null) return null;
    return row.lastSec - row.prevSec;
  }
  if (key === "last") return row.lastSec;
  if (key === "avg") return row.avgSec;
  return row.bestSec;
}

function hardRank(row: LabAggregate): number {
  if (row.lastSkipped) return 6;
  if (!row.lastDifficulty) return 0;
  return DIFF_RANK[row.lastDifficulty];
}

function labRow(
  row: LabAggregate,
  onVideos?: { onAll: () => void; onOne: (videoUrl: string) => void },
): HTMLElement {
  const locale = pageLocale();
  const ui = copy();
  const lab = labById(row.labId, locale);
  const tr = document.createElement("tr");
  if (row.lastSkipped) tr.className = "lab-stuck";
  const delta = row.lastSec != null && row.prevSec != null ? row.lastSec - row.prevSec : null;
  const level = difficultyLabel(row.lastDifficulty, locale);
  const videoTotal = lab?.help.videos.length ?? 0;
  const videoDone = row.reviewedVideoUrls.length;
  const cells = [
    lab ? `${labCode(lab.id)} · ${lab.title}` : row.labId,
    row.lastSec == null ? "—" : formatShort(row.lastSec, locale),
    row.avgSec == null ? "—" : formatShort(row.avgSec, locale),
    row.bestSec == null ? "—" : formatShort(row.bestSec, locale),
    delta == null ? "—" : `${formatDelta(delta, locale)} · ${deltaLabel(delta, locale)}`,
    row.lastSkipped
      ? ui.skipTask
      : row.videosReviewed
        ? ui.statsVideosReviewed
        : level
          ? isHard(row.lastDifficulty)
            ? `${level}, ${ui.redoCell}`
            : level
          : "—",
    row.samples ? `${row.help}/${row.samples}` : "—",
  ];
  cells.forEach((text, index) => {
    const td = document.createElement("td");
    td.className = `border-b border-line px-4 py-3 align-top ${index === 0 ? "font-medium" : index === 5 ? "" : "stat-value"} ${
      index === 4 && delta != null && delta < -5 ? "text-good" : index === 4 && delta != null && delta > 5 ? "text-bad" : ""
    } ${index === 5 && !row.lastSkipped && isHard(row.lastDifficulty) ? "font-medium text-warn" : ""}`;
    if (index === 5 && row.lastSkipped) {
      const wrap = el("div", "flex flex-col gap-2");
      wrap.append(el("span", "stuck-badge", text));
      if (lab?.help.videos.length) {
        const videos = el("div", "stats-videos");
        const head = el("div", "stats-videos-head");
        head.append(el("p", "stats-videos-label", ui.statsReviewVideos));
        if (videoTotal > 1) {
          head.append(el("span", "stats-videos-progress", ui.statsVideosProgress(videoDone, videoTotal)));
        }
        videos.append(head);
        const list = el("ul", "stats-videos-list");
        const reviewed = new Set(row.reviewedVideoUrls);
        for (const video of lab.help.videos) {
          const item = el("li", "stats-video-row");
          const a = link(video.url, video.title, "stats-video-link");
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          item.append(a);
          if (videoTotal > 1) {
            if (reviewed.has(video.url)) {
              item.append(el("span", "stats-video-done", ui.statsVideoDone));
            } else if (onVideos) {
              const one = button(ui.statsMarkOneVideo, "btn btn-quiet stats-video-mark");
              one.addEventListener("click", () => onVideos.onOne(video.url));
              item.append(one);
            }
          }
          list.append(item);
        }
        videos.append(list);
        wrap.append(videos);
      }
      if (onVideos && videoTotal > 0 && videoDone < videoTotal) {
        const mark = button(ui.statsMarkVideosReviewed, "btn btn-quiet stats-reviewed-btn");
        mark.addEventListener("click", onVideos.onAll);
        wrap.append(mark);
      }
      td.append(wrap);
    } else if (index === 5 && row.videosReviewed) {
      td.append(el("span", "stats-reviewed-badge", text));
    } else {
      td.textContent = text;
    }
    tr.append(td);
  });
  return tr;
}

function history(runs: Run[]): HTMLElement {
  const section = el("section", "rounded-3xl border border-line bg-card p-5");
  section.append(el("h2", "text-lg font-semibold", copy().history));
  if (runs.length === 0) {
    section.append(el("p", "mt-2 text-sm text-muted", copy().historyEmpty));
    return section;
  }
  const list = el("ul", "mt-3 divide-y divide-line");
  for (const run of runs) {
    const scored = countedLabs(run.labs, run.edition);
    const done = scored.filter((lab) => lab.status === "done").length;
    const revisit = scored.filter((lab) => lab.status === "revisit").length;
    const redo = scored.filter((lab) => lab.status === "done" && isHard(lab.difficulty)).length;
    const skipped = scored.filter((lab) => lab.status === "skipped").length;
    const help = scored.filter((lab) => lab.usedHelp).length;
    const li = el("li", "flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between");
    const text = el("div");
    text.append(
      el("p", "font-medium", `${formatWhen(run.startedAt, pageLocale())} · ${statusLabel(run.status)}`),
      el(
        "p",
        "stat-value text-sm text-muted",
        `${formatClock(wallSec(run))} · ${copy().tally({ done, revisit, redo, skipped, help })}`,
      ),
    );
    const actions = el("div", "flex flex-wrap gap-2");
    if (run.status === "abandoned") {
      const resume = button(copy().resumeAbandoned, "btn btn-primary");
      resume.addEventListener("click", async () => {
        const running = activeRun();
        const ui = copy();
        if (running) {
          const ok = await ask({
            title: ui.resumeAbandoned,
            body: ui.confirmResumeOther,
            confirmLabel: ui.resumeAbandoned,
            cancelLabel: ui.askBack,
          });
          if (!ok) return;
        }
        reopenRun(run.id);
        location.href = to("practice");
      });
      actions.append(resume);
    }
    const remove = button(copy().delete, "btn btn-quiet");
    remove.addEventListener("click", async () => {
      const ui = copy();
      const which = run.status === "in_progress" ? ui.thisRunning : ui.thisSaved;
      const ok = await ask({
        title: ui.askDelete,
        body: ui.confirmDeleteNamed(which),
        confirmLabel: ui.askDelete,
        cancelLabel: ui.askBack,
        confirmClass: "btn btn-warn",
      });
      if (!ok) return;
      deleteRun(run.id);
      const host = document.getElementById("stats-root");
      if (host) mountStats(host);
    });
    actions.append(remove);
    li.append(text, actions);
    list.append(li);
  }
  section.append(list);
  return section;
}

/** Download name: how many exam runs are in the file, plus local date/time. */
function exportJsonFilename(store: Store): string {
  const n = store.runs.length;
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const stamp = `${y}-${mo}-${d}-${hh}h${mm}`;
  if (pageLocale() === "en") {
    return `rhcsa-stats(${n}-practice-runs)-${stamp}.json`;
  }
  return `rhcsa-estadisticas(${n}-practicas)-${stamp}.json`;
}

function tools(): HTMLElement {
  const ui = copy();
  const wrap = el("div", "flex flex-col gap-3");
  const row = el("div", "flex flex-col gap-3 sm:flex-row sm:flex-wrap");
  const download = button(ui.download, "btn btn-quiet");
  download.addEventListener("click", () => {
    const store = loadStore();
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportJsonFilename(store);
    a.click();
    URL.revokeObjectURL(url);
  });
  const wipe = button(ui.wipe, "btn btn-quiet");
  wipe.addEventListener("click", async () => {
    const ok = await ask({
      title: ui.askWipe,
      body: ui.confirmWipe,
      confirmLabel: ui.askWipe,
      cancelLabel: ui.askBack,
      confirmClass: "btn btn-warn",
    });
    if (!ok) return;
    clearStore();
    refreshStats();
  });
  row.append(download, wipe);
  wrap.append(row, importDrop());
  return wrap;
}

function importDrop(): HTMLElement {
  const ui = copy();
  const zone = el("label", "stats-import");
  zone.id = "stats-import";
  zone.append(el("span", "stats-import-title", ui.importJson), el("span", "stats-import-hint", ui.importDrop));
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.className = "sr-only";
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    input.value = "";
    if (file) void importPracticeFile(file);
  });
  zone.append(input);
  zone.addEventListener("dragenter", (event) => {
    event.preventDefault();
    zone.classList.add("is-drag");
  });
  zone.addEventListener("dragover", (event) => {
    event.preventDefault();
    zone.classList.add("is-drag");
  });
  zone.addEventListener("dragleave", (event) => {
    if (event.target === zone) zone.classList.remove("is-drag");
  });
  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    zone.classList.remove("is-drag");
    const file = event.dataTransfer?.files?.[0];
    if (file) void importPracticeFile(file);
  });
  return zone;
}

async function importPracticeFile(file: File): Promise<void> {
  const ui = copy();
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    await ask({
      title: ui.importJson,
      body: ui.importBad,
      confirmLabel: ui.askBack,
    });
    return;
  }
  const store = parseImportedStore(parsed);
  if (!store) {
    await ask({
      title: ui.importJson,
      body: ui.importBad,
      confirmLabel: ui.askBack,
    });
    return;
  }
  const ok = await ask({
    title: ui.askImport,
    body: ui.confirmImport(store.runs.length),
    confirmLabel: ui.askImport,
    cancelLabel: ui.askBack,
    confirmClass: "btn btn-warn",
  });
  if (!ok) return;
  replaceStore(store);
  refreshStats();
}

function refreshStats(): void {
  const host = document.getElementById("stats-root");
  if (host) mountStats(host);
}

function empty(mode: ExamMode): HTMLElement {
  const card = el("section", "rounded-3xl border border-line bg-card p-6 sm:p-8");
  const ui = copy();
  card.append(
    el("h1", "text-3xl font-semibold tracking-tight", ui.noTimes),
    el(
      "p",
      "mt-3 text-muted",
      mode === "fixed" ? `${ui.noTimesBody} ${ui.startFixedHint}` : ui.noTimesBody,
    ),
    link(to("home"), ui.goHome, "btn btn-primary mt-6"),
  );
  return card;
}

function statusLabel(status: Run["status"]): string {
  const ui = copy();
  if (status === "completed") return ui.closed;
  if (status === "timed_out") return ui.timedOut;
  if (status === "abandoned") return ui.abandoned;
  return ui.inProgress;
}

function el(tag: string, className = "", text = ""): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function button(text: string, className: string): HTMLButtonElement {
  const node = document.createElement("button");
  node.type = "button";
  node.className = className;
  node.textContent = text;
  return node;
}

function link(href: string, text: string, className = ""): HTMLAnchorElement {
  const node = document.createElement("a");
  node.href = href;
  node.className = className;
  node.textContent = text;
  return node;
}
