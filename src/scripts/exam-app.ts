import { difficultyLabel, getUI, pageLocale, routePath, type RouteId } from "../lib/i18n";
import { labsFor, loadEdition, labCode, trackFor, REDHAT_EXAM_VIDEO, type Lab, type LabCommand } from "../lib/labs";
import { lvmLabFlowHtml } from "../lib/lvm-diagram";
import {
  countedLabs,
  isHard,
  loadStore,
  remainingSec,
  deleteRun,
  replaceRun,
  wallSec,
  type Difficulty,
  type LabRecord,
  type Run,
} from "../lib/storage";
import { formatClock, formatShort } from "../lib/time";
import { ask, closeAsk } from "./ask";
import { createCopyButton } from "./copy-btn";

function copy() {
  return getUI(pageLocale());
}

function labs(): Lab[] {
  const edition = current()?.edition ?? loadEdition();
  return labsFor(pageLocale()).map((lab) => ({ ...lab, track: trackFor(lab, edition) }));
}

function to(route: RouteId): string {
  return routePath(pageLocale(), route);
}

let root: HTMLElement;
let runId = "";
let tickTimer = 0;
let globalClock: HTMLElement | null = null;
let labClock: HTMLElement | null = null;
let ringWrap: HTMLElement | null = null;
let ringValue: SVGCircleElement | null = null;
let floatRoot: HTMLElement | null = null;
let floatPauseBtn: HTMLButtonElement | null = null;
let floatLabel: HTMLElement | null = null;
let expiredOnce = false;
let screen: "board" | "lab" = "board";
let visitStart: number | null = null;
let focusLabIndex: number | null = null;
/** Panel de ayuda visible en la pantalla del lab. */
let helpVisible = false;
let floatX: number | null = null;
let floatY: number | null = null;

const UI_KEY = "arceprog:rhcsa-exam-ui";

