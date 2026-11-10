import { exampleCommands, glossaryFor, tldrUrl, type GlossaryEntry } from "../lib/glossary";
import { getUI, pageLocale, routePath } from "../lib/i18n";
import { lvmDiagramHtml } from "../lib/lvm-diagram";
import { createCopyButton } from "./copy-btn";

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "CODE", "PRE", "KBD", "A", "BUTTON"]);

let entries: GlossaryEntry[] = [];
let sortedTerms: { term: string; entry: GlossaryEntry; re: RegExp }[] = [];
let overlay: HTMLElement | null = null;
let input: HTMLInputElement | null = null;
let results: HTMLElement | null = null;
let empty: HTMLElement | null = null;
let detail: HTMLElement | null = null;
let tip: HTMLElement | null = null;
let tipMark: HTMLElement | null = null;
let tipTimer = 0;
let returnFocus: HTMLElement | null = null;
/** Term pinned in the popup list; null = show every search match. */
let selectedTerm: string | null = null;

export function openGlossaryPopup(prefill = ""): void {
  openPopup(prefill);
}

export function mountGlossaryPopup(): void {
  const locale = pageLocale();
  const ui = getUI(locale);
  entries = glossaryFor(locale);
  // Single-letter aliases (u/g/o from ugo) must not auto-link: Spanish "o" = "or".
  const MIN_LINK_LEN = 2;
  const linkWords: { term: string; entry: GlossaryEntry }[] = [];
  for (const entry of entries) {
    if (entry.term.trim().length >= MIN_LINK_LEN) linkWords.push({ term: entry.term, entry });
    for (const alias of entry.aliases ?? []) {
      const word = alias.trim();
      if (word.length < MIN_LINK_LEN) continue;
      linkWords.push({ term: word, entry });
    }
  }
  sortedTerms = linkWords
    .slice()
    .sort((a, b) => b.term.length - a.term.length)
    .map((item) => ({
      term: item.term,
      entry: item.entry,
      // No lookbehind: (^|[^...]) captures the boundary; word is group 2.
      re: new RegExp(`(^|[^\\w.-])(${escapeRegExp(item.term)})(?=[^\\w.-]|$)`, "gi"),
    }));

  ensureUi(ui);
  underlineRoot(document.getElementById("contenido"));
  watchDynamic();

  document.addEventListener("keydown", (event) => {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k" || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
      if (target.id === "glossary-popup-input") return;
      // still open over normal inputs in the exam UI
    }
    event.preventDefault();
    openPopup();
  });
}

