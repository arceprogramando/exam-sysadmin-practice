export interface AskOptions {
  title: string;
  body?: string | HTMLElement;
  confirmLabel: string;
  /** Omit for a single OK button. */
  cancelLabel?: string;
  confirmClass?: string;
  cancelClass?: string;
}

let dismissOpen: (() => void) | null = null;

/** Close the open ask as cancel. */
export function closeAsk(): void {
  dismissOpen?.();
}

/** In-page confirm. Resolves true only from the confirm button. */
export function ask(options: AskOptions): Promise<boolean> {
  dismissOpen?.();
  return new Promise((resolve) => {
    const previousOverflow = document.body.style.overflow;
    let settled = false;
    const overlay = document.createElement("div");
    overlay.className = "ask";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    const backdrop = document.createElement("div");
    backdrop.className = "ask-backdrop";

    const panel = document.createElement("div");
    panel.className = "ask-panel";

    const title = document.createElement("h2");
    title.className = "ask-title";
    title.id = "ask-title";
    title.textContent = options.title;
    overlay.setAttribute("aria-labelledby", title.id);

    const actions = document.createElement("div");
    actions.className = "ask-actions";

    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = options.confirmClass ?? "btn btn-primary";
    confirm.textContent = options.confirmLabel;

    let cancel: HTMLButtonElement | null = null;
    if (options.cancelLabel) {
      cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = options.cancelClass ?? "btn btn-quiet";
      cancel.textContent = options.cancelLabel;
    }

    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      if (dismissOpen === finishFalse) dismissOpen = null;
      document.removeEventListener("keydown", onKey);
      overlay.remove();
      document.body.style.overflow = previousOverflow;
      resolve(value);
    };
    const finishFalse = () => finish(false);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish(cancel ? false : true);
        return;
      }
      if (event.key !== "Tab" || !cancel) return;
      const edge = event.shiftKey ? cancel : confirm;
      if (document.activeElement === edge) {
        event.preventDefault();
        (event.shiftKey ? confirm : cancel).focus();
      }
    };

    backdrop.addEventListener("click", () => finish(cancel ? false : true));
    cancel?.addEventListener("click", finishFalse);
    confirm.addEventListener("click", () => finish(true));

    const scroll = document.createElement("div");
    scroll.className = "ask-scroll";
    scroll.append(title);
    if (typeof options.body === "string") {
      const text = document.createElement("p");
      text.className = "ask-body";
      text.textContent = options.body;
      scroll.append(text);
    } else if (options.body) {
      scroll.append(options.body);
    }
    if (cancel) actions.append(cancel);
    actions.append(confirm);
    panel.append(scroll, actions);
    overlay.append(backdrop, panel);
    document.body.style.overflow = "hidden";
    document.body.append(overlay);
    document.addEventListener("keydown", onKey);
    dismissOpen = finishFalse;
    (cancel ?? confirm).focus();
  });
}