function saveUi(): void {
  if (!runId || typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(
    UI_KEY,
    JSON.stringify({
      runId,
      screen,
      helpVisible,
      floatX,
      floatY,
      visitStart,
      labIndex: current()?.currentIndex ?? null,
    }),
  );
}

function loadUi(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const raw = sessionStorage.getItem(UI_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as {
      runId?: string;
      screen?: string;
      helpVisible?: boolean;
      floatX?: number | null;
      floatY?: number | null;
      visitStart?: number | null;
      labIndex?: number | null;
    };
    if (data.runId !== runId) return;
    if (data.screen === "lab" || data.screen === "board") screen = data.screen;
    helpVisible = Boolean(data.helpVisible);
    if (typeof data.floatX === "number") floatX = data.floatX;
    if (typeof data.floatY === "number") floatY = data.floatY;
    if (typeof data.visitStart === "number") visitStart = data.visitStart;
    if (typeof data.labIndex === "number") {
      const run = loadStore().runs.find((item) => item.id === runId);
      if (run && run.currentIndex !== data.labIndex) {
        run.currentIndex = data.labIndex;
        replaceRun(run);
      }
    }
  } catch {
    /* ignore */
  }
}

/** Guarda el tramo abierto del lab en durationSec (F5, cerrar pestaña, volver al tablero). */
function persistVisit(run: Run | undefined = current()): void {
  if (!run || run.status !== "in_progress") return;
  if (visitStart == null) return;
  flushVisit(run.labs[run.currentIndex]);
  commit(run);
  saveUi();
}

export function mountExam(host: HTMLElement): void {
  root = host;
  const run = loadStore().runs.find((item) => item.status === "in_progress");
  if (!run) {
    renderEmpty();
    return;
  }
  runId = run.id;
  loadUi();
  // No reiniciar visitStart en F5: si venía en sessionStorage, el reloj del lab sigue.
  if (screen === "lab" && !run.pausedAt && visitStart == null) visitStart = Date.now();
  saveUi();
  expireIfNeeded();
  render();
  if (current()?.status === "in_progress") tickTimer = window.setInterval(tick, 250);
  window.addEventListener("pagehide", onPageHide);
  document.addEventListener("visibilitychange", onVisibilityChange);
}

function current(): Run | undefined {
  return loadStore().runs.find((item) => item.id === runId);
}

function commit(next: Run): void {
  replaceRun(next);
}

function expireIfNeeded(): void {
  const run = current();
  if (!run || run.status !== "in_progress" || run.pausedAt || remainingSec(run) > 0) return;
  const finishedAt = new Date(Date.parse(run.startedAt) + (run.globalLimitSec + run.pausedSec) * 1000).toISOString();
  run.status = "timed_out";
  run.finishedAt = finishedAt;
  const open = run.labs[run.currentIndex];
  if (open?.startedAt && !open.finishedAt) {
    open.durationSec = Math.max(0, (Date.parse(finishedAt) - Date.parse(open.startedAt)) / 1000);
  }
  commit(run);
}

function tick(): void {
  const run = current();
  if (!run) return;
  if (run.pausedAt) return;
  if (run.status === "in_progress" && remainingSec(run) <= 0) {
    if (expiredOnce) return;
    expiredOnce = true;
    window.clearInterval(tickTimer);
    expireIfNeeded();
    render();
    return;
  }
  paintClock(run);
  if (labClock) {
    const record = run.labs[run.currentIndex];
    labClock.textContent = formatClock(liveLabSec(record, run.currentIndex));
  }
}

const RING_R = 15.5;
const RING_C = 2 * Math.PI * RING_R;

/** Verde mientras queda más de 2/3, amarillo hasta 1/3, rojo en el último tercio. */
function clockZone(left: number, limit: number): "good" | "warn" | "bad" {
  if (left <= limit / 3) return "bad";
  if (left <= (2 * limit) / 3) return "warn";
  return "good";
}

function paintClock(run: Run): void {
  const left = remainingSec(run);
  const limit = Math.max(1, run.globalLimitSec);
  const ratio = Math.min(1, Math.max(0, left / limit));
  const paused = run.mode === "pausable" && Boolean(run.pausedAt);
  const zone = clockZone(left, limit);
  const toneClass = paused ? "text-ink" : zone === "bad" ? "text-bad" : zone === "warn" ? "text-warn" : "text-good";
  if (globalClock) {
    globalClock.textContent = formatClock(left);
    globalClock.className = `stat-value text-center text-2xl font-semibold sm:text-3xl ${toneClass}`;
  }
  if (ringWrap) ringWrap.dataset.tone = paused ? "paused" : zone;
  if (ringValue) {
    ringValue.style.strokeDasharray = `${RING_C}`;
    ringValue.style.strokeDashoffset = `${RING_C * (1 - ratio)}`;
  }
}

function liveLabSec(record: LabRecord | undefined, index: number): number {
  if (!record) return 0;
  const visiting = screen === "lab" && visitStart != null && current()?.currentIndex === index;
  if (visiting && visitStart != null) {
    return (record.durationSec ?? 0) + Math.max(0, (Date.now() - visitStart) / 1000);
  }
  if (record.durationSec != null) return record.durationSec;
  if (record.startedAt && !record.finishedAt) {
    return Math.max(0, (Date.now() - Date.parse(record.startedAt)) / 1000);
  }
  return 0;
}

function flushVisit(record: LabRecord | undefined): void {
  if (!record || visitStart == null) return;
  record.durationSec = (record.durationSec ?? 0) + Math.max(0, (Date.now() - visitStart) / 1000);
  visitStart = null;
}

function onPageHide(): void {
  persistVisit();
}

function onVisibilityChange(): void {
  if (document.visibilityState === "hidden") persistVisit();
  if (document.visibilityState === "visible") {
    const run = current();
    if (run?.status === "in_progress" && screen === "lab" && !run.pausedAt && visitStart == null) {
      visitStart = Date.now();
      saveUi();
    }
  }
}

function render(): void {
  const run = current();
  if (!run) {
    removeFloat();
    renderEmpty();
    return;
  }
  if (run.status !== "in_progress") {
    removeFloat();
    root.replaceChildren(summaryView(run));
    globalClock = null;
    labClock = null;
    return;
  }
  if (screen === "lab" && labs()[run.currentIndex]) {
    root.replaceChildren(examView(run));
    labClock = root.querySelector("[data-lab-clock]");
    syncFloat(run);
    return;
  }
  screen = "board";
  root.replaceChildren(boardView(run));
  labClock = null;
  syncFloat(run);
  if (focusLabIndex != null) {
    revealLab(focusLabIndex);
    focusLabIndex = null;
  }
}

function revealLab(index: number): void {
  const row = root.querySelector(`[data-lab-index="${index}"]`);
  if (!(row instanceof HTMLElement)) return;
  const place = () => {
    if (!row.isConnected) return;
    const top = row.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo(0, Math.max(0, top));
  };
  requestAnimationFrame(place);
  window.setTimeout(place, 80);
  window.setTimeout(place, 200);
}

function renderEmpty(): void {
  removeFloat();
  const box = el("section", "mx-auto max-w-xl py-16 text-center");
  box.append(
    el("h1", "text-3xl font-semibold tracking-tight", copy().emptyTitle),
    el("p", "mt-3 text-muted", copy().emptyBody),
    link(to("home"), copy().emptyHome, "btn btn-primary mt-6"),
  );
  root.replaceChildren(box);
}

function examView(run: Run): HTMLElement {
  const lab = labs()[run.currentIndex];
  const record = run.labs[run.currentIndex];
  const page = el("div", "flex flex-col gap-6");
  const back = button(copy().backToList, "btn btn-quiet w-fit");
  back.addEventListener("click", () => backToBoard());
  page.append(clockBar(run, true), back, labCard(lab, record), actions(run));
  return page;
}

function boardView(run: Run): HTMLElement {
  const page = el("div", "flex flex-col gap-6 pb-12");
  page.append(clockBar(run, false), strategyNote(), taskList(run));
  const foot = el("div", "flex flex-col items-start gap-2");
  const close = button(copy().closeRun, "btn btn-quiet w-fit");
  close.addEventListener("click", () => closeRun());
  const remove = button(copy().deleteRun, "btn btn-danger w-fit");
  remove.addEventListener("click", () => deleteCurrent());
  foot.append(close, el("p", "text-sm text-muted", copy().closeKept), remove);
  page.append(foot);
  return page;
}

function strategyNote(): HTMLElement {
  const ui = copy();
  const note = el("section", "strategy-note");
  note.append(el("h2", "strategy-note-title", ui.strategyTitle));
  const credit = el("p", "strategy-note-credit");
  credit.append(ui.listCreditBefore);
  credit.append(anchor(REDHAT_EXAM_VIDEO, ui.videoTitle));
  credit.append(".");
  note.append(credit, el("p", "strategy-note-body", ui.strategyBody), el("p", "strategy-note-hint", ui.enterHint));
  return note;
}

function taskList(run: Run): HTMLElement {
  const wrap = el("div", "flex flex-col gap-6");
  const indexed = labs().map((lab, index) => ({ lab, index }));
  const pdf = indexed.filter((item) => item.lab.track === "pdf");
  wrap.append(taskGroup(run, copy().groupClient, pdf.filter((item) => machineOf(item.lab) === "client")));
  wrap.append(taskGroup(run, copy().groupServer, pdf.filter((item) => machineOf(item.lab) === "server")));
  const both = pdf.filter((item) => machineOf(item.lab) === "both");
  if (both.length) wrap.append(taskGroup(run, copy().groupBoth, both));
  const extras = indexed.filter((item) => item.lab.track === "extra");
  wrap.append(taskGroup(run, copy().groupExtras, extras));
  return wrap;
}

function machineOf(lab: Lab): "client" | "server" | "both" {
  const where = lab.where.toLowerCase();
  const client = where.includes("client");
  const server = where.includes("server");
  if (client && server) return "both";
  if (server) return "server";
  return "client";
}

function taskGroup(run: Run, title: string, items: { lab: Lab; index: number }[], intro?: HTMLElement): HTMLElement {
  const section = el("section", "overflow-hidden rounded-3xl border border-line bg-card");
  const head = el("div", "flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line px-4 py-3 sm:px-5");
  head.append(el("h2", "font-semibold", title));
  head.append(el("p", "text-right text-xs font-semibold text-muted", copy().marksLegend));
  section.append(head);
  if (intro) section.append(intro);
  if (items.length === 0) {
    section.append(el("p", "px-5 py-4 text-sm text-muted", copy().emptyGroup));
    return section;
  }
  for (const item of items) section.append(taskRow(run, item.lab, item.index));
  return section;
}

function taskRow(run: Run, lab: Lab, index: number): HTMLElement {
  const record = run.labs[index];
  const done = record?.status === "done";
  const revisit = record?.status === "revisit";
  const stuck = record?.status === "skipped";
  const hard = done && isHard(record?.difficulty);
  const row = el(
    "div",
    `lab-row grid grid-cols-1 gap-2 border-b border-line px-4 py-3 last:border-b-0 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-5 ${
      stuck ? "lab-stuck" : hard ? "bg-warn-soft" : done ? "opacity-60" : revisit ? "bg-warn-soft" : ""
    }`,
  );
  row.dataset.labIndex = String(index);
  const marks = el("div", "flex items-center gap-4");
  marks.append(radioMark(index, "revisit", copy().revisit, revisit), radioMark(index, "done", copy().done, done));
  const text = el("div", "min-w-0 text-left");
  const title = el("span", `font-medium ${done && !hard ? "line-through" : ""}`, `${labCode(lab.id)} · ${lab.title}`);
  text.append(title);
  if (lab.story) text.append(storyText(lab.story, "mt-1 block text-sm leading-relaxed text-ink/75"));
  const meta = el(
    "span",
    "mt-0.5 block text-sm text-muted",
    rowMeta(record, lab),
  );
  text.append(meta);
  const enter = button(copy().enterLab, "btn btn-primary shrink-0");
  enter.addEventListener("click", () => openLab(index));
  row.append(marks, text, enter);
  if (stuck) row.append(stuckFlag());
  if (done) row.append(difficultyLine(index, record?.difficulty ?? null, lab));
  return row;
}

function stuckFlag(): HTMLElement {
  const flag = el("div", "stuck-flag sm:col-span-3");
  flag.append(el("span", "stuck-badge", copy().skipTask), el("span", "", copy().stuckNote));
  return flag;
}

function rowMeta(record: LabRecord | undefined, lab: Lab): string {
  const bits = [lab.where];
  if (record?.status === "skipped") bits.push(copy().skipTask);
  const level = difficultyLabel(record?.difficulty, pageLocale());
  if (record?.status === "done" && level) bits.push(isHard(record.difficulty) ? `${level}, ${copy().redoMeta}` : level);
  if (record?.usedHelp) bits.push(copy().helpMeta);
  if (record?.durationSec) bits.push(formatShort(record.durationSec, pageLocale()));
  return bits.join(" · ");
}

function difficultyLine(index: number, selected: Difficulty | null, lab: Lab): HTMLElement {
  const wrap = el("div", "flex flex-col gap-2 sm:col-span-3");
  const line = el("div", "flex items-center gap-2 overflow-x-auto");
  line.dataset.difficulty = String(index);
  line.append(el("span", "shrink-0 text-xs font-semibold tracking-[0.12em] text-muted uppercase", copy().difficulty));
  const group = el("div", "flex flex-nowrap items-center gap-1");
  group.setAttribute("role", "radiogroup");
  group.setAttribute("aria-label", copy().difficultyAria);
  for (const item of copy().levels) {
    const chosen = selected === item.id;
    const label = el("label", "diff-pill");
    label.dataset.level = item.id;
    label.dataset.selected = chosen ? "true" : "false";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = `difficulty-${index}`;
    input.className = "sr-only";
    input.checked = chosen;
    input.addEventListener("change", () => setDifficulty(index, item.id));
    label.append(input, document.createTextNode(item.label));
    group.append(label);
  }
  line.append(group);
  wrap.append(line);
  if (selected === "very_high") wrap.append(reviewVideos(lab));
  return wrap;
}

function reviewVideos(lab: Lab): HTMLElement {
  const note = el("div", "rounded-2xl border border-warn/40 bg-warn-soft px-3 py-2 text-sm leading-relaxed");
  note.append(el("p", "", copy().reviewVideos));
  if (lab.help.videos.length) {
    const list = el("ul", "mt-1 space-y-1");
    for (const video of lab.help.videos) {
      const li = el("li");
      li.append(anchor(video.url, video.title));
      list.append(li);
    }
    note.append(list);
  }
  return note;
}

function radioMark(index: number, value: "revisit" | "done", label: string, checked: boolean): HTMLElement {
  const wrap = el("label", "inline-flex cursor-pointer items-center gap-2 text-sm font-medium");
  const input = document.createElement("input");
  input.type = "radio";
  input.name = `mark-${index}`;
  input.value = value;
  input.checked = checked;
  input.className = "h-4 w-4 accent-ink";
  input.addEventListener("click", () => {
    const run = current();
    const record = run?.labs[index];
    if (!record) return;
    setMark(index, record.status === value ? "pending" : value);
  });
  wrap.append(input, document.createTextNode(label));
  return wrap;
}

function clockBar(run: Run, showLab: boolean): HTMLElement {
  const bar = el("section", "rounded-3xl border border-line bg-card p-4 sm:p-5");
  const counts = el("dl", "clock-counts");
  counts.style.setProperty("--clock-count", showLab ? "6" : "5");
  const scored = countedLabs(run.labs, run.edition);
  const leftTasks = scored.filter((item) => item.status !== "done" && item.status !== "skipped").length;
  const revisit = scored.filter((item) => item.status === "revisit").length;
  const done = scored.filter((item) => item.status === "done").length;
  const help = scored.filter((item) => item.usedHelp).length;
  const record = run.labs[run.currentIndex];
  if (showLab) counts.append(counter(copy().thisLab, formatClock(liveLabSec(record, run.currentIndex)), true));
  const redo = scored.filter((item) => item.status === "done" && isHard(item.difficulty)).length;
  counts.append(
    counter(copy().missing, String(leftTasks)),
    counter(copy().revisit, String(revisit)),
    counter(copy().done, String(done)),
    counter(copy().redoCount, String(redo)),
    counter(copy().withHelp, String(help)),
  );
  bar.append(counts);
  return bar;
}

function removeFloat(): void {
  window.removeEventListener("resize", onFloatResize);
  floatRoot?.remove();
  floatRoot = null;
  floatPauseBtn = null;
  floatLabel = null;
  globalClock = null;
  ringWrap = null;
  ringValue = null;
}

function defaultFloatPos(): { x: number; y: number } {
  const width = 168;
  return {
    x: Math.max(12, window.innerWidth - width - 20),
    y: Math.max(12, window.innerHeight - 140),
  };
}

function placeFloat(node: HTMLElement): void {
  const fallback = defaultFloatPos();
  const x = floatX ?? fallback.x;
  const y = floatY ?? fallback.y;
  const maxX = Math.max(8, window.innerWidth - node.offsetWidth - 8);
  const maxY = Math.max(8, window.innerHeight - node.offsetHeight - 8);
  const nextX = Math.min(Math.max(8, x), maxX);
  const nextY = Math.min(Math.max(8, y), maxY);
  node.style.left = `${nextX}px`;
  node.style.top = `${nextY}px`;
  floatX = nextX;
  floatY = nextY;
}

function syncFloat(run: Run): void {
  const left = remainingSec(run);
  const paused = run.mode === "pausable" && Boolean(run.pausedAt);
  if (!floatRoot) {
    floatRoot = el("aside", "exam-float");
    floatRoot.setAttribute("aria-label", copy().clock);
    const handle = el("div", "exam-float-handle");
    floatLabel = el("span", "", paused ? copy().paused : copy().clock);
    handle.append(floatLabel, el("span", "exam-float-grip", "⠿"));
    handle.title = copy().floatDrag;
    const ring = el("div", "exam-ring");
    ringWrap = ring;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 36 36");
    svg.setAttribute("aria-hidden", "true");
    const track = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    track.setAttribute("class", "exam-ring-track");
    track.setAttribute("cx", "18");
    track.setAttribute("cy", "18");
    track.setAttribute("r", String(RING_R));
    ringValue = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    ringValue.setAttribute("class", "exam-ring-value");
    ringValue.setAttribute("cx", "18");
    ringValue.setAttribute("cy", "18");
    ringValue.setAttribute("r", String(RING_R));
    svg.append(track, ringValue);
    ring.append(svg);
    globalClock = el("p", "stat-value text-center text-2xl font-semibold sm:text-3xl", formatClock(left));
    globalClock.dataset.globalClock = "true";
    globalClock.setAttribute("aria-live", "off");
    floatRoot.append(handle, ring, globalClock);
    paintClock(run);
    if (run.mode === "pausable") {
      floatPauseBtn = button(paused ? copy().resumeClock : copy().pause, "btn btn-primary");
      floatPauseBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        togglePause();
      });
      floatRoot.append(floatPauseBtn);
    }
    document.body.append(floatRoot);
    bindFloatDrag(floatRoot, handle);
    window.addEventListener("resize", onFloatResize);
    requestAnimationFrame(() => {
      if (floatRoot) placeFloat(floatRoot);
      saveUi();
    });
  } else {
    floatRoot.dataset.paused = paused ? "true" : "false";
    if (floatLabel) floatLabel.textContent = paused ? copy().paused : copy().clock;
    paintClock(run);
    if (floatPauseBtn) {
      floatPauseBtn.textContent = paused ? copy().resumeClock : copy().pause;
    }
  }
}

