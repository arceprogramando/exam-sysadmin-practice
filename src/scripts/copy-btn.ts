/** Classic “copy document” control for command / glossary fields. */

const COPY_ICON =
  '<svg class="cmd-copy-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';

function announce(message: string): void {
  let live = document.getElementById("a11y-live");
  if (!live) {
    live = document.createElement("div");
    live.id = "a11y-live";
    live.className = "sr-only";
    live.setAttribute("aria-live", "polite");
    live.setAttribute("aria-atomic", "true");
    document.body.append(live);
  }
  live.textContent = "";
  window.setTimeout(() => {
    if (live) live.textContent = message;
  }, 30);
}

export function createCopyButton(
  text: string,
  labels: { copy: string; copied: string },
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cmd-copy";
  btn.setAttribute("aria-label", `${labels.copy}: ${text}`);
  btn.innerHTML = COPY_ICON;
  btn.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      btn.classList.add("is-copied");
      btn.setAttribute("aria-label", `${labels.copied}: ${text}`);
      announce(labels.copied);
      window.setTimeout(() => {
        btn.classList.remove("is-copied");
        btn.setAttribute("aria-label", `${labels.copy}: ${text}`);
      }, 1500);
    } catch {
      /* clipboard may be blocked */
    }
  });
  return btn;
}