function ensureUi(ui: ReturnType<typeof getUI>): void {
  if (overlay) return;
  overlay = document.createElement("div");
  overlay.id = "glossary-popup";
  overlay.className = "glossary-popup hidden";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", ui.glossaryHeading);
  overlay.innerHTML = `
    <div class="glossary-popup-backdrop" data-close></div>
    <div class="glossary-popup-panel">
      <div class="glossary-popup-head">
        <p class="glossary-popup-kicker">${escapeHtml(ui.glossaryHeading)} · Ctrl+K</p>
        <button type="button" class="glossary-popup-x" data-close aria-label="${escapeHtml(ui.glossaryPopupClose)}">×</button>
      </div>
      <input id="glossary-popup-input" type="search" autocomplete="off" spellcheck="false" placeholder="${escapeHtml(ui.glossaryPopupSearch)}" aria-label="${escapeHtml(ui.glossaryPopupSearch)}" />
      <p id="glossary-popup-empty" class="glossary-popup-empty hidden" aria-live="polite">${escapeHtml(ui.glossarySearchEmpty)}</p>
      <div id="glossary-popup-results" class="glossary-popup-results"></div>
      <div id="glossary-popup-detail" class="glossary-popup-detail hidden"></div>
      <p class="glossary-popup-foot">
        <a class="underline decoration-line" href="${routePath(pageLocale(), "glossary")}">${escapeHtml(ui.glossaryNav)}</a>
      </p>
    </div>
  `;
  document.body.append(overlay);
  tip = document.createElement("div");
  tip.id = "glossary-tip";
  tip.className = "glossary-tip";
  tip.hidden = true;
  tip.setAttribute("role", "tooltip");
  document.body.append(tip);
  tip.addEventListener("mouseenter", () => window.clearTimeout(tipTimer));
  tip.addEventListener("mouseleave", queueHideTip);
  document.addEventListener(
    "scroll",
    (event) => {
      const target = event.target;
      if (tip && target instanceof Node && tip.contains(target)) return;
      hideTip();
    },
    true,
  );
  input = overlay.querySelector("#glossary-popup-input");
  results = overlay.querySelector("#glossary-popup-results");
  empty = overlay.querySelector("#glossary-popup-empty");
  detail = overlay.querySelector("#glossary-popup-detail");

  overlay.querySelectorAll("[data-close]").forEach((node) => {
    node.addEventListener("click", () => closePopup());
  });
  detail?.addEventListener("click", (event) => {
    const panel = detail;
    if (!panel) return;
    const btn = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(".glossary-ref");
    if (!btn || !panel.contains(btn)) return;
    event.preventDefault();
    const target = findEntry(btn.dataset.jump ?? "");
    if (!target) return;
    selectedTerm = target.term;
    if (input) input.value = "";
    showDetail(target);
    renderResults("");
  });
  input?.addEventListener("input", () => {
    selectedTerm = null;
    hideDetail();
    renderResults(input?.value ?? "");
  });
  document.addEventListener("keydown", (event) => {
    if (!overlay || overlay.classList.contains("hidden")) {
      if (event.key === "Escape") hideTip();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closePopup();
      return;
    }
    if (event.key !== "Tab") return;
    const panel = overlay.querySelector(".glossary-popup-panel");
    if (!panel) return;
    const items = [...panel.querySelectorAll<HTMLElement>("a, button, input, textarea, select")].filter(
      (node) => !node.hasAttribute("disabled") && node.getClientRects().length > 0,
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !panel.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function openPopup(prefill = ""): void {
  if (!overlay || !input) return;
  hideTip();
  const active = document.activeElement;
  returnFocus = active instanceof HTMLElement ? active : null;
  overlay.classList.remove("hidden");
  input.value = prefill;
  const resolved = prefill.trim() ? findEntry(prefill.trim()) : undefined;
  selectedTerm = resolved?.term ?? (prefill.trim() ? prefill.trim() : null);
  renderResults(selectedTerm ?? prefill);
  if (resolved) showDetail(resolved);
  else if (selectedTerm) showDetail(findEntry(selectedTerm));
  else hideDetail();
  requestAnimationFrame(() => input?.focus());
}

function closePopup(): void {
  overlay?.classList.add("hidden");
  selectedTerm = null;
  hideDetail();
  const back = returnFocus;
  returnFocus = null;
  back?.focus();
}

/** Lower = better. Title / alias beats definition/example. */
function glossaryRank(entry: GlossaryEntry, q: string): number {
  if (!q) return 0;
  const term = entry.term.toLowerCase();
  const aliases = (entry.aliases ?? []).map((alias) => alias.toLowerCase());
  if (term === q || aliases.includes(q)) return 0;
  if (term.startsWith(q) || aliases.some((alias) => alias.startsWith(q))) return 1;
  if (term.includes(q) || aliases.some((alias) => alias.includes(q))) return 2;
  return 3;
}

function renderResults(query: string): void {
  if (!results || !empty) return;
  const q = query.trim().toLowerCase();
  if (selectedTerm) {
    const still = entries.some((entry) => {
      if (entry.term.toLowerCase() !== selectedTerm!.toLowerCase()) return false;
      if (!q) return true;
      const hay = `${entry.term} ${(entry.aliases ?? []).join(" ")} ${entry.definition} ${entry.example ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
    if (!still) selectedTerm = null;
  }
  const matches = entries.filter((entry) => {
    if (!q) return true;
    const hay = `${entry.term} ${(entry.aliases ?? []).join(" ")} ${entry.definition} ${entry.example ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
  if (q) {
    matches.sort((a, b) => glossaryRank(a, q) - glossaryRank(b, q) || a.term.localeCompare(b.term));
  }
  const visible = selectedTerm
    ? matches.filter((entry) => entry.term.toLowerCase() === selectedTerm!.toLowerCase())
    : matches;
  empty.classList.toggle("hidden", visible.length > 0);
  const pinned = selectedTerm != null && visible.length > 0;
  results.classList.toggle("hidden", pinned);
  results.replaceChildren();
  if (pinned) return;
  const qHighlight = (input?.value ?? "").trim();
  for (const entry of visible.slice(0, 40)) {
    const btn = document.createElement("button");
    btn.type = "button";
    const active = selectedTerm != null && entry.term.toLowerCase() === selectedTerm.toLowerCase();
    btn.className = active ? "glossary-popup-item is-selected" : "glossary-popup-item";
    btn.setAttribute("aria-pressed", active ? "true" : "false");
    const preview = entry.definition.replace(/\s+/g, " ").trim();
    btn.innerHTML = `<span class="mono">${highlightHtml(escapeHtml(entry.term), qHighlight)}</span><span>${highlightHtml(escapeHtml(preview), qHighlight)}</span>`;
    btn.addEventListener("click", () => toggleSelect(entry));
    results.append(btn);
  }
}

function toggleSelect(entry: GlossaryEntry): void {
  if (selectedTerm && selectedTerm.toLowerCase() === entry.term.toLowerCase()) {
    selectedTerm = null;
    hideDetail();
  } else {
    selectedTerm = entry.term;
    showDetail(entry);
  }
  renderResults(input?.value ?? "");
}

function showDetail(entry: GlossaryEntry | undefined): void {
  if (!detail || !entry) {
    hideDetail();
    return;
  }
  const ui = getUI(pageLocale());
  const labels = { copy: ui.copyCmd, copied: ui.copiedCmd };
  const query = (input?.value ?? "").trim();
  detail.classList.remove("hidden");
  detail.replaceChildren();

  const termRow = document.createElement("div");
  termRow.className = "glossary-term-row";
  const term = document.createElement("span");
  term.className = "glossary-popup-term mono";
  term.innerHTML = highlightHtml(escapeHtml(entry.term), query);
  termRow.append(term, createCopyButton(entry.term, labels));
  detail.append(termRow);

  const def = document.createElement("p");
  def.className = "glossary-popup-def";
  def.innerHTML = highlightHtml(linkifyHtml(entry.definition, entry.term), query);
  detail.append(def);

  if (entry.term === "LVM") {
    const holder = document.createElement("div");
    holder.innerHTML = lvmDiagramHtml(pageLocale());
    const fig = holder.firstElementChild;
    if (fig) detail.append(fig);
  }

  for (const cmd of exampleCommands(entry.example)) {
    const exRow = document.createElement("div");
    exRow.className = "cmd-row glossary-popup-ex-row";
    const ex = document.createElement("code");
    ex.className = "cmd-text";
    ex.innerHTML = highlightHtml(escapeHtml(cmd), query);
    exRow.append(ex, createCopyButton(cmd, labels));
    detail.append(exRow);
  }

  if (entry.tldr) {
    const tldr = document.createElement("p");
    const link = document.createElement("a");
    link.href = tldrUrl(entry.tldr);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "underline decoration-line";
    link.append(document.createTextNode(ui.glossaryTldr));
    const extra = document.createElement("span");
    extra.className = "sr-only";
    extra.textContent = `, ${ui.opensNew}`;
    link.append(extra);
    tldr.className = "glossary-popup-tldr";
    tldr.append(link);
    detail.append(tldr);
  }
}

/** Cross-link other glossary terms inside popup definitions (same idea as /glosario). */
function linkifyHtml(text: string, selfTerm: string): string {
  type Hit = { index: number; length: number; word: string; targetTerm: string };
  const hits: Hit[] = [];
  for (const item of sortedTerms) {
    if (item.entry.term === selfTerm) continue;
    item.re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = item.re.exec(text))) {
      const index = match.index + match[1].length;
      const word = match[2];
      const length = word.length;
      const overlaps = hits.some((hit) => index < hit.index + hit.length && index + length > hit.index);
      if (!overlaps) hits.push({ index, length, word, targetTerm: item.entry.term });
    }
  }
  hits.sort((a, b) => a.index - b.index || b.length - a.length);
  let out = "";
  let cursor = 0;
  for (const hit of hits) {
    if (hit.index < cursor) continue;
    out += escapeHtml(text.slice(cursor, hit.index));
    out += `<button type="button" class="glossary-ref" data-jump="${escapeHtml(hit.targetTerm)}">${escapeHtml(hit.word)}</button>`;
    cursor = hit.index + hit.length;
  }
  out += escapeHtml(text.slice(cursor));
  return out;
}

function highlightHtml(html: string, query: string): string {
  const needle = query.trim();
  if (!needle) return html;
  const parts = html.split(/(<[^>]+>)/);
  const lowerNeedle = needle.toLowerCase();
  return parts
    .map((part) => {
      if (!part || part.startsWith("<")) return part;
      const lower = part.toLowerCase();
      let out = "";
      let index = 0;
      while (index < part.length) {
        const at = lower.indexOf(lowerNeedle, index);
        if (at === -1) {
          out += part.slice(index);
          break;
        }
        out += part.slice(index, at);
        out += `<mark class="glossary-hit">${part.slice(at, at + needle.length)}</mark>`;
        index = at + needle.length;
      }
      return out;
    })
    .join("");
}

function showTip(mark: HTMLElement, text: string): void {
  if (!tip || (overlay && !overlay.classList.contains("hidden"))) return;
  window.clearTimeout(tipTimer);
  if (tipMark && tipMark !== mark) tipMark.removeAttribute("aria-describedby");
  tipMark = mark;
  mark.setAttribute("aria-describedby", "glossary-tip");
  tip.textContent = text;
  tip.hidden = false;
  tip.scrollTop = 0;
  const rect = mark.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  const margin = 8;
  let top = rect.top - tipRect.height - margin;
  if (top < margin) top = rect.bottom + margin;
  const maxTop = window.innerHeight - tipRect.height - margin;
  if (top > maxTop) top = Math.max(margin, maxTop);
  if (top < margin) top = margin;
  let left = rect.left;
  const maxLeft = window.innerWidth - tipRect.width - margin;
  if (left > maxLeft) left = Math.max(margin, maxLeft);
  if (left < margin) left = margin;
  tip.style.top = `${top}px`;
  tip.style.left = `${left}px`;
}

function queueHideTip(): void {
  window.clearTimeout(tipTimer);
  tipTimer = window.setTimeout(hideTip, 150);
}

function hideTip(): void {
  window.clearTimeout(tipTimer);
  tipMark?.removeAttribute("aria-describedby");
  tipMark = null;
  if (!tip) return;
  tip.hidden = true;
}

function hideDetail(): void {
  if (!detail) return;
  detail.classList.add("hidden");
  detail.replaceChildren();
}

function findEntry(term: string): GlossaryEntry | undefined {
  const needle = term.trim().toLowerCase();
  return entries.find(
    (entry) =>
      entry.term.toLowerCase() === needle ||
      (entry.aliases ?? []).some((alias) => alias.toLowerCase() === needle),
  );
}

function underlineRoot(root: HTMLElement | null): void {
  if (!root || sortedTerms.length === 0) return;
  if (root.closest("#glossary-list") || root.id === "glossary-list") return;
  walk(root);
}

function walk(node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    if (!text.trim()) return;
    const parent = node.parentElement;
    if (
      !parent ||
      parent.closest(".glossary-mark, .glossary-popup, .glossary-hit, .glossary-ref, #glossary-list, #glossary-data, code, pre, a, button, kbd, mark")
    ) {
      return;
    }

    let matched: { term: string; entry: GlossaryEntry; index: number; prefixLen: number } | null = null;
    for (const item of sortedTerms) {
      item.re.lastIndex = 0;
      const hit = item.re.exec(text);
      if (hit && hit.index != null) {
        matched = {
          term: hit[2],
          entry: item.entry,
          index: hit.index + hit[1].length,
          prefixLen: hit[1].length,
        };
        break;
      }
    }
    if (!matched) return;

    const frag = document.createDocumentFragment();
    if (matched.index > 0) frag.append(document.createTextNode(text.slice(0, matched.index)));
    const mark = document.createElement("span");
    mark.className = "glossary-mark";
    mark.setAttribute("role", "button");
    mark.tabIndex = 0;
    mark.textContent = matched.term;
    const definition = matched.entry.definition;
    mark.addEventListener("mouseenter", () => showTip(mark, definition));
    mark.addEventListener("mouseleave", queueHideTip);
    mark.addEventListener("focus", () => showTip(mark, definition));
    mark.addEventListener("blur", hideTip);
    const open = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      hideTip();
      openPopup(matched!.entry.term);
      showDetail(matched!.entry);
    };
    mark.addEventListener("click", open);
    mark.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        hideTip();
        return;
      }
      if (event.key === "Enter" || event.key === " ") open(event);
    });
    frag.append(mark);
    const rest = text.slice(matched.index + matched.term.length);
    const restNode = document.createTextNode(rest);
    frag.append(restNode);
    parent.replaceChild(frag, node);
    if (rest) walk(restNode);
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as HTMLElement;
  if (
    SKIP.has(el.tagName) ||
    el.classList.contains("glossary-mark") ||
    el.id === "glossary-popup" ||
    el.id === "glossary-list" ||
    el.id === "glossary-data" ||
    el.closest(".term")
  ) {
    return;
  }
  const children = Array.from(el.childNodes);
  for (const child of children) walk(child);
}

function watchDynamic(): void {
  const root = document.getElementById("contenido");
  if (!root) return;
  let timer = 0;
  let marking = false;
  const obs = new MutationObserver((records) => {
    if (marking) return;
    const onlyMarks = records.every((record) =>
      Array.from(record.addedNodes).every(
        (node) =>
          node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).classList?.contains("glossary-mark"),
      ),
    );
    if (onlyMarks && records.every((record) => record.removedNodes.length === 0)) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      marking = true;
      try {
        underlineRoot(root);
      } finally {
        marking = false;
      }
    }, 80);
  });
  obs.observe(root, { childList: true, subtree: true, characterData: true });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