function onFloatResize(): void {
  if (floatRoot) placeFloat(floatRoot);
}

function bindFloatDrag(panel: HTMLElement, handle: HTMLElement): void {
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const onMove = (event: PointerEvent) => {
    if (!dragging) return;
    const maxX = Math.max(8, window.innerWidth - panel.offsetWidth - 8);
    const maxY = Math.max(8, window.innerHeight - panel.offsetHeight - 8);
    floatX = Math.min(Math.max(8, event.clientX - offsetX), maxX);
    floatY = Math.min(Math.max(8, event.clientY - offsetY), maxY);
    panel.style.left = `${floatX}px`;
    panel.style.top = `${floatY}px`;
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    panel.style.cursor = "";
    saveUi();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  };

  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragging = true;
    const rect = panel.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    panel.style.cursor = "grabbing";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  });
}

function counter(label: string, value: string, isLab = false): HTMLElement {
  const wrap = el("div", "rounded-2xl bg-paper px-3 py-2 text-center");
  wrap.append(el("dt", "text-xs text-muted", label));
  const dd = el("dd", "stat-value text-lg font-semibold", value);
  if (isLab) {
    labClock = dd;
    dd.dataset.labClock = "true";
  }
  wrap.append(dd);
  return wrap;
}

function objectiveList(lines: string[], className: string): HTMLElement {
  const list = el("ul", className);
  for (const line of lines) list.append(objectiveItem(line));
  return list;
}

