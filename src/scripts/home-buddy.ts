/**
 * Loader for the 3D penguin section (#pinguino).
 * Three.js is NOT in the home bundle: it only downloads when the section gets
 * close to the viewport, through a dynamic import of ./buddy-scene.
 */
export function mountHomeBuddy(): void {
  const section = document.getElementById("pinguino");
  const stage = section?.querySelector<HTMLElement>("[data-buddy-stage]");
  const canvas = section?.querySelector<HTMLCanvasElement>("[data-buddy-canvas]");
  if (!section || !stage || !canvas) return;

  if (!hasWebGL()) {
    stage.hidden = true;
    return;
  }

  let started = false;
  const start = (): void => {
    if (started) return;
    started = true;
    import("./buddy-scene")
      .then(({ mountBuddyScene }) => {
        mountBuddyScene(stage, canvas, { signText: stage.dataset.signText ?? "Hola" });
      })
      .catch(() => {
        stage.hidden = true;
      });
  };

  if (!("IntersectionObserver" in window)) {
    start();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      start();
    },
    { rootMargin: "320px 0px" },
  );
  observer.observe(section);
}

function hasWebGL(): boolean {
  try {
    const probe = document.createElement("canvas");
    return Boolean(probe.getContext("webgl2") ?? probe.getContext("webgl"));
  } catch {
    return false;
  }
}
