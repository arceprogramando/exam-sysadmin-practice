import type { Locale } from "./i18n";

/** Public walkthrough of a typical remote practical exam desktop. */
export const PUBLIC_DESK_VIDEO = "https://www.youtube.com/watch?v=Me6Y12-sux8";

export interface BasicsCopy {
  title: string;
  description: string;
  heading: string;
  body: string;
  videoLink: string;
}

const es: BasicsCopy = {
  title: "Fundamentos",
  description: "Un video público sobre cómo se ve el escritorio en un examen práctico de sysadmin.",
  heading: "Fundamentos",
  body: "Antes de los labs, conviene ver cómo se mueve uno en el escritorio del examen: reloj, terminal, las dos máquinas y la consola. Este video público muestra ese formato.",
  videoLink: "Ver el video",
};

const en: BasicsCopy = {
  title: "Basics",
  description: "A public video about how the desktop looks in a practical sysadmin exam.",
  heading: "Basics",
  body: "Before the labs, it helps to see how you move around the exam desktop: the clock, the terminal, the two machines, and the console. This public video shows that format.",
  videoLink: "Watch the video",
};

export function basicsFor(locale: Locale): BasicsCopy {
  return locale === "en" ? en : es;
}
