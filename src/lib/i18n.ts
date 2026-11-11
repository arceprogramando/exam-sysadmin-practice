export const DEFAULT_LOCALE = "es";
export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const SITE = "https://exam-sysadmin-practice.arceprog.dev";

export function getLocaleConfig(locale: Locale) {
  if (locale === "en") {
    return { htmlLang: "en", ogLocale: "en_US", label: "English" };
  }
  return { htmlLang: "es", ogLocale: "es_AR", label: "Español" };
}

export function otherLocale(locale: Locale): Locale {
  return locale === "es" ? "en" : "es";
}

export function localeFromPath(path: string): Locale {
  if (path === "/en" || path.startsWith("/en/")) return "en";
  return DEFAULT_LOCALE;
}

export function pageLocale(): Locale {
  if (typeof document !== "undefined") {
    const value = document.documentElement.dataset.locale;
    if (value === "en" || value === "es") return value;
  }
  if (typeof location !== "undefined") return localeFromPath(location.pathname);
  return DEFAULT_LOCALE;
}

/** Path with locale prefix and a trailing slash. Spanish stays at the root. */
export function localePath(locale: Locale, path = "/"): string {
  const clean = path.replace(/^\/+|\/+$/g, "");
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  if (!clean) return `${prefix}/`;
  return `${prefix}/${clean}/`;
}

/**
 * Logical pages and their URL slug per locale.
 * Add new pages here so English never reuses Spanish words in the path.
 */
export const ROUTES = {
  home: { es: "", en: "" },
  practice: { es: "practica", en: "personal-practice" },
  stats: { es: "estadisticas", en: "stats" },
  glossary: { es: "glosario", en: "glossary" },
} as const;

export type RouteId = keyof typeof ROUTES;

export function routePath(locale: Locale, id: RouteId): string {
  const slug = ROUTES[id][locale];
  return localePath(locale, slug ? `/${slug}/` : "/");
}

/** Strip /en prefix and normalize trailing slash for matching. */
export function barePathname(pathname: string): string {
  let path = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1 && !path.endsWith("/")) path = `${path}/`;
  return path === "" ? "/" : path;
}

export function matchRoute(pathname: string): RouteId {
  const bare = barePathname(pathname);
  if (bare === "/") return "home";
  for (const id of Object.keys(ROUTES) as RouteId[]) {
    if (id === "home") continue;
    const es = `/${ROUTES[id].es}/`;
    const en = `/${ROUTES[id].en}/`;
    if (bare === es || bare === en) return id;
  }
  return "home";
}

/** Same page in another locale, keeping query string if provided. */
export function swapLocalePath(pathname: string, target: Locale, search = ""): string {
  const base = routePath(target, matchRoute(pathname));
  if (!search || search === "?") return base;
  const q = search.startsWith("?") ? search : `?${search}`;
  return `${base}${q}`;
}

export function cvUrl(locale: Locale): string {
  return locale === "en" ? "https://arceprog.dev/en/" : "https://arceprog.dev/";
}