function objectiveItem(line: string): HTMLElement {
  const li = el("li");
  const urls: string[] = [];
  const text = line
    .replace(/https?:\/\/[^\s]+/g, (raw) => {
      urls.push(raw.replace(/[.,;)]+$/, ""));
      return "";
    })
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;])/g, "$1")
    .trim();
  if (urls.length === 0) {
    li.textContent = line;
    return li;
  }
  li.append(document.createTextNode(text));
  const labels = { copy: copy().copyCmd, copied: copy().copiedCmd };
  for (const url of urls) {
    const row = el("div", "cmd-row mt-2");
    const code = el("code", "cmd-text");
    code.textContent = url;
    row.append(code, createCopyButton(url, labels));
    li.append(row);
  }
  return li;
}

function labCard(lab: Lab, record: LabRecord): HTMLElement {
  const card = el("article", "rounded-3xl border border-line bg-card p-5 sm:p-7");
  card.append(
    el("p", "text-xs font-semibold tracking-[0.16em] text-muted uppercase", `${labCode(lab.id)} · ${lab.where}`),
    el("h1", "mt-2 text-3xl font-semibold tracking-tight", lab.title),
  );
  if (lab.story) card.append(storyText(lab.story, "mt-3 text-base leading-relaxed text-ink/80"));
  card.append(
    objectiveList(lab.objective, "mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-ink/90 sm:text-lg"),
  );
  if (record.attempts > 1) {
    card.append(el("p", "mt-4 text-sm text-warn", copy().attempt(record.attempts)));
  }
  if (helpVisible) card.append(helpPanel(lab));
  return card;
}

