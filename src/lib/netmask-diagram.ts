/**
 * Subnet-mask diagram for the glossary.
 * Reuses .lvm-flow styles from global.css.
 */

type Lang = "es" | "en";

const COPY = {
  es: {
    address: "172.16.1.13/24",
    addressSub: "/24 = 255.255.255.0",
    net: "172.16.1.0",
    netSub: "red · 24 bits",
    host: ".13",
    hostSub: "equipo · 8 bits",
    same: "misma red",
    sameSub: ".12 y .13, directo",
    other: "otra red",
    otherSub: "sale por el gateway",
    caption: "La máscara va en la interfaz. En ssh se escribe solo la IP, sin /24.",
    aria:
      "Diagrama de la máscara: 172.16.1.13/24 se parte en la red 172.16.1.0 y el equipo .13. Si el destino está en 172.16.1, se habla directo. Si está en otra red, el paquete sale por el gateway.",
  },
  en: {
    address: "172.16.1.13/24",
    addressSub: "/24 = 255.255.255.0",
    net: "172.16.1.0",
    netSub: "network · 24 bits",
    host: ".13",
    hostSub: "host · 8 bits",
    same: "same network",
    sameSub: ".12 and .13, direct",
    other: "other network",
    otherSub: "goes via the gateway",
    caption: "The mask belongs on the interface. ssh takes the IP only, without /24.",
    aria:
      "Subnet mask diagram: 172.16.1.13/24 splits into network 172.16.1.0 and host .13. A destination in 172.16.1 is reached directly. Any other network is sent to the gateway.",
  },
} as const;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function box(x: number, y: number, w: number, h: number, cls: string, title: string, sub: string, tag = ""): string {
  const cx = x + w / 2;
  const tagEl = tag
    ? `<text class="lvm-flow__tag" x="${x + w - 10}" y="${y + 16}" text-anchor="end">${esc(tag)}</text>`
    : "";
  return (
    `<g class="${cls}">` +
    `<rect class="lvm-flow__box" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>` +
    `<text class="lvm-flow__title" x="${cx}" y="${y + h / 2 - 2}" text-anchor="middle">${esc(title)}</text>` +
    `<text class="lvm-flow__sub" x="${cx}" y="${y + h / 2 + 16}" text-anchor="middle">${esc(sub)}</text>` +
    tagEl +
    `</g>`
  );
}

function flow(d: string, tx: number, ty: number, cls: string): string {
  return (
    `<g class="lvm-flow__flow ${cls}">` +
    `<path class="lvm-flow__path" d="${d}"/>` +
    `<polygon class="lvm-flow__tip" points="${tx - 5},${ty - 9} ${tx + 5},${ty - 9} ${tx},${ty}"/>` +
    `</g>`
  );
}

export function netmaskDiagramHtml(locale: Lang): string {
  const t = COPY[locale === "en" ? "en" : "es"];

  const addressEl =
    `<g class="lvm-flow__node lvm-flow__vg">` +
    `<rect class="lvm-flow__box lvm-flow__box--vg" x="90" y="8" width="300" height="56" rx="12"/>` +
    `<text class="lvm-flow__title" x="240" y="32" text-anchor="middle">${esc(t.address)}</text>` +
    `<text class="lvm-flow__sub" x="240" y="50" text-anchor="middle">${esc(t.addressSub)}</text>` +
    `</g>`;

  const split =
    box(16, 104, 214, 64, "lvm-flow__node lvm-flow__pv", t.net, t.netSub) +
    box(250, 104, 214, 64, "lvm-flow__node lvm-flow__lv", t.host, t.hostSub);

  const decision =
    box(16, 230, 214, 64, "lvm-flow__node lvm-flow__lv", t.same, t.sameSub) +
    box(250, 230, 214, 64, "lvm-flow__node lvm-flow__lv lvm-flow__lv--free", t.other, t.otherSub);

  const arrows =
    flow("M240 64 C240 84 123 84 123 96", 123, 104, "lvm-flow__in") +
    flow("M240 64 C240 84 357 84 357 96", 357, 104, "lvm-flow__in") +
    flow("M123 168 L123 222", 123, 230, "lvm-flow__out") +
    flow("M357 168 L357 222", 357, 230, "lvm-flow__out");

  return (
    `<figure class="lvm-flow">` +
    `<svg class="lvm-flow__svg" viewBox="0 0 480 308" role="img" aria-label="${esc(t.aria)}" focusable="false" xmlns="http://www.w3.org/2000/svg">` +
    arrows +
    addressEl +
    split +
    decision +
    `</svg>` +
    `<figcaption class="lvm-flow__caption">${esc(t.caption)}</figcaption>` +
    `</figure>`
  );
}