export interface Copy {
  skip: string;
  brand: string;
  nav: string;
  statsNav: string;
  glossaryNav: string;
  glossaryTitle: string;
  glossaryDescription: string;
  glossaryHeading: string;
  glossaryIntro: string;
  glossarySearch: string;
  glossarySearchEmpty: string;
  glossaryTldr: string;
  glossaryTldrRepo: string;
  glossaryPopupSearch: string;
  glossaryPopupClose: string;
  glossaryShortcut: string;
  opensNew: string;
  cv: string;
  themeLight: string;
  themeDark: string;
  themeToLight: string;
  themeToDark: string;
  bannerLead: string;
  bannerTail: string;
  homeTitle: string;
  homeDescription: string;
  hello: string;
  kicker: string;
  headlineLead: string;
  /** Accent lines under the lead (rendered inside <em>, one per entry). */
  headlineMark: string;
  shellKicker: string;
  shellTitleLead: string;
  shellTitleMark: string;
  shellLead: string;
  shellWindow: string;
  shellNoteUsers: string;
  shellNoteNet: string;
  shellOutputLabel: string;
  shellPromptLabel: string;
  shellPromptHint: string;
  shellIntro: string;
  shellUnknown: (command: string) => string;
  shellManMissing: string;
  shellExample: string;
  shellHelp: string[];
  penguinKicker: string;
  penguinTitle: string;
  penguinCaption: string;
  penguinPanelLabel: string;
  penguinStill: string;
  penguinWave: string;
  penguinSmile: string;
  penguinDance: string;
  penguinSign: string;
  penguinSignText: string;
  penguinLook: string;
  penguinNotebook: string;
  penguinSpeed: string;
  penguinOrbitHint: string;
  leadBefore: string;
  leadAfter: string;
  start: string;
  startAnother: string;
  editionLabel: string;
  editionSwitch: (openVersion: string, nextVersion: string) => string;
  confirmStartOther: (openVersion: string, nextVersion: string) => string;
  editionV10: string;
  editionV9: string;
  editionNote: string;
  startModesLabel: string;
  startPausable: string;
  startPausableAnother: string;
  startFixed: string;
  startFixedAnother: string;
  startFixedHint: string;
  modesNote: string;
  resume: string;
  resumeEdition: (version: string) => string;
  startAnotherLabel: string;
  seeStats: string;
  seeStatsImport: string;
  seeStatsFixed: string;
  seeStatsPausable: string;
  statsModeFixed: string;
  statsModePausable: string;
  timesNote: string;
  loading: string;
  improvement: string;
  improvementFixed: string;
  runs: string;
  best: string;
  withHelp: string;
  passed: string;
  lastClose: string;
  footerBefore: string;
  footerPlaylist: string;
  footerAndRepo: string;
  footerRepo: string;
  footerAfterRepo: string;
  footerLegal: string;
  noscript: string;
  videoTitle: string;
  confirmReplace: string;
  resumeAbandoned: string;
  confirmResumeOther: string;
  startedNote: (when: string) => string;
  startedPausedNote: (when: string) => string;
  startedPausableNote: (when: string) => string;
  firstClose: (clock: string) => string;
  openRun: string;
  noCloseYet: string;
  deltaLine: (delta: string, label: string) => string;
  tally: (parts: { done: number; revisit: number; redo: number; skipped: number; help: number }) => string;
  examTitle: string;
  examDescription: string;
  emptyTitle: string;
  emptyBody: string;
  emptyHome: string;
  backToList: string;
  enterLab: string;
  enterHint: string;
  clock: string;
  pause: string;
  resumeClock: string;
  paused: string;
  floatDrag: string;
  thisLab: string;
  missing: string;
  redoCount: string;
  revisit: string;
  done: string;
  strategyTitle: string;
  strategyBody: string;
  listCreditBefore: string;
  groupClient: string;
  groupServer: string;
  groupBoth: string;
  groupExtras: string;
  unscoredBadge: string;
  unscoredNote: string;
  marksLegend: string;
  foldDone: string;
  unfoldDone: (count: number) => string;
  emptyGroup: string;
  passedMeta: string;
  stuckNote: string;
  helpMeta: string;
  redoMeta: string;
  difficulty: string;
  difficultyAria: string;
  levels: { id: "very_low" | "low" | "normal" | "high" | "very_high"; label: string }[];
  helpAsked: string;
  helpMarked: string;
  stepsTitle: string;
  commandsTitle: string;
  copyCmd: string;
  copiedCmd: string;
  slipLabel: string;
  helpPickOne: string;
  helpOption: (n: number, name?: string) => string;
  asWho: (who: string) => string;
  videosTitle: string;
  reviewVideos: string;
  askHelp: string;
  showHelp: string;
  hideHelp: string;
  redo: string;
  skipTask: string;
  actionsHint: string;
  closeRun: string;
  closeKept: string;
  deleteRun: string;
  summaryHint: string;
  backHome: string;
  closed: string;
  timedOut: string;
  abandoned: string;
  inProgress: string;
  continueLeftovers: (n: number) => string;
  continueLeftoversHint: string;
  leftoverBadge: string;
  leftoverNote: string;
  leftoverClock: string;
  leftoverEmpty: string;
  statusPassed: string;
  statusRedo: string;
  statusOpen: string;
  statusNone: string;
  attempt: (n: number) => string;
  confirmDelete: string;
  confirmClose: string;
  askBack: string;
  askDelete: string;
  askWipe: string;
  askStart: string;
  closeGapsTitle: string;
  closeGapsLead: string;
  closeUnmarked: string;
  closeNoLevel: string;
  closeStay: string;
  closeAnyway: string;
  statsTitle: string;
  statsDescription: string;
  statsHeading: string;
  statsIntro: string;
  coverageTitle: string;
  coverageLead: string;
  coverageNote: string;
  coverageCenter: string;
  coverageDone: string;
  coverageHelp: string;
  coverageRevisit: string;
  coverageMissing: string;
  coverageGap: (names: string) => string;
  coverageNone: string;
  coverageSolid: string;
  domainShort: Record<string, string>;
  domainName: Record<string, string>;
  noClosed: string;
  noClosedBody: string;
  firstExam: string;
  fasterThan: (when: string) => string;
  lastVsPrev: (last: string, prev: string) => string;
  simulacros: string;
  labsDone: string;
  byLab: string;
  cols: string[];
  redoCell: string;
  statsShowLabel: string;
  statsSearch: string;
  statsClearFilters: string;
  statsResultCount: (n: number) => string;
  statsFilterStuck: string;
  statsFilterRedo: string;
  statsFilterHelp: string;
  statsEmptyFilter: string;
  statsReviewVideos: string;
  statsMarkVideosReviewed: string;
  statsMarkOneVideo: string;
  statsVideoDone: string;
  statsVideosReviewed: string;
  statsVideosProgress: (done: number, total: number) => string;
  statsNote: string;
  history: string;
  historyEmpty: string;
  historyChipDone: (n: number) => string;
  historyChipRevisit: (n: number) => string;
  historyChipRedo: (n: number) => string;
  historyChipSkipped: (n: number) => string;
  historyChipHelp: (n: number) => string;
  delete: string;
  confirmDeleteNamed: (which: string) => string;
  thisRunning: string;
  thisSaved: string;
  download: string;
  importJson: string;
  importDrop: string;
  importBad: string;
  confirmImport: (runs: number) => string;
  askImport: string;
  wipe: string;
  confirmWipe: string;
  noTimes: string;
  noTimesBody: string;
  goHome: string;
  faster: string;
  slower: string;
  similar: string;
  same: string;
}

const levelsEs: Copy["levels"] = [
  { id: "very_low", label: "muy bajo" },
  { id: "low", label: "bajo" },
  { id: "normal", label: "normal" },
  { id: "high", label: "alto" },
  { id: "very_high", label: "muy alto" },
];

const levelsEn: Copy["levels"] = [
  { id: "very_low", label: "very low" },
  { id: "low", label: "low" },
  { id: "normal", label: "normal" },
  { id: "high", label: "high" },
  { id: "very_high", label: "very high" },
];