function helpPanel(lab: Lab): HTMLElement {
  const panel = el("section", "mt-6 rounded-2xl border border-warn/40 bg-warn-soft p-4 sm:p-5");
  panel.setAttribute("aria-labelledby", "ayuda-titulo");
  panel.append(
    el("h2", "text-lg font-semibold", copy().helpAsked),
  );
  const title = panel.querySelector("h2");
  title?.setAttribute("id", "ayuda-titulo");
  title?.setAttribute("tabindex", "-1");
  panel.append(el("p", "mt-1 text-sm text-warn", copy().helpMarked));
  panel.append(el("p", "mt-3 text-sm leading-relaxed text-ink", lab.help.tip));
  const flowHtml = lvmLabFlowHtml(lab.id, pageLocale());
  if (flowHtml) {
    const flowWrap = el("div", "lvm-lab-flow-host");
    flowWrap.innerHTML = flowHtml;
    panel.append(flowWrap);
  }
  if (lab.steps.length) {
    panel.append(el("h3", "mt-4 text-sm font-semibold tracking-wide uppercase", copy().stepsTitle));
    const list = el("ol", "mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed");
    for (const step of lab.steps) list.append(el("li", "", step));
    panel.append(list);
  }
  if (lab.note) panel.append(el("p", "mt-3 text-sm leading-relaxed text-muted", lab.note));
  panel.append(el("h3", "mt-4 text-sm font-semibold tracking-wide uppercase", copy().commandsTitle));
  panel.append(renderCommands(lab.help.commands));
  if (lab.help.videos.length) {
    panel.append(el("h3", "mt-4 text-sm font-semibold tracking-wide uppercase", copy().videosTitle));
    const videos = el("ul", "mt-2 space-y-1 text-sm");
    for (const video of lab.help.videos) {
      const li = el("li");
      li.append(anchor(video.url, video.title));
      videos.append(li);
    }
    panel.append(videos);
  }
  panel.append(el("p", "mt-3 text-sm", lab.help.videoHint));
  return panel;
}

