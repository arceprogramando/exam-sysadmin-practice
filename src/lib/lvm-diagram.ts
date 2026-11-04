/**
 * LVM diagrams: overview (glossary) + lab-specific flows (exam help).
 * Styles: global.css → `.lvm-flow` / `.lvm-lab-flow`.
 */

type Lang = "es" | "en";

const COPY = {
  es: {
    pv: "volumen físico",
    vg: "grupo de volúmenes",
    lv: "volumen lógico",
    free: "PE libres",
    freeSub: "para crecer",
    caption: "Varios PV entran a un VG; del VG salen varios LV.",
    aria:
      "Diagrama del flujo LVM: tres PV (volúmenes físicos) se unen en un VG (grupo de volúmenes) llamado wgroup, y del VG salen los LV (volúmenes lógicos) wshare y lv_data, más espacio libre para crecer.",
    lab15Title: "Flujo de este lab (crear wshare)",
    lab15Caption:
      "Disco extra → partición LVM → PV → VG wgroup → LV wshare → ext4 → /mnt/wshare → fstab (al boot). Dejá espacio en sdb para el swap.",
    lab15Aria: "Flujo del lab LVM: de sdb hasta montar wshare y dejarlo en fstab.",
    lab16Title: "Flujo de este lab (swap en el mismo disco)",
    lab16Caption:
      "El LVM ya usó sdb1. Acá: espacio libre → partición swap → mkswap → swapon → fstab. No toques la partición del VG.",
    lab16Aria: "Flujo del lab swap: partición libre en sdb, mkswap, swapon y fstab.",
    lab17Title: "Flujo de este lab (resize de vo)",
    lab17Caption:
      "Dos capas: LV (lvs) y filesystem (df). Al achicar: desmontar, alinear las dos (mejor con -r), remontar. El PDF pide ~50 MB.",
    lab17Aria: "Flujo del lab resize: umount, achicar LV y filesystem juntos, mount y comprobar.",
    diskStrip: "Disco extra (sdb ~1 GB)",
    restSwap: "libre → swap",
  },
  en: {
    pv: "physical volume",
    vg: "volume group",
    lv: "logical volume",
    free: "free PEs",
    freeSub: "room to grow",
    caption: "Several PVs go into one VG; several LVs come out of the VG.",
    aria:
      "LVM flow diagram: three PVs (physical volumes) join into one VG (volume group) named wgroup, and the VG hands out the LVs (logical volumes) wshare and lv_data, plus free space to grow.",
    lab15Title: "Flow for this lab (create wshare)",
    lab15Caption:
      "Extra disk → LVM partition → PV → VG wgroup → LV wshare → ext4 → /mnt/wshare → fstab (at boot). Leave room on sdb for swap.",
    lab15Aria: "LVM lab flow: from sdb through mounting wshare and writing fstab.",
    lab16Title: "Flow for this lab (swap on the same disk)",
    lab16Caption:
      "LVM already used sdb1. Here: free space → swap partition → mkswap → swapon → fstab. Do not touch the VG partition.",
    lab16Aria: "Swap lab flow: free partition on sdb, mkswap, swapon, and fstab.",
    lab17Title: "Flow for this lab (resize vo)",
    lab17Caption:
      "Two layers: LV (lvs) and filesystem (df). When shrinking: unmount, align both (best with -r), remount. The PDF wants ~50 MB.",
    lab17Aria: "Resize lab flow: umount, shrink LV and filesystem together, mount and check.",
    diskStrip: "Extra disk (sdb ~1 GB)",
    restSwap: "free → swap",
  },
} as const;

/** Box centers (x) for the three columns. */
const COLS = [76, 240, 404] as const;
const BOX_W = 136;

