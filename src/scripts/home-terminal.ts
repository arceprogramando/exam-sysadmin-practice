import { glossaryFor, type GlossaryEntry } from "../lib/glossary";
import { getUI, pageLocale } from "../lib/i18n";

/**
 * Practice prompt on the home page. Looks up glossaryFor(pageLocale()) only.
 * It never shells out and never reads or writes exam storage.
 */

type Block = { className: string; text: string };

/** Commands this prompt accepts. `man` is the only one that takes a glossary term. */
const COMMANDS = ["man", "terms", "help", "clear"] as const;

export function mountHomeTerminal(): void {
  const logNode = document.getElementById("home-term-log");
  const inputNode = document.getElementById("home-term-input");
  const bodyNode = document.querySelector(".term .term__body");
  if (!(logNode instanceof HTMLElement) || !(inputNode instanceof HTMLInputElement) || !(bodyNode instanceof HTMLElement)) return;
  const log = logNode;
  const input = inputNode;
  const body = bodyNode;

  const locale = pageLocale();
  const ui = getUI(locale);
  const entries = glossaryFor(locale);
  const history: string[] = [];
  let historyAt = 0;
  let draft = "";
  let tabListedFor: string | null = null;

  input.addEventListener("input", () => {
    tabListedFor = null;
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      event.preventDefault();
      event.stopPropagation();
      if (!event.shiftKey) completeAtTab(input, log, entries, locale, () => tabListedFor, (value) => {
        tabListedFor = value;
      });
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      tabListedFor = null;
      const line = input.value.trim();
      input.value = "";
      draft = "";
      if (!line) return;
      history.push(line);
      historyAt = history.length;
      run(line);
      return;
    }
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    if (history.length === 0) return;
    if (event.key === "ArrowDown" && historyAt === history.length) return;
    event.preventDefault();
    tabListedFor = null;
    if (event.key === "ArrowUp") {
      if (historyAt === history.length) draft = input.value;
      if (historyAt > 0) historyAt -= 1;
      input.value = history[historyAt] ?? "";
    } else {
      historyAt += 1;
      input.value = historyAt === history.length ? draft : (history[historyAt] ?? "");
    }
    input.setSelectionRange(input.value.length, input.value.length);
  });

  body.addEventListener("click", (event) => {
    if (event.target === input) return;
    const selected = window.getSelection()?.toString() ?? "";
    if (selected.length > 0) return;
    input.focus();
  });

  function run(line: string): void {
    if (line.toLowerCase() === "clear") {
      log.replaceChildren();
      return;
    }
    const entry = document.createElement("div");
    entry.className = "term__entry";
    entry.append(echo(line));
    for (const block of blocksFor(line, entries, ui)) entry.append(paragraph(block));
    log.append(entry);
    log.scrollTop = log.scrollHeight;
  }
}

function blocksFor(
  line: string,
  entries: GlossaryEntry[],
  ui: ReturnType<typeof getUI>,
): Block[] {
  const lower = line.toLowerCase();
  if (lower === "help") return ui.shellHelp.map((text) => ({ className: "term__help", text }));
  if (lower === "terms") {
    return [{ className: "term__help", text: entries.map((entry) => entry.term).join("\n") }];
  }

  const man = /^man\s+([\s\S]+)$/i.exec(line);
  const term = man ? man[1].trim() : line;
  if (man && !term) return [{ className: "term__err", text: ui.shellManMissing }];

  const found = findEntry(entries, term);
  if (!found) return [{ className: "term__err", text: ui.shellUnknown(term) }];

  const blocks: Block[] = [{ className: "term__def", text: found.definition }];
  if (found.example) blocks.push({ className: "term__example", text: `${ui.shellExample}: ${found.example}` });
  return blocks;
}

/**
 * Full term first, so `ls -lan` beats `ls`.
 * If the line has extra words, the longest matching term still wins (`dnf install -y` → dnf).
 */
function findEntry(entries: GlossaryEntry[], term: string): GlossaryEntry | undefined {
  const needle = term.trim().toLowerCase();
  if (!needle) return undefined;
  const parts = needle.split(/\s+/);
  for (let size = parts.length; size >= 1; size -= 1) {
    const prefix = parts.slice(0, size).join(" ");
    const hit = entries.find((entry) => entry.term.toLowerCase() === prefix);
    if (hit) return hit;
  }
  return undefined;
}