function actions(run: Run): HTMLElement {
  const record = run.labs[run.currentIndex];
  const row = el("div", "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center");
  const helpLabel = !record.usedHelp
    ? copy().askHelp
    : helpVisible
      ? copy().hideHelp
      : copy().showHelp;
  const helpBtn = button(helpLabel, "btn btn-warn");
  helpBtn.addEventListener("click", () => toggleHelp());
  const revisitBtn = button(copy().revisit, "btn btn-quiet");
  revisitBtn.addEventListener("click", () => setMark(run.currentIndex, "revisit"));
  const redoBtn = button(copy().redo, "btn btn-quiet");
  redoBtn.addEventListener("click", () => redo());
  const doneBtn = button(copy().done, "btn btn-primary");
  doneBtn.addEventListener("click", () => setMark(run.currentIndex, "done"));
  const skipBtn = button(copy().skipTask, record.status === "skipped" ? "btn-stuck" : "btn btn-quiet");
  skipBtn.addEventListener("click", () => setMark(run.currentIndex, "skipped"));
  row.append(helpBtn, revisitBtn, redoBtn, doneBtn, skipBtn);
  const wrap = el("div");
  wrap.append(row);
  if (record.status === "skipped") {
    const flag = stuckFlag();
    flag.classList.add("mt-3");
    wrap.append(flag);
  }
  if (record.status === "done") {
    const line = difficultyLine(run.currentIndex, record.difficulty ?? null, labs()[run.currentIndex]);
    line.classList.add("mt-3");
    wrap.append(line);
  }
  wrap.append(
    el(
      "p",
      "mt-3 text-sm text-muted",
      copy().actionsHint,
    ),
  );
  return wrap;
}

function summaryView(run: Run): HTMLElement {
  const scored = countedLabs(run.labs, run.edition);
  const done = scored.filter((item) => item.status === "done").length;
  const redo = scored.filter((item) => item.status === "done" && isHard(item.difficulty)).length;
  const skipped = scored.filter((item) => item.status === "skipped").length;
  const help = scored.filter((item) => item.usedHelp).length;
  const titles: Record<Run["status"], string> = {
    completed: copy().closed,
    timed_out: copy().timedOut,
    abandoned: copy().abandoned,
    in_progress: copy().inProgress,
  };
  const page = el("div", "flex flex-col gap-6 pb-10");
  const head = el("section", "rounded-3xl border border-line bg-card p-6 sm:p-8");
  head.append(
    el("p", "text-xs font-semibold tracking-[0.16em] text-muted uppercase", titles[run.status]),
    el("h1", "stat-value mt-2 text-4xl font-semibold", formatClock(wallSec(run))),
    el("p", "mt-3 text-lg", copy().tally({ done, revisit: scored.filter((item) => item.status === "revisit").length, redo, skipped, help })),
    el("p", "mt-2 text-sm text-muted", copy().summaryHint),
  );
  const row = el("div", "mt-6 flex flex-col gap-3 sm:flex-row");
  row.append(
    link(to("stats"), copy().seeStats, "btn btn-primary"),
    link(to("home"), copy().backHome, "btn btn-quiet"),
  );
  const remove = button(copy().deleteRun, "btn btn-danger mt-4 w-fit");
  remove.addEventListener("click", () => deleteCurrent());
  head.append(row, remove);
  page.append(head);

  const table = el("div", "overflow-hidden rounded-3xl border border-line bg-card");
  const summaryRows = [...labs().entries()].filter(([, lab]) => lab.track !== "setup");
  summaryRows.sort((a, b) => labCode(a[1].id).localeCompare(labCode(b[1].id)));
  for (const [index, lab] of summaryRows) {
    const record = run.labs[index];
    if (!record) continue;
    const stuck = record.status === "skipped";
    const line = el(
      "div",
      `grid grid-cols-[1fr_auto] gap-3 border-b border-line px-4 py-3 last:border-b-0 sm:px-5 ${stuck ? "lab-stuck" : ""}`,
    );
    const left = el("div");
    const title = el("p", "font-medium", `${labCode(lab.id)} · ${lab.title}`);
    left.append(title);
    if (stuck) {
      const flag = stuckFlag();
      flag.classList.add("mt-2");
      left.append(flag);
    }
    left.append(el("p", "text-sm text-muted", statusText(record)));
    line.append(left, el("p", "stat-value text-sm", record.durationSec == null ? "—" : formatShort(record.durationSec, pageLocale())));
    table.append(line);
  }
  page.append(table);
  return page;
}

function statusText(record: LabRecord): string {
  const ui = copy();
  const label =
    record.status === "done"
      ? ui.done
      : record.status === "revisit"
        ? ui.revisit
        : record.status === "skipped"
          ? ui.statusPassed
          : record.status === "redo"
            ? ui.statusRedo
            : record.durationSec != null
              ? ui.statusOpen
              : ui.statusNone;
  const level = record.status === "done" ? difficultyLabel(record.difficulty, pageLocale()) : "";
  const bits = [label];
  if (level) bits.push(isHard(record.difficulty) ? `${level}, ${ui.redoMeta}` : level);
  if (record.usedHelp) bits.push(ui.helpMeta);
  return bits.join(" · ");
}

