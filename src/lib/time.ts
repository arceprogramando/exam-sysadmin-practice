import type { Locale } from "./i18n";

export const EXAM_LIMIT_SEC = 3 * 60 * 60;

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return [h, m, r].map((n) => String(n).padStart(2, "0")).join(":");
}

export function formatShort(totalSeconds: number, locale: Locale = "es"): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const hour = locale === "en" ? "hr" : "h";
  const second = locale === "en" ? "sec" : "s";
  if (h > 0) return `${h} ${hour} ${m} min`;
  if (m > 0) return `${m} min ${r} ${second}`;
  return `${r} ${second}`;
}

/** Negativo = más rápido que la vez anterior. */
export function formatDelta(seconds: number, locale: Locale = "es"): string {
  const rounded = Math.round(seconds);
  if (Math.abs(rounded) < 1) return locale === "en" ? "same" : "igual";
  const sign = rounded > 0 ? "+" : "−";
  return `${sign}${formatClock(Math.abs(rounded))}`;
}

export function deltaLabel(seconds: number, locale: Locale = "es"): string {
  if (locale === "en") {
    if (seconds <= -5) return "faster";
    if (seconds >= 5) return "slower";
    return "about the same";
  }
  if (seconds <= -5) return "más rápido";
  if (seconds >= 5) return "más lento";
  return "parecido";
}

export function formatWhen(iso: string, locale: Locale = "es"): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