type Completion = {
  matches: string[];
  /** Text already typed for this slot. A later Tab inserts a longer common prefix. */
  typed: string;
  apply: (next: string) => string;
};

function completeAtTab(
  input: HTMLInputElement,
  log: HTMLElement,
  entries: GlossaryEntry[],
  locale: string,
  listedFor: () => string | null,
  setListedFor: (value: string | null) => void,
): void {
  const raw = input.value;
  const completion = resolveCompletion(raw, entries, locale);
  if (completion.matches.length === 0) {
    setListedFor(null);
    return;
  }
  if (completion.matches.length === 1) {
    const next = completion.apply(completion.matches[0]);
    if (next !== raw) {
      input.value = next;
      input.setSelectionRange(next.length, next.length);
    }
    setListedFor(null);
    return;
  }
  if (listedFor() === raw) {
    const common = commonPrefix(completion.matches);
    if (common.length > completion.typed.length && startsWithFold(common, completion.typed)) {
      const next = completion.apply(common);
      input.value = next;
      input.setSelectionRange(next.length, next.length);
    }
    setListedFor(null);
    return;
  }
  const entry = document.createElement("div");
  entry.className = "term__entry";
  const shown = raw.trim();
  if (shown) entry.append(echo(shown));
  const row = document.createElement("p");
  row.className = "term__help";
  row.textContent = completion.matches.join("  ");
  entry.append(row);
  log.append(entry);
  log.scrollTop = log.scrollHeight;
  setListedFor(raw);
}

function resolveCompletion(raw: string, entries: GlossaryEntry[], locale: string): Completion {
  const terms = uniqueTerms(entries);
  const man = /^man\s+(.*)$/i.exec(raw);
  if (man) {
    const typed = man[1];
    return {
      typed,
      matches: sortTerms(terms.filter((term) => startsWithFold(term, typed)), locale),
      apply: (next) => `man ${next}`,
    };
  }
  if (/^(?:help|clear|terms)\s/i.test(raw)) return { matches: [], typed: "", apply: (next) => next };

  if (/\s/.test(raw)) {
    const typed = raw.trimStart();
    const first = typed.split(/\s+/, 1)[0]?.toLowerCase() ?? "";
    if (COMMANDS.some((name) => name.startsWith(first))) return { matches: [], typed, apply: (next) => next };
    return {
      typed,
      matches: sortTerms(terms.filter((term) => startsWithFold(term, typed)), locale),
      apply: (next) => next,
    };
  }

  const typed = raw.trim();
  const commandMatches = COMMANDS.filter((name) => name.startsWith(typed.toLowerCase()));
  if (typed.length === 0 || commandMatches.length > 0) {
    return { matches: [...commandMatches], typed, apply: (next) => next };
  }
  return {
    typed,
    matches: sortTerms(terms.filter((term) => startsWithFold(term, typed)), locale),
    apply: (next) => next,
  };
}

function uniqueTerms(entries: GlossaryEntry[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const entry of entries) {
    const key = entry.term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(entry.term);
  }
  return names;
}

function sortTerms(names: string[], locale: string): string[] {
  return names.slice().sort((a, b) => a.localeCompare(b, locale, { sensitivity: "base" }));
}

function startsWithFold(value: string, prefix: string): boolean {
  return value.toLowerCase().startsWith(prefix.toLowerCase());
}

function commonPrefix(values: string[]): string {
  if (values.length === 0) return "";
  let prefix = values[0];
  for (let index = 1; index < values.length; index += 1) {
    const value = values[index];
    let size = 0;
    const limit = Math.min(prefix.length, value.length);
    while (size < limit && prefix[size].toLowerCase() === value[size].toLowerCase()) size += 1;
    prefix = prefix.slice(0, size);
    if (!prefix) break;
  }
  return prefix;
}

function echo(line: string): HTMLParagraphElement {
  const row = document.createElement("p");
  row.className = "term__echo";
  const mark = document.createElement("span");
  mark.className = "term__mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = "❯";
  const typed = document.createElement("span");
  typed.className = "term__cmd";
  typed.textContent = ` ${line}`;
  row.append(mark, typed);
  return row;
}

function paragraph(block: Block): HTMLParagraphElement {
  const row = document.createElement("p");
  row.className = block.className;
  row.textContent = block.text;
  return row;
}