function toggleHelp(): void {
  const run = current();
  if (!run || run.status !== "in_progress" || screen !== "lab") return;
  const record = run.labs[run.currentIndex];
  if (!record) return;
  if (!record.usedHelp) {
    record.usedHelp = true;
    helpVisible = true;
    commit(run);
  } else {
    helpVisible = !helpVisible;
  }
  saveUi();
  render();
  if (helpVisible) document.getElementById("ayuda-titulo")?.focus();
}

function redo(): void {
  const run = current();
  if (!run || run.status !== "in_progress" || screen !== "lab") return;
  const record = run.labs[run.currentIndex];
  if (!record) return;
  record.attempts += 1;
  record.startedAt = new Date().toISOString();
  record.finishedAt = null;
  record.durationSec = null;
  record.status = "redo";
  visitStart = Date.now();
  commit(run);
  render();
}

function openLab(index: number): void {
  const run = current();
  if (!run || run.status !== "in_progress" || labs()[index]?.track === "setup") return;
  if (visitStart != null) flushVisit(run.labs[run.currentIndex]);
  run.currentIndex = index;
  const record = run.labs[index];
  if (!record) return;
  if (record.attempts === 0) record.attempts = 1;
  if (!record.startedAt) record.startedAt = new Date().toISOString();
  visitStart = run.pausedAt ? null : Date.now();
  screen = "lab";
  helpVisible = false;
  commit(run);
  saveUi();
  render();
}

function backToBoard(): void {
  const run = current();
  if (!run) return;
  if (visitStart != null) flushVisit(run.labs[run.currentIndex]);
  screen = "board";
  helpVisible = false;
  focusLabIndex = run.currentIndex;
  commit(run);
  saveUi();
  render();
}

function setMark(index: number, status: LabRecord["status"]): void {
  const run = current();
  if (!run || run.status !== "in_progress") return;
  const record = run.labs[index];
  if (!record || labs()[index]?.track === "setup") return;
  if (screen === "lab" && run.currentIndex === index) flushVisit(record);
  record.status = status;
  if (status !== "done") record.difficulty = null;
  record.videosReviewed = false;
  record.reviewedVideoUrls = [];
  record.finishedAt = status === "pending" || status === "redo" ? null : new Date().toISOString();
  screen = "board";
  helpVisible = false;
  focusLabIndex = index;
  commit(run);
  saveUi();
  render();
}

function setDifficulty(index: number, difficulty: Difficulty): void {
  const run = current();
  if (!run || run.status !== "in_progress") return;
  const record = run.labs[index];
  if (!record || record.status !== "done" || record.difficulty === difficulty) return;
  record.difficulty = difficulty;
  commit(run);
  render();
}

async function deleteCurrent(): Promise<void> {
  const run = current();
  if (!run) return;
  const ui = copy();
  const ok = await ask({
    title: ui.askDelete,
    body: ui.confirmDelete,
    confirmLabel: ui.askDelete,
    cancelLabel: ui.askBack,
    confirmClass: "btn btn-warn",
  });
  if (!ok) return;
  deleteRun(run.id);
  runId = "";
  visitStart = null;
  screen = "board";
  helpVisible = false;
  sessionStorage.removeItem(UI_KEY);
  render();
}

function togglePause(): void {
  const run = current();
  if (!run || run.status !== "in_progress" || run.mode !== "pausable") return;
  if (run.pausedAt) {
    run.pausedSec += Math.max(0, (Date.now() - Date.parse(run.pausedAt)) / 1000);
    run.pausedAt = null;
    if (screen === "lab") visitStart = Date.now();
  } else {
    if (visitStart != null) flushVisit(run.labs[run.currentIndex]);
    run.pausedAt = new Date().toISOString();
  }
  commit(run);
  render();
}

function closeReport(run: Run, onPick: (index: number) => void): HTMLElement | null {
  const ui = copy();
  const edition = run.edition ?? loadEdition();
  const catalog = labs();
  const unmarked: { index: number; label: string }[] = [];
  const noLevel: { index: number; label: string }[] = [];
  for (const record of countedLabs(run.labs, edition)) {
    const index = run.labs.indexOf(record);
    const lab = catalog[index];
    if (!lab || index < 0) continue;
    const label = `${labCode(lab.id, edition)} · ${lab.title}`;
    const item = { index, label };
    if (record.status === "pending" || record.status === "redo") unmarked.push(item);
    else if (record.status === "done" && !record.difficulty) noLevel.push(item);
  }
  unmarked.sort((a, b) => a.label.localeCompare(b.label));
  noLevel.sort((a, b) => a.label.localeCompare(b.label));
  if (unmarked.length === 0 && noLevel.length === 0) return null;
  const body = el("div");
  body.append(el("p", "ask-body", ui.closeGapsLead));
  const group = (title: string, items: { index: number; label: string }[]) => {
    if (items.length === 0) return;
    body.append(el("p", "ask-kicker", title));
    const list = el("ul", "ask-list");
    for (const item of items) {
      const li = el("li");
      const link = button(item.label, "ask-link");
      link.addEventListener("click", () => {
        onPick(item.index);
        closeAsk();
      });
      li.append(link);
      list.append(li);
    }
    body.append(list);
  };
  group(ui.closeUnmarked, unmarked);
  group(ui.closeNoLevel, noLevel);
  return body;
}