const es: Copy = {
  skip: "Saltar al contenido",
  brand: "Práctica personal",
  nav: "Secciones",
  statsNav: "Estadísticas",
  glossaryNav: "Glosario",
  glossaryTitle: "Glosario sysadmin Linux",
  glossaryDescription:
    "Buscá palabras y comandos de administración Linux: usuarios, red, almacenamiento, SELinux y más, con ejemplos para practicar.",
  glossaryHeading: "Glosario",
  glossaryIntro: "Términos que se me traban. Buscá por palabra o por la descripción. Donde hay tldr, el enlace abre ejemplos de uso en el repo de la comunidad.",
  glossarySearch: "Buscar por palabra o descripción…",
  glossarySearchEmpty: "No hay entradas que coincidan.",
  glossaryTldr: "Ejemplos en tldr",
  glossaryTldrRepo: "Repo tldr-pages",
  glossaryPopupSearch: "Buscar en el glosario…",
  glossaryPopupClose: "Cerrar",
  glossaryShortcut: "Ctrl+K abre el glosario",
  opensNew: "se abre en una pestaña nueva",
  cv: "Sobre mí",
  themeLight: "Claro",
  themeDark: "Oscuro",
  themeToLight: "Cambiar a modo claro",
  themeToDark: "Cambiar a modo oscuro",
  bannerLead: "Práctica personal para un examen de sysadmin Linux en noviembre (fecha tentativa: 13; todavía no confirmada).",
  bannerTail: "No es un examen oficial.",
  homeTitle: "Práctica personal de sysadmin Linux",
  homeDescription:
    "Vas a encontrar labs guiados, glosario buscable, reloj de 3 horas, estadísticas en el navegador y ayuda solo si la pedís. Práctica personal de administración Linux.",
  hello: "Hola, me estoy preparando para un examen de sysadmin Linux en noviembre (fecha tentativa: 13; todavía no confirmada), y estoy usando esto como práctica personal.",
  kicker: "Práctica personal · examen sysadmin",
  headlineLead: "Primero lo que",
  headlineMark: "ya sabés hacer.",
  shellKicker: "/ En la terminal",
  shellTitleLead: "Se escribe.",
  shellTitleMark: "Se comprueba.",
  shellLead: "Cada punto se resuelve en la máquina. Esta ventana solo consulta el glosario.",
  shellWindow: "práctica — vm",
  shellNoteUsers: "# usuarios",
  shellNoteNet: "# red y perfil",
  shellOutputLabel: "Salida del glosario de práctica",
  shellPromptLabel: "Comando de la práctica",
  shellPromptHint: "man usermod",
  shellIntro: "No corre comandos del sistema. Muestra definiciones del glosario. Escribí help.",
  shellUnknown: (command) => `${command}: no está en este glosario de práctica`,
  shellManMissing: "man: falta el término. Por ejemplo: man usermod",
  shellExample: "ejemplo",
  shellHelp: [
    "man TÉRMINO — definición del glosario",
    "TÉRMINO — la misma definición, si el nombre está en el glosario",
    "terms — lista esos nombres",
    "help — esta lista",
    "clear — limpia la ventana y deja el prompt",
  ],
  penguinKicker: "/ Compañía de estudio",
  penguinTitle: "Un pingüino que también practica.",
  penguinCaption: "Tocá la panza y pasa de escena: saludo y baile. Cada una vuelve sola a la pose quieta.",
  penguinPanelLabel: "Qué hace el pingüino",
  penguinStill: "Quieto",
  penguinWave: "Saludar",
  penguinSmile: "Sonreír",
  penguinDance: "Baile",
  penguinSign: "Cartel",
  penguinSignText: "Hola",
  penguinLook: "Mirar",
  penguinNotebook: "Notebook",
  penguinSpeed: "Lento",
  penguinOrbitHint: "Arrastrá para verlo de atrás. Tocá la panza para la siguiente escena. La notebook se prende con un clic.",
  leadBefore:
    "La estructura (reloj de 3 horas, Revisit y Done) está inspirada en cómo se suele ver una certificación de sysadmin Linux. Los puntos rápidos van primero; si algo te traba, lo marcás y seguís. Un ",
  leadAfter: " muestra ese formato de afuera.",
  start: "Empezá la práctica",
  startAnother: "Empezar otra",
  editionLabel: "Versión a practicar",
  editionSwitch: (openVersion, nextVersion) =>
    `La abierta es ${openVersion}. Abajo empezás una nueva con ${nextVersion}. La abierta queda en el historial.`,
  confirmStartOther: (openVersion, nextVersion) =>
    `La práctica de ${openVersion} queda en el historial. ¿Empezás una nueva con ${nextVersion}?`,
  editionV10: "Flatpak",
  editionV9: "Podman",
  editionNote: "Hay dos modos de práctica: uno con Flatpak y otro con Podman. Elegí el que estés estudiando.",
  startModesLabel: "Empezar una práctica",
  startPausable: "Práctica con pausas",
  startPausableAnother: "Otra con pausas",
  startFixed: "Empezar sin pausas",
  startFixedAnother: "Otro sin pausas",
  startFixedHint: "El modo para medir tiempos: 3 horas de corrido, sin pausas.",
  modesNote: "Sin pausas es el que importa para medir cómo vas. Con pausas es solo práctica: el reloj se puede frenar.",
  resume: "Seguí donde quedaste",
  resumeEdition: (version) => `Seguí donde quedaste · ${version}`,
  startAnotherLabel: "O empezar otro",
  seeStats: "Ver mis tiempos",
  seeStatsImport: "Importar",
  seeStatsFixed: "Tiempos sin pausas",
  seeStatsPausable: "Tiempos con pausas",
  statsModeFixed: "Sin pausas",
  statsModePausable: "Con pausas · práctica",
  timesNote: "Los tiempos quedan en este navegador.",
  loading: "Cargando tiempos locales…",
  improvement: "Mejora",
  improvementFixed: "Mejora sin pausas",
  runs: "Prácticas",
  best: "Mejor tiempo",
  withHelp: "Con ayuda",
  passed: "Pasados",
  lastClose: "Último cierre",
  footerBefore: "Material de práctica: ",
  footerPlaylist: "lista de YouTube",
  footerAndRepo: " y ",
  footerRepo: "repo del lab",
  footerAfterRepo: ". Cubre V9 y videos más nuevos: Flatpak, timers y el reset con init=/bin/bash.",
  footerLegal:
    "arceprog no está afiliado a Red Hat, CompTIA, LPI ni a ningún organismo de certificación Linux. Si aparecen nombres de exámenes o marcas (RHCSA, Linux+, LPIC u otras), son solo para identificación; esta es una práctica personal no oficial.",
  noscript: "Esta práctica guarda los tiempos en el navegador y necesita JavaScript.",
  videoTitle: "video público sobre el formato del examen",
  confirmReplace: "Hay uno en curso. Si empezás otro, ese queda guardado como abandonado.",
  resumeAbandoned: "Seguir esta",
  confirmResumeOther: "Hay otra práctica en curso. Si seguís esta, esa otra pasa al historial y también se puede retomar.",
  startedNote: (when) => `Empezada el ${when}, con el reloj andando.`,
  startedPausedNote: (when) => `Empezada el ${when}, con el reloj frenado.`,
  startedPausableNote: (when) => `Empezada el ${when}, y podés frenar el reloj.`,
  firstClose: (clock) => `Primer cierre: ${clock}. El próximo se compara contra este.`,
  openRun: "Hay una práctica sin cerrar. La mejora aparece cuando termina o se acaba el tiempo.",
  noCloseYet: "Cuando cierres la primera, acá vas a ver si la siguiente fue más corta.",
  deltaLine: (delta, label) => `${delta} · ${label} que el anterior`,
  tally: ({ done, revisit, redo, skipped, help }) =>
    `${done} done · ${revisit} revisit · ${redo} para rehacer · ${skipped} sin entender · ${help} con ayuda`,
  examTitle: "Práctica en curso",
  examDescription:
    "Lab en curso con reloj de 3 horas, objetivos, pasos y ayuda opcional. Seguís en la misma práctica personal de administración Linux.",
  emptyTitle: "No hay una práctica en curso",
  emptyBody: "El reloj de 3 horas arranca al empezar, y la lista muestra lo que falta.",
  emptyHome: "Empezá desde el inicio",
  backToList: "Volver a la lista",
  enterLab: "Entrar",
  enterHint: "Entrar abre el enunciado de esa tarea.",
  clock: "Reloj de la práctica",
  pause: "Pausar",
  resumeClock: "Seguir",
  paused: "En pausa",
  floatDrag: "Arrastrá",
  thisLab: "Este lab",
  missing: "Te faltan",
  redoCount: "Rehacer",
  revisit: "Revisit (volver después)",
  done: "Done (ya está)",
  strategyTitle: "Hacé primero lo que ya sabés",
  strategyBody:
    "Los puntos rápidos van primero. Si una tarea te traba, marcala Revisit (volver después) y seguí con otra. Done (ya está) es cuando ya está: en esa misma línea elegís la dificultad del puntaje. Alto y muy alto son los que conviene rehacer. Lo que no tiene marca es lo que te falta. No hace falta ir en orden.",
  listCreditBefore: "El reloj y las marcas (Revisit / Done) siguen el formato típico de una cert de sysadmin Linux. Referencia: ",
  groupClient: "En el client",
  groupServer: "En el server",
  groupBoth: "En las dos",
  groupExtras: "Extras, si te queda tiempo",
  unscoredBadge: "No cuenta para la estadística final",
  unscoredNote:
    "Este extra no entra en la cobertura, ni en el promedio, ni en Continuar pendientes. Podés mirarlo y marcar Done igual.",
  marksLegend: "Revisit (volver después) · Done (ya está)",
  foldDone: "Ocultar hechas",
  unfoldDone: (count) => `Mostrar ${count} hechas`,
  emptyGroup: "Nada en este grupo.",
  passedMeta: "pasado, no lo entendiste",
  stuckNote: "Por encima de muy alto. Es el que más te trabó.",
  helpMeta: "con ayuda",
  redoMeta: "para rehacer",
  difficulty: "Dificultad",
  difficultyAria: "Dificultad del puntaje",
  levels: levelsEs,
  helpAsked: "Ayuda pedida",
  helpMarked: "Quedó marcado en las estadísticas de este lab.",
  stepsTitle: "Detalle del enunciado",
  commandsTitle: "Comandos para mirar",
  copyCmd: "Copiar",
  copiedCmd: "Copiado",
  slipLabel: "Error que me pasó",
  helpPickOne: "Elegí una forma · no hace falta las dos",
  helpOption: (n, name) => (name ? `Opción ${n} · ${name}` : `Opción ${n}`),
  asWho: (who) => `Como ${who}`,
  videosTitle: "Videos",
  reviewVideos: "Quedó muy alto, para rehacer. Volvé a ver los videos de ejemplo de este lab.",
  askHelp: "Pedí ayuda",
  showHelp: "Ver ayuda",
  hideHelp: "Ocultar ayuda",
  redo: "Rehacer",
  skipTask: "No lo entiendo",
  actionsHint:
    "Revisit (volver después) te saca de esta tarea y la deja marcada para volver. Done (ya está) es cuando ya está: ahí elegís la dificultad del puntaje. Alto y muy alto quedan para rehacer. No lo entiendo queda por encima de muy alto. La ayuda no se abre hasta que la pedís.",
  closeRun: "Terminar y guardar",
  closeKept: "Los tiempos quedan en este navegador.",
  deleteRun: "Eliminar esta práctica",
  summaryHint: "El detalle y la comparación contra otros intentos están en estadísticas.",
  backHome: "Volver al inicio",
  closed: "Práctica cerrada",
  timedOut: "Se acabaron las 3 horas",
  abandoned: "Práctica abandonada",
  inProgress: "En curso",
  continueLeftovers: (n) => (n === 1 ? "Continuar 1 pendiente" : `Continuar ${n} pendientes`),
  continueLeftoversHint:
    "Sin reloj de 3 horas. Solo los labs que no terminaste. Esos tiempos no entran al promedio ni al mejor del simulacro.",
  leftoverBadge: "Pendientes · sin límite",
  leftoverNote:
    "Esto no es el simulacro: son solo los labs que quedaron sin Done. Podés terminarlos con calma; el reloj de 3 horas ya no corre.",
  leftoverClock: "Sin límite",
  leftoverEmpty: "No quedan labs pendientes en esta práctica.",
  statusPassed: "Pasado",
  statusRedo: "Rehacer",
  statusOpen: "Quedó abierto al cortar el tiempo",
  statusNone: "Sin marcar",
  attempt: (n) => `Intento ${n} de este lab. El reloj del lab volvió a cero.`,
  confirmDelete: "¿Eliminar esta práctica? Se borran sus tiempos de este navegador.",
  confirmClose: "¿Terminar y guardar lo que marcaste hasta ahora?",
  askBack: "Volver",
  askDelete: "Eliminar",
  askWipe: "Borrar todo",
  askStart: "Empezar",
  closeGapsTitle: "Faltan marcas para la estadística",
  closeGapsLead: "La estadística cuenta la marca y, si está terminado, cuánto costó. A estos les falta algo.",
  closeUnmarked: "Sin marca",
  closeNoLevel: "Terminado, sin dificultad",
  closeStay: "Seguir marcando",
  closeAnyway: "Terminar igual",
  statsTitle: "Estadísticas de la práctica",
  statsDescription:
    "Tiempos por lab, promedio, ayuda pedida y cobertura de temas. Todo queda guardado en este navegador.",
  statsHeading: "Estadísticas",
  statsIntro:
    "Separadas por modo. Sin pausas es la que importa para medir tiempos. Con pausas es práctica libre. Promedio, mejor y delta solo cuentan labs marcados Done (terminados): revisit, skipped o sin terminar no entran. Verde = menos tiempo (mejor); rojo = más tiempo (peor).",
  coverageTitle: "Qué falta practicar",
  coverageLead: "Las barras agrupan los labs por tema. El largo es cuánto de ese grupo ya hiciste en este modo.",
  coverageNote:
    "Hecho sin abrir la ayuda cuenta entero. Hecho con la ayuda abierta cuenta la mitad. Volver a ver cuenta un cuarto. Se queda el mejor de todas las prácticas de este modo, también la que está en curso. En el modo Flatpak, Podman no entra en la cuenta. En el de Podman, Flatpak no entra. Los temas los armamos nosotros para ver qué falta practicar.",
  coverageCenter: "cobertura",
  coverageDone: "hecho",
  coverageHelp: "con ayuda",
  coverageRevisit: "a revisar",
  coverageMissing: "falta",
  coverageGap: (names) => `Empezá por ${names}.`,
  coverageNone: "En este modo todavía no hay un lab hecho.",
  coverageSolid: "En este modo, todos los temas tienen sus labs hechos.",
  domainShort: {
    tools: "Archivos",
    software: "Paquetes",
    scripts: "Scripts",
    systems: "Arranque",
    storage: "Discos",
    filesystems: "NFS",
    deploy: "Servicios",
    network: "Red",
    users: "Cuentas",
    security: "SELinux",
  },
  domainName: {
    tools: "Archivos, grep y comprimidos",
    software: "Paquetes y Flatpak",
    scripts: "Scripts",
    systems: "Arranque y tuned",
    storage: "Discos, LVM y swap",
    filesystems: "NFS, permisos y resize",
    deploy: "Servicios, cron y hora",
    network: "Red y hostname",
    users: "Usuarios y sudo",
    security: "SELinux y firewall",
  },
  noClosed: "Todavía no hay una práctica cerrada",
  noClosedBody: "Cuando cierres una, o se acaben las 3 horas, acá se compara contra la anterior.",
  firstExam: "Esta es la primera práctica cerrada. La próxima se resta contra este tiempo.",
  fasterThan: (when) => `que la práctica del ${when}.`,
  lastVsPrev: (last, prev) => `Último: ${last}. Anterior: ${prev}. Un número negativo es menos tiempo.`,
  simulacros: "Prácticas",
  labsDone: "Labs hechos",
  byLab: "Por lab",
  cols: ["Lab", "Último", "Promedio", "Mejor", "Vs anterior", "Dificultad", "Ayuda"],
  redoCell: "rehacer",
  statsShowLabel: "Filtros",
  statsSearch: "Buscar lab…",
  statsClearFilters: "Limpiar",
  statsResultCount: (n) => (n === 1 ? "1 lab" : `${n} labs`),
  statsFilterStuck: "No lo entiendo",
  statsFilterRedo: "Para rehacer",
  statsFilterHelp: "Con ayuda",
  statsEmptyFilter: "Ningún lab entra en esta búsqueda.",
  statsReviewVideos: "Videos de ejemplo de este lab",
  statsMarkVideosReviewed: "Revisé los videos",
  statsMarkOneVideo: "Visto",
  statsVideoDone: "Listo",
  statsVideosReviewed: "Videos revisados",
  statsVideosProgress: (done, total) => `${done}/${total} videos`,
  statsNote:
    "El promedio usa los labs que marcaste hecho o No lo entiendo. Dificultad es la del último Done: alto y muy alto son los que conviene rehacer. Si el último fue No lo entiendo, aparecen los videos: podés marcar uno o Revisé los videos para todos. Ayuda es cuántas de esas veces pediste el panel. Vs anterior compara el último cierre con el anterior de ese mismo lab.",
  history: "Historial",
  historyEmpty: "Cuando empieces una, va a aparecer acá.",
  historyChipDone: (n) => `${n} done`,
  historyChipRevisit: (n) => `${n} revisit`,
  historyChipRedo: (n) => `${n} para rehacer`,
  historyChipSkipped: (n) => `${n} sin entender`,
  historyChipHelp: (n) => `${n} con ayuda`,
  delete: "Eliminar",
  confirmDeleteNamed: (which) => `¿Eliminar ${which}? Se borran sus tiempos de este navegador.`,
  thisRunning: "la práctica en curso",
  thisSaved: "esta práctica",
  download: "Descargar JSON",
  importJson: "Importar JSON",
  importDrop: "Soltá el JSON acá, o tocá para elegir el archivo.",
  importBad: "Ese archivo no es un JSON de esta práctica.",
  confirmImport: (runs) =>
    runs === 1
      ? "Esto reemplaza los tiempos de este navegador por 1 práctica del archivo. ¿Seguís?"
      : `Esto reemplaza los tiempos de este navegador por ${runs} prácticas del archivo. ¿Seguís?`,
  askImport: "Importar",
  wipe: "Borrar tiempos de este navegador",
  confirmWipe: "¿Borrar todas las prácticas guardadas en este navegador?",
  noTimes: "Sin tiempos todavía",
  noTimesBody: "Los contadores se guardan en este navegador. Empezá una práctica y, cuando cierres un lab, el promedio y la mejora aparecen acá.",
  goHome: "Ir al inicio",
  faster: "más rápido",
  slower: "más lento",
  similar: "parecido",
  same: "igual",
};

