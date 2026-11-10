import { getUI, pageLocale, routePath } from "../lib/i18n";
import { loadEdition, saveEdition, type Edition } from "../lib/labs";
import {
  activeRun,
  closedRuns,
  countedLabs,
  filterRuns,
  isHard,
  loadStore,
  PAUSABLE_ENABLED,
  runKind,
  startRun,
  wallSec,
  type ExamMode,
  type Run,
  type Store,
} from "../lib/storage";
import { deltaLabel, formatClock, formatDelta, formatWhen } from "../lib/time";
import { ask } from "./ask";

export function mountHome(): void {
  const pausable = document.getElementById("start-pausable");
  const fixed = document.getElementById("start-fixed");
  const resume = document.getElementById("resume-exam");
  const ui = getUI(pageLocale());
  const locale = pageLocale();

  resume?.addEventListener("click", () => {
    location.href = routePath(pageLocale(), "practice");
  });
  const begin = async (mode: ExamMode) => {
    const running = activeRun();
    const selected = loadEdition();
    if (running && (running.edition ?? "v9") !== selected) {
      const ok = await ask({
        title: ui.askStart,
        body: ui.confirmStartOther(editionName(running.edition), editionName(selected)),
        confirmLabel: ui.askStart,
        cancelLabel: ui.askBack,
      });
      if (!ok) return;
    } else if (running) {
      return;
    }
    startRun(mode, selected);
    location.href = routePath(locale, "practice");
  };
  pausable?.addEventListener("click", () => begin("pausable"));
  fixed?.addEventListener("click", () => begin("fixed"));

  paintEdition(loadEdition());

  const store = loadStore();
  fillModeSummary(store, "fixed", "stat-fixed");
  fillModeSummary(store, "pausable", "stat-pausable");
  fillDelta(store, "fixed", "stat-delta-fixed");
  fillDelta(store, "pausable", "stat-delta-pausable");
  syncStatsLinks(store);

  const last = closedRuns(store)[0];
  const lastBox = document.getElementById("last-run");
  if (!lastBox || !last) return;
  lastBox.classList.remove("hidden");
  const when = lastBox.querySelector("[data-when]");
  const detail = lastBox.querySelector("[data-detail]");
  if (when) when.textContent = formatWhen(last.startedAt, locale);
  if (detail) {
    const scored = countedLabs(last.labs, last.edition);
    const done = scored.filter((lab) => lab.status === "done").length;
    const revisit = scored.filter((lab) => lab.status === "revisit").length;
    const passed = scored.filter((lab) => lab.status === "skipped").length;
    const asked = scored.filter((lab) => lab.usedHelp).length;
    const redo = scored.filter((lab) => lab.status === "done" && isHard(lab.difficulty)).length;
    const modeLabel = last.mode === "fixed" ? ui.seeStatsFixed : ui.seeStatsPausable;
    detail.textContent = `${modeLabel} · ${formatClock(wallSec(last))} · ${ui.tally({ done, revisit, redo, skipped: passed, help: asked })}`;
  }
}

function syncStatsLinks(store: Store): void {
  const ui = getUI(pageLocale());
  const empty = store.runs.length === 0;
  const href = empty
    ? `${routePath(pageLocale(), "stats")}?mode=fixed#stats-import`
    : `${routePath(pageLocale(), "stats")}?mode=fixed`;
  const label = empty ? ui.seeStatsImport : ui.seeStats;
  for (const link of document.querySelectorAll<HTMLAnchorElement>("[data-see-stats]")) {
    link.href = href;
    link.textContent = label;
  }
}

function paintEdition(edition: Edition): void {
  for (const id of ["v10", "v9"] as const) {
    const button = document.getElementById(`edition-${id}`);
    if (!button) continue;
    const on = edition === id;
    button.classList.toggle("is-on", on);
    button.setAttribute("aria-pressed", on ? "true" : "false");
    button.onclick = () => {
      saveEdition(id);
      paintEdition(id);
    };
  }
  syncHomeActions();
}

function editionName(edition: Edition | undefined): string {
  const ui = getUI(pageLocale());
  return edition === "v9" ? ui.editionV9 : ui.editionV10;
}

function openNote(running: Run): string {
  const ui = getUI(pageLocale());
  const when = formatWhen(running.startedAt, pageLocale());
  if (running.pausedAt) return ui.startedPausedNote(when);
  if (running.mode === "fixed") return ui.startedNote(when);
  return ui.startedPausableNote(when);
}