async function closeRun(): Promise<void> {
  const run = current();
  if (!run || run.status !== "in_progress") return;
  const ui = copy();
  let jumpTo: number | null = null;
  const gaps = closeReport(run, (index) => {
    jumpTo = index;
  });
  const ok = await ask({
    title: gaps ? ui.closeGapsTitle : ui.closeRun,
    body: gaps ?? ui.confirmClose,
    confirmLabel: gaps ? ui.closeAnyway : ui.closeRun,
    cancelLabel: gaps ? ui.closeStay : ui.askBack,
    confirmClass: gaps ? "btn btn-quiet" : "btn btn-primary",
    cancelClass: gaps ? "btn btn-primary" : "btn btn-quiet",
  });
  if (!ok) {
    if (jumpTo != null) revealLab(jumpTo);
    return;
  }
  if (visitStart != null) flushVisit(run.labs[run.currentIndex]);
  if (run.pausedAt) {
    run.pausedSec += Math.max(0, (Date.now() - Date.parse(run.pausedAt)) / 1000);
    run.pausedAt = null;
  }
  run.status = "completed";
  run.finishedAt = new Date().toISOString();
  screen = "board";
  commit(run);
  render();
}

function renderCommands(items: LabCommand[]): HTMLElement {
  const list = el("ul", "mt-2 space-y-3");
  let i = 0;
  while (i < items.length) {
    const item = items[i];
    if (item.orGroup) {
      const groupId = item.orGroup;
      const group: LabCommand[] = [];
      while (i < items.length && items[i].orGroup === groupId) {
        group.push(items[i]);
        i += 1;
      }
      list.append(renderChoiceGroup(group));
      continue;
    }
    list.append(renderCommandItem(item));
    i += 1;
  }
  return list;
}

function choiceOptions(group: LabCommand[]): LabCommand[][] {
  const options: LabCommand[][] = [];
  for (const item of group) {
    const last = options.at(-1);
    if (last && item.orName && last[0].orName === item.orName) last.push(item);
    else options.push([item]);
  }
  return options;
}

function renderChoiceGroup(group: LabCommand[]): HTMLElement {
  const wrap = el("li", "help-choice");
  const options = choiceOptions(group);
  const sharedAs = group.every((item) => item.as && item.as === group[0].as);
  if (sharedAs && group[0].as) {
    wrap.append(
      el(
        "p",
        "mb-2 text-xs font-semibold tracking-[0.14em] text-warn uppercase",
        copy().asWho(group[0].as),
      ),
    );
  }
  wrap.append(el("p", "help-choice-banner", copy().helpPickOne));
  const inner = el("div", "help-choice-list");
  options.forEach((steps, index) => {
    const card = el("div", "help-choice-card");
    card.append(el("p", "help-choice-label", copy().helpOption(index + 1, steps[0].orName)));
    steps.forEach((item) => {
      const step = el("div", "help-choice-step");
      if (!sharedAs && item.as) {
        step.append(
          el(
            "p",
            "mb-1 text-xs font-semibold tracking-[0.14em] text-warn uppercase",
            copy().asWho(item.as),
          ),
        );
      }
      step.append(commandRow(item.cmd, item.slip), el("p", "mt-1 text-sm text-muted whitespace-pre-line", item.why));
      card.append(step);
    });
    inner.append(card);
  });
  wrap.append(inner);
  return wrap;
}

function renderCommandItem(item: LabCommand): HTMLElement {
  const li = el("li");
  if (item.as) {
    li.append(
      el(
        "p",
        "mb-1 text-xs font-semibold tracking-[0.14em] text-warn uppercase",
        copy().asWho(item.as),
      ),
    );
  }
  li.append(commandRow(item.cmd, item.slip), el("p", "mt-1 text-sm text-muted whitespace-pre-line", item.why));
  return li;
}

function commandRow(cmd: string, slip?: string): HTMLElement {
  const row = el("div", "cmd-row");
  const text = el("code", "cmd-text");
  text.textContent = cmd;
  row.append(text);
  if (slip) row.append(slipMark(slip));
  row.append(createCopyButton(cmd, { copy: copy().copyCmd, copied: copy().copiedCmd }));
  return row;
}

function slipMark(text: string): HTMLElement {
  const wrap = el("span", "slip");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "slip-mark";
  btn.setAttribute("aria-label", copy().slipLabel);
  btn.setAttribute("aria-expanded", "false");
  btn.textContent = "!";
  const pop = el("span", "slip-pop", text);
  pop.setAttribute("role", "tooltip");
  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = wrap.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  wrap.append(btn, pop);
  return wrap;
}

function storyText(story: string, className: string): HTMLElement {
  const parts = story.split(/\n\n+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return el("p", className, parts[0] ?? story);
  const wrap = el("div", className);
  parts.forEach((part, index) => wrap.append(el("p", index === 0 ? "" : "mt-2", part)));
  return wrap;
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

function anchor(href: string, text: string): HTMLAnchorElement {
  const node = link(href, text, "font-medium underline decoration-line underline-offset-2");
  node.target = "_blank";
  node.rel = "noopener noreferrer";
  const extra = document.createElement("span");
  extra.className = "sr-only";
  extra.textContent = `, ${copy().opensNew}`;
  node.append(extra);
  return node;
}