const en: Copy = {
  skip: "Skip to content",
  brand: "Personal practice",
  nav: "Sections",
  statsNav: "Stats",
  glossaryNav: "Glossary",
  glossaryTitle: "Linux sysadmin glossary",
  glossaryDescription:
    "Look up Linux administration words and commands: users, networking, storage, SELinux, and more, with practice examples.",
  glossaryHeading: "Glossary",
  glossaryIntro: "Terms that stall me. Search by word or by the description. Where there is a tldr link, it opens usage examples in the community repo.",
  glossarySearch: "Search by word or description…",
  glossarySearchEmpty: "No matching entries.",
  glossaryTldr: "Examples on tldr",
  glossaryTldrRepo: "tldr-pages repo",
  glossaryPopupSearch: "Search the glossary…",
  glossaryPopupClose: "Close",
  glossaryShortcut: "Ctrl+K opens the glossary",
  opensNew: "opens in a new tab",
  cv: "About me",
  themeLight: "Light",
  themeDark: "Dark",
  themeToLight: "Switch to light mode",
  themeToDark: "Switch to dark mode",
  bannerLead: "Personal practice for a Linux sysadmin exam in November (tentative date: the 13th; not confirmed yet).",
  bannerTail: "This is not an official exam.",
  homeTitle: "Personal Linux sysadmin practice",
  homeDescription:
    "You will find guided labs, a searchable glossary, a 3-hour timer, in-browser stats, and help only if you ask. Personal Linux administration practice.",
  hello: "I am preparing for a Linux sysadmin exam in November (tentative date: the 13th; not confirmed yet), and I am using this as personal practice.",
  kicker: "Personal practice · sysadmin exam",
  headlineLead: "Do what you",
  headlineMark: "already know.",
  shellKicker: "/ In the terminal",
  shellTitleLead: "You type it.",
  shellTitleMark: "You check it.",
  shellLead: "Each point is done on the machine. This window only looks up the glossary.",
  shellWindow: "practice — vm",
  shellNoteUsers: "# users",
  shellNoteNet: "# network and profile",
  shellOutputLabel: "Practice glossary output",
  shellPromptLabel: "Practice command",
  shellPromptHint: "man usermod",
  shellIntro: "It does not run system commands. It shows glossary definitions. Type help.",
  shellUnknown: (command) => `${command}: is not in this practice glossary`,
  shellManMissing: "man: missing term. For example: man usermod",
  shellExample: "example",
  shellHelp: [
    "man TERM — glossary definition",
    "TERM — the same definition, when the name is in the glossary",
    "terms — lists those names",
    "help — this list",
    "clear — clears the window and leaves the prompt",
  ],
  penguinKicker: "/ Study buddy",
  penguinTitle: "A penguin that practices too.",
  penguinCaption: "Tap the belly to change the scene: wave and dance. Each one returns to the quiet pose on its own.",
  penguinPanelLabel: "What the penguin does",
  penguinStill: "Still",
  penguinWave: "Wave",
  penguinSmile: "Smile",
  penguinDance: "Dance",
  penguinSign: "Sign",
  penguinSignText: "Hi",
  penguinLook: "Look",
  penguinNotebook: "Notebook",
  penguinSpeed: "Slow",
  penguinOrbitHint: "Drag to see the back. Tap the belly for the next scene. Tap the notebook to switch it on.",
  leadBefore:
    "The structure (3-hour clock, Revisit and Done) is inspired by how a Linux sysadmin certification exam usually looks. Quick points go first; if something stalls you, mark it and move on. A ",
  leadAfter: " shows that format from the outside.",
  start: "Start practice",
  startAnother: "Start another",
  editionLabel: "Version to practice",
  editionSwitch: (openVersion, nextVersion) =>
    `The open one is ${openVersion}. Below you start a new one with ${nextVersion}. The open one stays in the history.`,
  confirmStartOther: (openVersion, nextVersion) =>
    `The ${openVersion} practice stays in the history. Start a new one with ${nextVersion}?`,
  editionV10: "Flatpak",
  editionV9: "Podman",
  editionNote: "There are two practice modes: one with Flatpak and one with Podman. Pick the one you are studying.",
  startModesLabel: "Start a practice",
  startPausable: "Practice with pauses",
  startPausableAnother: "Another with pauses",
  startFixed: "Start without pauses",
  startFixedAnother: "Another without pauses",
  startFixedHint: "The mode for measuring time: 3 hours straight, without pauses.",
  modesNote: "Without pauses is what matters for measuring progress. With pauses is only practice: you can stop the clock.",
  resume: "Continue where you left off",
  resumeEdition: (version) => `Continue where you left off · ${version}`,
  startAnotherLabel: "Or start another",
  seeStats: "View my times",
  seeStatsImport: "Import",
  seeStatsFixed: "Times without pauses",
  seeStatsPausable: "Times with pauses",
  statsModeFixed: "Without pauses",
  statsModePausable: "With pauses · practice",
  timesNote: "Times stay in this browser.",
  loading: "Loading local times…",
  improvement: "Improvement",
  improvementFixed: "Improvement without pauses",
  runs: "Practice runs",
  best: "Best time",
  withHelp: "With help",
  passed: "Skipped",
  lastClose: "Last close",
  footerBefore: "Practice material: ",
  footerPlaylist: "YouTube playlist",
  footerAndRepo: " and ",
  footerRepo: "lab repo",
  footerAfterRepo: ". Covers V9 and newer videos: Flatpak, timers, and the init=/bin/bash reset.",
  footerLegal:
    "arceprog is not affiliated with Red Hat, CompTIA, LPI, or any Linux certification body. Exam names and marks (RHCSA, Linux+, LPIC, and others), if they appear, are for identification only; this is unofficial personal practice.",
  noscript: "This practice stores times in the browser and needs JavaScript.",
  videoTitle: "public video about the exam format",
  confirmReplace: "One is already running. If you start another, that one is saved as abandoned.",
  resumeAbandoned: "Continue this one",
  confirmResumeOther: "Another practice is in progress. If you continue this one, that other one goes to the history and can be continued too.",
  startedNote: (when) => `Started on ${when}. The clock is running.`,
  startedPausedNote: (when) => `Started on ${when}. The clock is stopped.`,
  startedPausableNote: (when) => `Started on ${when}. You can stop the clock.`,
  firstClose: (clock) => `First close: ${clock}. The next one is compared with this.`,
  openRun: "A practice run is still open. The comparison appears when it ends or the time runs out.",
  noCloseYet: "After you close the first one, this shows whether the next was shorter.",
  deltaLine: (delta, label) => `${delta} · ${label} than the previous one`,
  tally: ({ done, revisit, redo, skipped, help }) =>
    `${done} done · ${revisit} revisit · ${redo} to redo · ${skipped} not understood · ${help} with help`,
  examTitle: "Practice in progress",
  examDescription:
    "Current lab with a 3-hour clock, objectives, steps, and optional help. Continues the same personal Linux administration practice.",
  emptyTitle: "No practice in progress",
  emptyBody: "The 3-hour clock starts when you begin, and the list shows what is left.",
  emptyHome: "Start from the home page",
  backToList: "Back to the list",
  enterLab: "Open",
  enterHint: "Open shows that task.",
  clock: "Practice clock",
  pause: "Pause",
  resumeClock: "Resume",
  paused: "Paused",
  floatDrag: "Drag",
  thisLab: "This lab",
  missing: "Left",
  redoCount: "Redo",
  revisit: "Revisit (come back later)",
  done: "Done (finished)",
  strategyTitle: "Do what you already know first",
  strategyBody:
    "Quick points go first. If a task stalls you, mark it Revisit (come back later) and move on. Done (finished) means it is done: on that same line you set how hard the points felt. High and very high are the ones to redo. Anything unmarked is still left. You do not have to go in order.",
  listCreditBefore: "The clock and marks (Revisit / Done) follow the usual Linux sysadmin cert format. Reference: ",
  groupClient: "On the client",
  groupServer: "On the server",
  groupBoth: "On both",
  groupExtras: "Extras, if you have time",
  unscoredBadge: "Does not count toward final stats",
  unscoredNote:
    "This extra is left out of coverage, averages, and Continue leftovers. You can still watch it and mark Done.",
  marksLegend: "Revisit (come back later) · Done (finished)",
  foldDone: "Hide finished",
  unfoldDone: (count) => `Show ${count} finished`,
  emptyGroup: "Nothing in this group.",
  passedMeta: "skipped, you did not understand it",
  stuckNote: "Above very high. This is the one that stalled you the most.",
  helpMeta: "with help",
  redoMeta: "to redo",
  difficulty: "Difficulty",
  difficultyAria: "How hard the points felt",
  levels: levelsEn,
  helpAsked: "Help requested",
  helpMarked: "This lab is marked in the stats.",
  stepsTitle: "Task detail",
  commandsTitle: "Commands to look at",
  copyCmd: "Copy",
  copiedCmd: "Copied",
  slipLabel: "A mistake I made",
  helpPickOne: "Pick one way · you do not need both",
  helpOption: (n, name) => (name ? `Option ${n} · ${name}` : `Option ${n}`),
  asWho: (who) => `As ${who}`,
  videosTitle: "Videos",
  reviewVideos: "Marked very high, to redo. Watch this lab's example videos again.",
  askHelp: "Ask for help",
  showHelp: "Show help",
  hideHelp: "Hide help",
  redo: "Redo",
  skipTask: "I don't get it",
  actionsHint:
    "Revisit (come back later) leaves this task and keeps it marked so you can return. Done (finished) means it is done: then you set how hard the points felt. High and very high stay marked to redo. I don't get it sits above very high. Help stays closed until you ask.",
  closeRun: "Finish and save",
  closeKept: "The times stay in this browser.",
  deleteRun: "Delete this practice",
  summaryHint: "The detail and the comparison with other attempts are in stats.",
  backHome: "Back home",
  closed: "Practice closed",
  timedOut: "The 3 hours are over",
  abandoned: "Practice abandoned",
  inProgress: "In progress",
  continueLeftovers: (n) => (n === 1 ? "Continue 1 leftover" : `Continue ${n} leftovers`),
  continueLeftoversHint:
    "No 3-hour clock. Only labs you did not finish. Those times do not enter the timed-run average or best.",
  leftoverBadge: "Leftovers · no limit",
  leftoverNote:
    "This is not the timed exam: only labs that are not Done yet. Finish them at your pace; the 3-hour clock is off.",
  leftoverClock: "No limit",
  leftoverEmpty: "No leftover labs in this practice.",
  statusPassed: "Skipped",
  statusRedo: "Redo",
  statusOpen: "Still open when time ran out",
  statusNone: "Unmarked",
  attempt: (n) => `Attempt ${n} of this lab. The lab clock went back to zero.`,
  confirmDelete: "Delete this practice? Its times are removed from this browser.",
  confirmClose: "Finish and save what you have marked so far?",
  askBack: "Go back",
  askDelete: "Delete",
  askWipe: "Erase all",
  askStart: "Start",
  closeGapsTitle: "Marks are missing for the stats",
  closeGapsLead: "Stats count the mark and, when it is done, how hard it felt. These are missing something.",
  closeUnmarked: "No mark",
  closeNoLevel: "Done, with no difficulty",
  closeStay: "Keep marking",
  closeAnyway: "Finish anyway",
  statsTitle: "Practice stats",
  statsDescription:
    "Time per lab, averages, help used, and topic coverage. Everything stays stored in this browser.",
  statsHeading: "Stats",
  statsIntro:
    "Split by mode. Without pauses is what matters for measuring times. With pauses is free practice. Average, best and delta only count labs marked Done: revisit, skipped or unfinished do not count. Green = less time (better); red = more time (worse).",
  coverageTitle: "What still needs practice",
  coverageLead: "The bars group the labs by topic. The length is how much of that group you have already done in this mode.",
  coverageNote:
    "Done without opening help counts in full. Done with help open counts as half. Revisit counts as a quarter. The best mark across every practice in this mode is kept, including the one in progress. In Flatpak mode, Podman stays out of the count. In Podman mode, Flatpak stays out. We made these topics to see what still needs practice.",
  coverageCenter: "coverage",
  coverageDone: "done",
  coverageHelp: "with help",
  coverageRevisit: "revisit",
  coverageMissing: "missing",
  coverageGap: (names) => `Start with ${names}.`,
  coverageNone: "No lab is done yet in this mode.",
  coverageSolid: "In this mode, every topic has its labs done.",
  domainShort: {
    tools: "Files",
    software: "Packages",
    scripts: "Scripts",
    systems: "Boot",
    storage: "Disks",
    filesystems: "NFS",
    deploy: "Services",
    network: "Network",
    users: "Accounts",
    security: "SELinux",
  },
  domainName: {
    tools: "Files, grep, and archives",
    software: "Packages and Flatpak",
    scripts: "Scripts",
    systems: "Boot and tuned",
    storage: "Disks, LVM, and swap",
    filesystems: "NFS, permissions, and resize",
    deploy: "Services, cron, and time",
    network: "Network and hostname",
    users: "Users and sudo",
    security: "SELinux and firewall",
  },
  noClosed: "No practice has been closed yet",
  noClosedBody: "When you close one, or the 3 hours run out, this compares it with the previous one.",
  firstExam: "This is the first closed practice. The next one is subtracted from this time.",
  fasterThan: (when) => `than the practice of ${when}.`,
  lastVsPrev: (last, prev) => `Latest: ${last}. Previous: ${prev}. A negative number means less time.`,
  simulacros: "Practice runs",
  labsDone: "Labs done",
  byLab: "By lab",
  cols: ["Lab", "Latest", "Average", "Best", "Vs previous", "Difficulty", "Help"],
  redoCell: "redo",
  statsShowLabel: "Filters",
  statsSearch: "Search lab…",
  statsClearFilters: "Clear",
  statsResultCount: (n) => (n === 1 ? "1 lab" : `${n} labs`),
  statsFilterStuck: "I don't get it",
  statsFilterRedo: "To redo",
  statsFilterHelp: "With help",
  statsEmptyFilter: "No lab matches this search.",
  statsReviewVideos: "Example videos for this lab",
  statsMarkVideosReviewed: "I reviewed the videos",
  statsMarkOneVideo: "Watched",
  statsVideoDone: "Done",
  statsVideosReviewed: "Videos reviewed",
  statsVideosProgress: (done, total) => `${done}/${total} videos`,
  statsNote:
    "The average uses labs you marked done or I don't get it. Difficulty is the last Done: high and very high are the ones to redo. If the last mark was I don't get it, the videos show up: mark one, or I reviewed the videos for all. Help is how many of those times you opened the panel. Vs previous compares the latest close with the one before for that same lab.",
  history: "History",
  historyEmpty: "When you start one, it shows up here.",
  historyChipDone: (n) => `${n} done`,
  historyChipRevisit: (n) => `${n} revisit`,
  historyChipRedo: (n) => `${n} to redo`,
  historyChipSkipped: (n) => `${n} not understood`,
  historyChipHelp: (n) => `${n} with help`,
  delete: "Delete",
  confirmDeleteNamed: (which) => `Delete ${which}? Its times are removed from this browser.`,
  thisRunning: "the practice in progress",
  thisSaved: "this practice",
  download: "Download JSON",
  importJson: "Import JSON",
  importDrop: "Drop the JSON here, or tap to pick the file.",
  importBad: "That file is not a practice JSON from this site.",
  confirmImport: (runs) =>
    runs === 1
      ? "This replaces the times in this browser with 1 practice from the file. Continue?"
      : `This replaces the times in this browser with ${runs} practices from the file. Continue?`,
  askImport: "Import",
  wipe: "Erase times in this browser",
  confirmWipe: "Erase every practice run saved in this browser?",
  noTimes: "No times yet",
  noTimesBody: "Counters stay in this browser. Start a practice and, when you close a lab, the average and the improvement show up here.",
  goHome: "Go home",
  faster: "faster",
  slower: "slower",
  similar: "about the same",
  same: "same",
};

const UI: Record<Locale, Copy> = { es, en };

export function getUI(locale: Locale = DEFAULT_LOCALE): Copy {
  return UI[locale] ?? UI[DEFAULT_LOCALE];
}

export function difficultyLabel(
  value: "very_low" | "low" | "normal" | "high" | "very_high" | null | undefined,
  locale: Locale = pageLocale(),
): string {
  if (!value) return "";
  return getUI(locale).levels.find((item) => item.id === value)?.label ?? "";
}