function box(cx: number, y: number, h: number, cls: string, title: string, sub: string, tag = ""): string {
  const x = cx - BOX_W / 2;
  const tagEl = tag ? `<text class="lvm-flow__tag" x="${x + BOX_W - 8}" y="${y + 15}" text-anchor="end">${tag}</text>` : "";
  return (
    `<g class="${cls}">` +
    `<rect class="lvm-flow__box" x="${x}" y="${y}" width="${BOX_W}" height="${h}" rx="10"/>` +
    `<text class="lvm-flow__title" x="${cx}" y="${y + h / 2 - 1}" text-anchor="middle">${title}</text>` +
    `<text class="lvm-flow__sub" x="${cx}" y="${y + h / 2 + 15}" text-anchor="middle">${sub}</text>` +
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

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function lang(locale: Lang) {
  return COPY[locale === "en" ? "en" : "es"];
}

/** Overview diagram for glossary LVM entry. */
export function lvmDiagramHtml(locale: Lang): string {
  const t = lang(locale);
  const [a, b, c] = COLS;

  const pvs =
    box(a, 8, 56, "lvm-flow__node lvm-flow__pv", "PV", t.pv, "/dev/sdb1") +
    box(b, 8, 56, "lvm-flow__node lvm-flow__pv", "PV", t.pv) +
    box(c, 8, 56, "lvm-flow__node lvm-flow__pv", "PV", t.pv);

  const vg =
    `<g class="lvm-flow__node lvm-flow__vg">` +
    `<rect class="lvm-flow__box lvm-flow__box--vg" x="40" y="124" width="400" height="60" rx="14"/>` +
    `<text class="lvm-flow__title" x="240" y="151" text-anchor="middle">VG</text>` +
    `<text class="lvm-flow__sub" x="240" y="170" text-anchor="middle">${t.vg}</text>` +
    `<text class="lvm-flow__tag" x="428" y="141" text-anchor="end">wgroup</text>` +
    `</g>`;

  const lvs =
    box(a, 240, 52, "lvm-flow__node lvm-flow__lv", "LV", t.lv, "wshare") +
    box(b, 240, 52, "lvm-flow__node lvm-flow__lv", "LV", t.lv, "lv_data") +
    box(c, 240, 52, "lvm-flow__node lvm-flow__lv lvm-flow__lv--free", t.free, t.freeSub);

  const flowsIn =
    flow(`M${a} 64 C${a} 92 140 92 140 116`, 140, 124, "lvm-flow__in") +
    flow(`M${b} 64 L${b} 116`, b, 124, "lvm-flow__in") +
    flow(`M${c} 64 C${c} 92 340 92 340 116`, 340, 124, "lvm-flow__in");

  const flowsOut =
    flow(`M140 184 C140 212 ${a} 212 ${a} 230`, a, 238, "lvm-flow__out") +
    flow(`M${b} 184 L${b} 230`, b, 238, "lvm-flow__out") +
    flow(`M340 184 C340 212 ${c} 212 ${c} 230`, c, 238, "lvm-flow__out");

  return (
    `<figure class="lvm-flow">` +
    `<svg class="lvm-flow__svg" viewBox="0 0 480 300" role="img" aria-label="${esc(t.aria)}" focusable="false" xmlns="http://www.w3.org/2000/svg">` +
    flowsIn +
    flowsOut +
    pvs +
    vg +
    lvs +
    `</svg>` +
    `<figcaption class="lvm-flow__caption">${esc(t.caption)}</figcaption>` +
    `</figure>`
  );
}

type Step = { kicker: string; body: string; tone?: "pv" | "vg" | "lv" | "fs" | "warn" };

function stepsHtml(title: string, caption: string, aria: string, steps: Step[], disk?: { left: string; right: string; label: string }): string {
  const diskEl = disk
    ? `<div class="lvm-lab-flow__disk" aria-hidden="true">` +
      `<span class="lvm-lab-flow__disk-label">${esc(disk.label)}</span>` +
      `<div class="lvm-lab-flow__disk-bar">` +
      `<span class="lvm-lab-flow__disk-chunk lvm-lab-flow__disk-chunk--lvm">${esc(disk.left)}</span>` +
      `<span class="lvm-lab-flow__disk-chunk lvm-lab-flow__disk-chunk--rest">${esc(disk.right)}</span>` +
      `</div></div>`
    : "";

  const list = steps
    .map((step, i) => {
      const tone = step.tone ? ` lvm-lab-flow__step--${step.tone}` : "";
      const delay = ` style="--lvm-i:${i}"`;
      return (
        `<li class="lvm-lab-flow__step${tone}"${delay}>` +
        `<span class="lvm-lab-flow__num">${i + 1}</span>` +
        `<span class="lvm-lab-flow__kicker">${esc(step.kicker)}</span>` +
        `<span class="lvm-lab-flow__body">${esc(step.body)}</span>` +
        `</li>`
      );
    })
    .join("");

  return (
    `<figure class="lvm-lab-flow" role="img" aria-label="${esc(aria)}">` +
    `<p class="lvm-lab-flow__title">${esc(title)}</p>` +
    diskEl +
    `<ol class="lvm-lab-flow__steps">${list}</ol>` +
    `<figcaption class="lvm-lab-flow__caption">${esc(caption)}</figcaption>` +
    `</figure>`
  );
}

function lab15Flow(locale: Lang): string {
  const t = lang(locale);
  const es = locale !== "en";
  return stepsHtml(
    t.lab15Title,
    t.lab15Caption,
    t.lab15Aria,
    es
      ? [
          { kicker: "Disco", body: "lsblk → disco extra ~1 GB (sdb). No toques el disco de /.", tone: "warn" },
          { kicker: "Partición", body: "fdisk/parted: sdb1 tipo 8e (LVM), ~450–600 MB. Resto libre para swap.", tone: "pv" },
          { kicker: "PV", body: "pvcreate /dev/sdb1 — marca solo esa partición (no sdb entero).", tone: "pv" },
          { kicker: "VG", body: "vgcreate -s 8M wgroup /dev/sdb1 — tanque; PE = 8 MiB.", tone: "vg" },
          { kicker: "LV", body: "lvcreate -n wshare -l 50 wgroup → /dev/wgroup/wshare (400 MB).", tone: "lv" },
          { kicker: "Filesystem", body: "mkfs.ext4 + mount en /mnt/wshare.", tone: "fs" },
          { kicker: "Al boot", body: "blkid del LV → línea UUID en /etc/fstab → mount -a.", tone: "fs" },
        ]
      : [
          { kicker: "Disk", body: "lsblk → extra ~1 GB disk (sdb). Do not touch the / disk.", tone: "warn" },
          { kicker: "Partition", body: "fdisk/parted: sdb1 type 8e (LVM), ~450–600 MB. Rest free for swap.", tone: "pv" },
          { kicker: "PV", body: "pvcreate /dev/sdb1 — mark only that partition (not whole sdb).", tone: "pv" },
          { kicker: "VG", body: "vgcreate -s 8M wgroup /dev/sdb1 — pool; PE = 8 MiB.", tone: "vg" },
          { kicker: "LV", body: "lvcreate -n wshare -l 50 wgroup → /dev/wgroup/wshare (400 MB).", tone: "lv" },
          { kicker: "Filesystem", body: "mkfs.ext4 + mount at /mnt/wshare.", tone: "fs" },
          { kicker: "At boot", body: "blkid on the LV → UUID line in /etc/fstab → mount -a.", tone: "fs" },
        ],
    {
      label: t.diskStrip,
      left: es ? "sdb1 · LVM · wshare" : "sdb1 · LVM · wshare",
      right: t.restSwap,
    },
  );
}

function lab16Flow(locale: Lang): string {
  const t = lang(locale);
  const es = locale !== "en";
  return stepsHtml(
    t.lab16Title,
    t.lab16Caption,
    t.lab16Aria,
    es
      ? [
          { kicker: "Antes", body: "lsblk -f: sdb1 = LVM del lab anterior; tiene que haber espacio libre.", tone: "warn" },
          { kicker: "Partición", body: "fdisk: sdb2 ~+420M, tipo 82 (swap). No cambies el tipo de sdb1.", tone: "pv" },
          { kicker: "Formato", body: "mkswap /dev/sdb2 (no mkfs.ext4).", tone: "fs" },
          { kicker: "Ahora", body: "swapon /dev/sdb2 && swapon --show.", tone: "lv" },
          { kicker: "Al boot", body: "fstab: UUID=… swap swap defaults 0 0 → swapon -a.", tone: "fs" },
        ]
      : [
          { kicker: "Before", body: "lsblk -f: sdb1 = prior LVM lab; free space must remain.", tone: "warn" },
          { kicker: "Partition", body: "fdisk: sdb2 ~+420M, type 82 (swap). Do not change sdb1's type.", tone: "pv" },
          { kicker: "Format", body: "mkswap /dev/sdb2 (not mkfs.ext4).", tone: "fs" },
          { kicker: "Now", body: "swapon /dev/sdb2 && swapon --show.", tone: "lv" },
          { kicker: "At boot", body: "fstab: UUID=… swap swap defaults 0 0 → swapon -a.", tone: "fs" },
        ],
    {
      label: t.diskStrip,
      left: "sdb1 · LVM",
      right: es ? "sdb2 · swap" : "sdb2 · swap",
    },
  );
}

function lab17Flow(locale: Lang): string {
  const t = lang(locale);
  const es = locale !== "en";
  return stepsHtml(
    t.lab17Title,
    t.lab17Caption,
    t.lab17Aria,
    es
      ? [
          { kicker: "Estado", body: "vo ya existe (o prep). Mirar lvs y df -h /mnt/vo.", tone: "warn" },
          { kicker: "Desmontar", body: "umount /mnt/vo antes de achicar.", tone: "pv" },
          { kicker: "Método A", body: "resize2fs … 50M → lvreduce -l 5 (PE 10M → 50 MB).", tone: "vg" },
          { kicker: "Método B", body: "lvreduce -r -l 5 /dev/vgroup/vo — FS + LV juntos (tip del video).", tone: "lv" },
          { kicker: "Opcional grow", body: "Práctica Q15b: lvextend -L 230M -r … (agrandar).", tone: "fs" },
          { kicker: "Comprobar", body: "mount -a · lvs y df en ~30–70 MB, alineados.", tone: "fs" },
        ]
      : [
          { kicker: "State", body: "vo already exists (or prep). Check lvs and df -h /mnt/vo.", tone: "warn" },
          { kicker: "Unmount", body: "umount /mnt/vo before shrinking.", tone: "pv" },
          { kicker: "Method A", body: "resize2fs … 50M → lvreduce -l 5 (PE 10M → 50 MB).", tone: "vg" },
          { kicker: "Method B", body: "lvreduce -r -l 5 /dev/vgroup/vo — FS + LV together (video tip).", tone: "lv" },
          { kicker: "Optional grow", body: "Q15b practice: lvextend -L 230M -r … (grow).", tone: "fs" },
          { kicker: "Check", body: "mount -a · lvs and df near 30–70 MB, aligned.", tone: "fs" },
        ],
  );
}

/** Lab-specific flow for exam help. Empty string if the lab has no diagram. */
export function lvmLabFlowHtml(labId: string, locale: Lang): string {
  switch (labId) {
    case "lab-15":
      return lab15Flow(locale);
    case "lab-16":
      return lab16Flow(locale);
    case "lab-17":
      return lab17Flow(locale);
    default:
      return "";
  }
}
