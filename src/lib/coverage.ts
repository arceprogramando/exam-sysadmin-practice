import { LABS, isOffEdition, type Edition } from "./labs";
import type { LabRecord, Run } from "./storage";

/** Practice topics. A lab can sit in two groups when the task is both. */
export const DOMAIN_ORDER = [
  "tools",
  "software",
  "scripts",
  "systems",
  "storage",
  "filesystems",
  "deploy",
  "network",
  "users",
  "security",
] as const;

export type DomainId = (typeof DOMAIN_ORDER)[number];

const DOMAIN_LABS: Record<DomainId, string[]> = {
  tools: ["lab-09", "lab-12", "lab-13"],
  software: ["lab-03", "extra-04", "extra-05", "lab-20", "lab-21", "lab-22"],
  scripts: ["extra-01"],
  systems: ["lab-01-root-client", "lab-02-root-server", "lab-18"],
  storage: ["lab-15", "lab-16"],
  filesystems: ["lab-06", "lab-08", "lab-10", "lab-17"],
  deploy: ["lab-07", "lab-11", "lab-19", "extra-02"],
  network: ["lab-01", "lab-02"],
  users: ["lab-05", "lab-14"],
  security: ["lab-04", "extra-03"],
};

const assigned = new Set(Object.values(DOMAIN_LABS).flat());
for (const lab of LABS) {
  if (lab.track === "setup") continue;
  if (!assigned.has(lab.id)) throw new Error(`sin objetivo de examen: ${lab.id}`);
}
for (const id of assigned) {
  if (!LABS.some((lab) => lab.id === id)) throw new Error(`objetivo apunta a un lab inexistente: ${id}`);
}

export type CoverageKind = "done" | "help" | "revisit" | "missing";

export interface CoverageLab {
  labId: string;
  credit: number;
  kind: CoverageKind;
}

export interface DomainScore {
  id: DomainId;
  percent: number;
  labs: CoverageLab[];
}

function creditOf(lab: LabRecord | undefined): { credit: number; kind: CoverageKind } {
  if (lab?.status === "done" && !lab.usedHelp) return { credit: 1, kind: "done" };
  if (lab?.status === "done" && lab.usedHelp) return { credit: 0.5, kind: "help" };
  if (lab?.status === "revisit") return { credit: 0.25, kind: "revisit" };
  return { credit: 0, kind: "missing" };
}

function bestLab(runs: Run[], labId: string): CoverageLab {
  let best = creditOf(undefined);
  for (const run of runs) {
    const next = creditOf(run.labs.find((lab) => lab.labId === labId));
    if (next.credit > best.credit) best = next;
  }
  return { labId, ...best };
}

/** Best mark across every run of this mode, including the one in progress. */
export function domainCoverage(runs: Run[], edition: Edition): DomainScore[] {
  return DOMAIN_ORDER.map((id) => {
    const labs = DOMAIN_LABS[id]
      .filter((labId) => !isOffEdition(labId, edition))
      .map((labId) => bestLab(runs, labId));
    const percent =
      labs.length === 0 ? 0 : Math.round((labs.reduce((sum, lab) => sum + lab.credit, 0) / labs.length) * 100);
    return { id, percent, labs };
  });
}

export function overallPercent(domains: DomainScore[]): number {
  if (domains.length === 0) return 0;
  return Math.round(domains.reduce((sum, domain) => sum + domain.percent, 0) / domains.length);
}