function syncHomeActions(): void {
  const running = activeRun();
  const selected = loadEdition();
  const ui = getUI(pageLocale());
  const same = Boolean(running && (running.edition ?? "v9") === selected);
  const resumeWrap = document.getElementById("resume-wrap");
  const resume = document.getElementById("resume-exam");
  const startLabel = document.getElementById("start-modes-label");
  const startHints = document.getElementById("start-hints");
  const editionNext = document.getElementById("edition-next");
  const note = document.getElementById("start-note");
  const fixed = document.getElementById("start-fixed");
  const pausable = document.getElementById("start-pausable");

  if (!running) {
    resumeWrap?.classList.add("hidden");
    editionNext?.classList.add("hidden");
    if (startLabel) {
      startLabel.hidden = false;
      startLabel.textContent = ui.startModesLabel;
    }
    if (startHints) startHints.hidden = false;
    if (fixed) fixed.hidden = false;
    if (pausable) pausable.hidden = !PAUSABLE_ENABLED;
    return;
  }

  if (same) {
    resumeWrap?.classList.remove("hidden");
    editionNext?.classList.add("hidden");
    if (resume) resume.textContent = ui.resumeEdition(editionName(selected));
    if (note) note.textContent = openNote(running);
    if (startLabel) startLabel.hidden = true;
    if (startHints) startHints.hidden = true;
    if (fixed) fixed.hidden = true;
    if (pausable) pausable.hidden = true;
    return;
  }

  resumeWrap?.classList.add("hidden");
  if (editionNext) {
    editionNext.classList.remove("hidden");
    editionNext.textContent = ui.editionSwitch(editionName(running.edition), editionName(selected));
  }
  if (startLabel) {
    startLabel.hidden = false;
    startLabel.textContent = ui.startModesLabel;
  }
  if (startHints) startHints.hidden = true;
  if (fixed) fixed.hidden = false;
  if (pausable) pausable.hidden = !PAUSABLE_ENABLED;
}

function fillModeSummary(store: Store, mode: ExamMode, prefix: string): void {
  const scoped = filterRuns(store, mode);
  const examRuns = scoped.runs.filter((run) => runKind(run) === "exam");
  const comparable = examRuns
    .filter((run) => run.status === "completed" || run.status === "timed_out")
    .sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
  const best = comparable.filter((run) => run.status === "completed").sort((a, b) => wallSec(a) - wallSec(b))[0];
  const help = examRuns.reduce((sum, run) => sum + countedLabs(run.labs, run.edition).filter((lab) => lab.usedHelp).length, 0);
  const skipped = examRuns.reduce(
    (sum, run) => sum + countedLabs(run.labs, run.edition).filter((lab) => lab.status === "skipped").length,
    0,
  );

  setText(`${prefix}-runs`, String(examRuns.length));
  setText(`${prefix}-best`, best ? formatClock(wallSec(best)) : "—");
  setText(`${prefix}-help`, String(help));
  setText(`${prefix}-skip`, String(skipped));
  if (prefix === "stat-fixed") {
    setText("shell-runs", String(scoped.runs.length));
    setText("shell-best", best ? formatClock(wallSec(best)) : "—");
    setText("shell-help", String(help));
  }
}

function fillDelta(store: Store, mode: ExamMode, id: string): void {
  const ui = getUI(pageLocale());
  const locale = pageLocale();
  const scoped = filterRuns(store, mode);
  const examRuns = scoped.runs.filter((run) => runKind(run) === "exam");
  const comparable = examRuns
    .filter((run) => run.status === "completed" || run.status === "timed_out")
    .sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
  const latest = comparable.at(-1);
  const previous = comparable.at(-2);
  const delta = document.getElementById(id);
  if (!delta) return;
  if (latest && previous) {
    const diff = wallSec(latest) - wallSec(previous);
    delta.textContent = ui.deltaLine(formatDelta(diff, locale), deltaLabel(diff, locale));
  } else if (latest) {
    delta.textContent = ui.firstClose(formatClock(wallSec(latest)));
  } else if (examRuns.length > 0) {
    delta.textContent = ui.openRun;
  } else {
    delta.textContent = ui.noCloseYet;
  }
}

function setText(id: string, value: string): void {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}
