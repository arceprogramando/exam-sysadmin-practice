/**
 * Two penguins for the #pinguino section, shown side by side to compare.
 * The interactive one is built from Three.js primitives (it waves, holds the
 * notebook, and reacts to clicks). /penguin.glb stands to its right, a little smaller.
 * The only generated textures are two tiny canvases (notebook screen, sign).
 *
 * This module is loaded on demand by home-buddy.ts, so Three.js and the GLB
 * never land in the initial home bundle.
 */
import {
  AmbientLight,
  Box3,
  BoxGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Timer,
  TorusGeometry,
  TOUCH,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MAX_PIXEL_RATIO = 1.5;
/** Seconds (real time) for a pose weight to go 0 → 1. */
const EASE_SECONDS = 0.4;
const CHEST = { x: 0, y: 1.4, z: 0 };
const SCENES: Exclude<PoseName, "still">[] = ["wave", "dance"];
const SHOT_LEN: Record<Exclude<PoseName, "still">, number> = {
  wave: 3.2,
  dance: 3.6,
};

function nextScene(current: PoseName): PoseName {
  const index = (SCENES as PoseName[]).indexOf(current);
  if (index < 0) return "wave";
  if (index === SCENES.length - 1) return "still";
  return SCENES[index + 1];
}

function partOf(object: Object3D): string | null {
  let node: Object3D | null = object;
  while (node) {
    const hit = node.userData.hit;
    if (typeof hit === "string") return hit;
    node = node.parent;
  }
  return null;
}

function tag(object: Object3D, hit: string): void {
  object.traverse((node) => {
    node.userData.hit = hit;
  });
}

export type PoseName = "still" | "wave" | "dance";
export type ToggleName = "smile" | "sign" | "look" | "notebook";

export interface BuddyState {
  pose: PoseName;
  smile: boolean;
  sign: boolean;
  look: boolean;
  notebook: boolean;
  speed: number;
}

export interface BuddyController {
  setPose: (name: PoseName) => void;
  setToggle: (name: ToggleName, on: boolean) => void;
  setSpeed: (value: number) => void;
  getState: () => BuddyState;
  onChange: (listener: (state: BuddyState) => void) => void;
}

export interface BuddyOptions {
  /** Text drawn on the pop-up sign. */
  signText: string;
}

type Theme = "light" | "dark";

interface Palette {
  floeTop: number;
  floeSide: number;
  iceberg: number;
  icebergFar: number;
  tree: number;
  hemiSky: number;
  hemiGround: number;
  hemi: number;
  key: number;
  fill: number;
  ambient: number;
}

const PALETTES: Record<Theme, Palette> = {
  dark: {
    floeTop: 0x6f8aa0,
    floeSide: 0x4b6378,
    iceberg: 0x8fa9bd,
    icebergFar: 0x6d879c,
    tree: 0x58748a,
    hemiSky: 0xcfe6f5,
    hemiGround: 0x2a3a4a,
    hemi: 1.0,
    key: 2.2,
    fill: 0.9,
    ambient: 0.35,
  },
  light: {
    floeTop: 0xe9f1f6,
    floeSide: 0xc3d3de,
    iceberg: 0xf0f5f9,
    icebergFar: 0xd6e2ea,
    tree: 0x9db6c6,
    hemiSky: 0xffffff,
    hemiGround: 0xaebcc8,
    hemi: 1.3,
    key: 2.6,
    fill: 0.7,
    ambient: 0.45,
  },
};

const COLORS = {
  body: 0x34465a,
  belly: 0xf4f7f9,
  beak: 0xf29a52,
  feet: 0xf0924a,
  eye: 0x12171d,
  mouth: 0x2a1a1c,
  blush: 0xf2a7a0,
  notebookShell: 0xd9dee4,
  notebookDark: 0x3a4149,
  keyboard: 0x2b3139,
  signBoard: 0xf3e6c8,
  signPost: 0x8d6b4a,
};

export function mountBuddyScene(
  stage: HTMLElement,
  canvas: HTMLCanvasElement,
  options: BuddyOptions,
): BuddyController {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 40);
  camera.position.set(0.3, 2.5, 8.4);

  const lights = buildLights(scene);
  const world = buildWorld(scene);
  const penguin = buildPenguin(options.signText);
  // Shift left so the loaded model can stand on the same ice without covering the flipper.
  penguin.root.position.x = -1.02;
  scene.add(penguin.root);
  const modelLoader = new GLTFLoader();
  modelLoader.load("/penguin.glb?v=2", (gltf) => {
    const model = gltf.scene;
    const bounds = new Box3().setFromObject(model);
    const height = Math.max(bounds.max.y - bounds.min.y, 0.001);
    // Procedural penguin is about 3.2 tall; keep this copy a little smaller.
    model.scale.setScalar(2.62 / height);
    bounds.setFromObject(model);
    const center = bounds.getCenter(new Vector3());
    model.position.set(0.78 - bounds.min.x, -bounds.min.y + 0.01, -center.z);
    scene.add(model);
    if (!running) renderOnce();
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ----- camera orbit ----- */
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(CHEST.x, CHEST.y, CHEST.z);
  controls.enablePan = false;
  controls.enableDamping = !reducedMotion.matches;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.7;
  controls.minDistance = 5;
  controls.maxDistance = 12;
  controls.minPolarAngle = 0.45;
  controls.maxPolarAngle = Math.PI / 2 - 0.06; // never under the ice
  controls.touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };
  controls.update();
  // Plain wheel keeps scrolling the page; pinch-zoom (ctrl+wheel) and two fingers zoom the scene.
  canvas.addEventListener(
    "wheel",
    (event) => {
      if (!event.ctrlKey) event.stopImmediatePropagation();
    },
    { capture: true, passive: true },
  );

  let dragging = false;
  let settling = false;
  controls.addEventListener("start", () => {
    dragging = true;
    settling = true;
  });
  controls.addEventListener("end", () => {
    dragging = false;
  });
  controls.addEventListener("change", () => {
    if (!running) renderOnce();
  });

  /* ----- click on the notebook ----- */
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  let pressAt: { x: number; y: number; time: number } | null = null;
  canvas.addEventListener("pointerdown", (event) => {
    pressAt = { x: event.clientX, y: event.clientY, time: performance.now() };
  });
  canvas.addEventListener("pointerup", (event) => {
    if (!pressAt) return;
    const moved = Math.hypot(event.clientX - pressAt.x, event.clientY - pressAt.y);
    const held = performance.now() - pressAt.time;
    pressAt = null;
    if (moved > 6 || held > 600) return;
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(penguin.root, true);
    const hit = hits.length > 0 ? partOf(hits[0].object) : null;
    if (hit === "notebook") setToggle("notebook", !state.notebook);
    else if (hit === "head") {
      const on = !state.smile;
      setToggle("smile", on);
      setToggle("look", on);
    } else if (hit === "flipper" || hit === "sign") {
      const on = !state.sign;
      setToggle("sign", on);
      if (on) setPose("still");
    } else if (hit === "body") {
      if (state.sign) setToggle("sign", false);
      setPose(nextScene(state.pose));
    }
  });

  /* ----- pointer for "look" ----- */
  window.addEventListener("pointermove", (event) => {
    if (!state.look) return;
    const rect = stage.getBoundingClientRect();
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    penguin.setLookTarget(MathUtils.clamp(nx, -1.4, 1.4), MathUtils.clamp(ny, -1.2, 1.2));
    if (!running) staticFrame();
  });

  /* ----- state ----- */
  const state: BuddyState = { pose: "still", smile: false, sign: false, look: false, notebook: true, speed: 0.5 };
  const listeners: ((state: BuddyState) => void)[] = [];
  function emit(): void {
    for (const listener of listeners) listener({ ...state });
  }

  const timer = new Timer();
  let onScreen = true;
  let running = false;

  function applyTheme(): void {
    const theme: Theme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    const palette = PALETTES[theme];
    world.floeTop.color.setHex(palette.floeTop);
    world.floeSide.color.setHex(palette.floeSide);
    world.iceberg.color.setHex(palette.iceberg);
    world.icebergFar.color.setHex(palette.icebergFar);
    world.tree.color.setHex(palette.tree);
    lights.hemi.color.setHex(palette.hemiSky);
    lights.hemi.groundColor.setHex(palette.hemiGround);
    lights.hemi.intensity = palette.hemi;
    lights.key.intensity = palette.key;
    lights.fill.intensity = palette.fill;
    lights.ambient.intensity = palette.ambient;
  }

  function resize(): void {
    const width = Math.max(1, Math.floor(stage.clientWidth));
    const height = Math.max(1, Math.floor(stage.clientHeight));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function renderOnce(): void {
    renderer.render(scene, camera);
  }

  /** Reduced motion: snap weights to their targets, pose once, draw once. */
  function staticFrame(): void {
    penguin.snap();
    renderOnce();
  }

  function frame(): void {
    timer.update();
    const dtReal = Math.min(timer.getDelta(), 0.1);
    penguin.update(dtReal, dtReal * state.speed);
    if (penguin.finishedOneShot()) {
      state.pose = "still";
      emit();
    }
    if (settling) {
      const moved = controls.update();
      if (!dragging && !moved) settling = false;
    }
    renderOnce();
  }

  function syncLoop(): void {
    const shouldRun = onScreen && !document.hidden && !reducedMotion.matches;
    if (shouldRun === running) return;
    running = shouldRun;
    if (running) {
      timer.reset();
      renderer.setAnimationLoop(frame);
    } else {
      renderer.setAnimationLoop(null);
      if (reducedMotion.matches) staticFrame();
    }
  }

  /* ----- public API ----- */
  function setPose(name: PoseName): void {
    state.pose = name;
    penguin.setPose(name);
    if (!running) staticFrame();
    emit();
  }

  function setToggle(name: ToggleName, on: boolean): void {
    state[name] = on;
    penguin.setToggle(name, on);
    if (!running) staticFrame();
    emit();
  }

  function setSpeed(value: number): void {
    state.speed = MathUtils.clamp(value, 0.3, 1.2);
    emit();
  }

  applyTheme();
  resize();
  penguin.setToggle("notebook", true);
  staticFrame();
  stage.dataset.ready = "true";
  syncLoop();

  new ResizeObserver(() => {
    resize();
    if (!running) renderOnce();
  }).observe(stage);

  new MutationObserver(() => {
    applyTheme();
    if (!running) renderOnce();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  new IntersectionObserver(
    (entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting);
      syncLoop();
    },
    { threshold: 0 },
  ).observe(canvas);

  document.addEventListener("visibilitychange", syncLoop);
  reducedMotion.addEventListener("change", () => {
    controls.enableDamping = !reducedMotion.matches;
    syncLoop();
    if (!running) staticFrame();
  });

  return {
    setPose,
    setToggle,
    setSpeed,
    getState: () => ({ ...state }),
    onChange: (listener) => {
      listeners.push(listener);
    },
  };
}

/* ---------- lights ---------- */

function buildLights(scene: Scene) {
  const hemi = new HemisphereLight(0xffffff, 0x334455, 1);
  const key = new DirectionalLight(0xfff4e6, 2);
  key.position.set(3.5, 6, 4.5);
  const fill = new DirectionalLight(0x9ad7e4, 1);
  fill.position.set(-5, 3, -3);
  const ambient = new AmbientLight(0xffffff, 0.3);
  scene.add(hemi, key, fill, ambient);
  return { hemi, key, fill, ambient };
}

/* ---------- ice floe, icebergs, trees ---------- */

function buildWorld(scene: Scene) {
  const floeTop = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true });
  const floeSide = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
  const iceberg = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, flatShading: true });
  const icebergFar = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
  const tree = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });

  // Floe: a squat 9-sided cylinder. Top and side get different materials so the rim reads.
  const floe = new Mesh(new CylinderGeometry(4.6, 5.0, 0.45, 9, 1), [floeSide, floeTop, floeSide]);
  floe.position.set(0, -0.225, -0.2);
  floe.rotation.y = 0.2;
  scene.add(floe);

  // Low-poly icebergs around the penguin (also behind the camera, so the back view has scenery).
  // The two tall ones sit wide so the back view keeps a clear corridor to the penguin.
  const bergs: [number, number, number, number, number, boolean][] = [
    // x, z, radius, height, yaw, far
    [-3.2, -2.6, 1.2, 3.0, 0.3, false],
    [3.1, -2.8, 1.15, 2.5, 0.7, false],
    [-3.9, -0.8, 0.8, 1.5, 1.1, true],
    [3.9, -0.6, 0.6, 1.1, 0.2, true],
    [-3.4, 1.8, 0.9, 1.7, 0.9, true],
    [3.4, 2.4, 0.7, 1.3, 1.4, true],
    [0.2, -4.2, 0.9, 1.3, 1.8, true],
  ];
  for (const [x, z, radius, height, yaw, far] of bergs) {
    const mesh = new Mesh(new ConeGeometry(radius, height, 5, 1), far ? icebergFar : iceberg);
    mesh.position.set(x, height / 2 - 0.02, z);
    mesh.rotation.y = yaw;
    scene.add(mesh);
  }

  // Pine trees, stacked cones like the reference.
  scene.add(buildTree(tree, 2.2, -1.4, 0.9), buildTree(tree, 2.8, -0.9, 0.65), buildTree(tree, -2.6, 0.9, 0.7));

  return { floeTop, floeSide, iceberg, icebergFar, tree };
}

function buildTree(material: MeshStandardMaterial, x: number, z: number, scale: number): Group {
  const group = new Group();
  const tiers = [
    [0.55, 0.7, 0.3],
    [0.45, 0.6, 0.65],
    [0.32, 0.5, 0.98],
  ];
  for (const [radius, height, y] of tiers) {
    const tier = new Mesh(new ConeGeometry(radius, height, 6, 1), material);
    tier.position.y = y;
    group.add(tier);
  }
  const trunk = new Mesh(new CylinderGeometry(0.08, 0.1, 0.25, 6), material);
  trunk.position.y = 0.1;
  group.add(trunk);
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  return group;
}

/* ---------- penguin ---------- */

interface Penguin {
  root: Group;
  notebookMeshes: Object3D[];
  setPose: (name: PoseName) => void;
  setToggle: (name: ToggleName, on: boolean) => void;
  setLookTarget: (x: number, y: number) => void;
  /** Advance weights (real seconds) and motion (pose seconds), then pose the rig. */
  update: (dtReal: number, dtPose: number) => void;
  /** Snap weights to targets and pose once (reduced motion). */
  snap: () => void;
  /** True exactly once when a wave/dance has run its course. */
  finishedOneShot: () => boolean;
}

/** Resting flipper: hangs slightly outward, well clear of the torso. */
const FLIPPER_REST_Z = 0.38;

function buildPenguin(signText: string): Penguin {
  const root = new Group();
  const body = new Group();
  root.add(body);

  const bodyMaterial = new MeshStandardMaterial({ color: COLORS.body, roughness: 0.7 });
  const bellyMaterial = new MeshStandardMaterial({ color: COLORS.belly, roughness: 0.8 });
  const beakMaterial = new MeshStandardMaterial({ color: COLORS.beak, roughness: 0.55 });
  const feetMaterial = new MeshStandardMaterial({ color: COLORS.feet, roughness: 0.7 });
  const eyeMaterial = new MeshStandardMaterial({ color: COLORS.eye, roughness: 0.35 });
  const mouthMaterial = new MeshStandardMaterial({ color: COLORS.mouth, roughness: 0.9 });
  const shineMaterial = new MeshBasicMaterial({ color: 0xffffff });
  const blushMaterial = new MeshStandardMaterial({ color: COLORS.blush, roughness: 1, transparent: true, opacity: 0.75 });

  // Torso: chubby egg.
  const torso = new Mesh(new SphereGeometry(1, 40, 28), bodyMaterial);
  torso.scale.set(1, 1.08, 0.92);
  torso.position.y = 1.2;
  body.add(torso);
  tag(torso, "body");

  // Belly: smaller sphere pushed forward so it meets the torso at a steep angle (clean edge).
  const belly = new Mesh(new SphereGeometry(0.75, 32, 24), bellyMaterial);
  belly.scale.set(0.92, 1.1, 0.72);
  belly.position.set(0, 1.1, 0.52);
  body.add(belly);
  tag(belly, "body");

  // Head: round, slightly bigger than a "real" penguin so it reads as a chick.
  const head = new Group();
  head.position.y = 2.35;
  body.add(head);
  tag(head, "head");
  const skull = new Mesh(new SphereGeometry(0.82, 32, 22), bodyMaterial);
  head.add(skull);

  // Two white face lobes, nearly flush with the skull, overlapping into a heart-shaped mask.
  const lobeGeometry = new SphereGeometry(0.56, 24, 16);
  for (const side of [-1, 1]) {
    const lobe = new Mesh(lobeGeometry, bellyMaterial);
    lobe.scale.set(0.76, 0.95, 0.85);
    lobe.position.set(side * 0.23, -0.04, 0.34);
    head.add(lobe);
  }

  // Eyes: half-sunk into the lobes so they sit on the face.
  const eyeGeometry = new SphereGeometry(0.1, 16, 12);
  const shineGeometry = new SphereGeometry(0.032, 8, 6);
  const eyes: Mesh[] = [];
  const EYE_BASE = { x: 0.25, y: 0.06, z: 0.76 };
  for (const side of [-1, 1]) {
    const eye = new Mesh(eyeGeometry, eyeMaterial);
    eye.position.set(side * EYE_BASE.x, EYE_BASE.y, EYE_BASE.z);
    const shine = new Mesh(shineGeometry, shineMaterial);
    shine.position.set(0.03, 0.035, 0.085);
    eye.add(shine);
    head.add(eye);
    eyes.push(eye);
  }

  // Beak: small squashed cone at the bottom of the mask, below the eyes.
  const beak = new Mesh(new ConeGeometry(0.11, 0.26, 8, 1), beakMaterial);
  beak.rotation.x = Math.PI / 2;
  beak.scale.y = 0.7;
  beak.position.set(0, -0.2, 0.9);
  head.add(beak);

  // Mouth: an arc plus a dark fill, scaled by the smile weight.
  const mouth = new Group();
  mouth.position.set(0, -0.33, 0.78);
  head.add(mouth);
  const lip = new Mesh(new TorusGeometry(0.11, 0.016, 6, 14, Math.PI), mouthMaterial);
  lip.rotation.z = Math.PI;
  mouth.add(lip);
  const mouthFill = new Mesh(new SphereGeometry(0.085, 12, 8), mouthMaterial);
  mouthFill.scale.set(1.25, 0.5, 0.25);
  mouthFill.position.y = 0.03;
  mouth.add(mouthFill);

  // Blush.
  const blushGeometry = new SphereGeometry(0.085, 10, 8);
  const blushes: Mesh[] = [];
  const BLUSH_Y = -0.2;
  for (const side of [-1, 1]) {
    const blush = new Mesh(blushGeometry, blushMaterial);
    blush.scale.set(1, 0.7, 0.35);
    blush.position.set(side * 0.55, BLUSH_Y, 0.6);
    blush.lookAt(side * 2, -0.5, 1.6);
    head.add(blush);
    blushes.push(blush);
  }

  // Tail.
  const tail = new Mesh(new ConeGeometry(0.28, 0.55, 6, 1), bodyMaterial);
  tail.rotation.x = -Math.PI / 2 - 0.55;
  tail.position.set(0, 0.55, -0.95);
  body.add(tail);

  // Flippers: capsules hanging from a shoulder pivot at the torso's edge, flattened per role:
  // the waving one is a blade flat against the side (thin in x), so the palm faces the camera
  // when raised; the holding one is flat in z, so it reads as a tray once rotated forward.
  const flipperGeometry = new CapsuleGeometry(0.19, 0.85, 4, 10);
  function makeFlipper(side: number, flat: "x" | "z"): Group {
    const pivot = new Group();
    pivot.position.set(side * 1.0, 1.7, 0.05);
    const mesh = new Mesh(flipperGeometry, bodyMaterial);
    if (flat === "x") mesh.scale.set(0.62, 1, 1);
    else mesh.scale.set(1, 1, 0.45);
    mesh.position.y = -0.5;
    pivot.add(mesh);
    body.add(pivot);
    return pivot;
  }
  const wavingFlipper = makeFlipper(1, "x");
  const holdingFlipper = makeFlipper(-1, "z");
  tag(wavingFlipper, "flipper");
  tag(holdingFlipper, "body");
  // Slight outward tilt so the holding flipper also reads from behind.
  const HOLD_ROT = { x: -1.3, y: 0, z: 0.22 };
  holdingFlipper.rotation.set(HOLD_ROT.x, HOLD_ROT.y, HOLD_ROT.z);

  // Notebook: resting on the forward flipper, beside the belly, screen toward the camera.
  const notebookParts = buildNotebook();
  const notebook = notebookParts.group;
  notebook.scale.setScalar(1.2);
  notebook.position.set(-1.05, 1.56, 1.06);
  notebook.rotation.set(-0.18, 0.22, 0.04);
  body.add(notebook);
  body.updateMatrixWorld(true);
  holdingFlipper.attach(notebook); // keeps world transform, now parented to the flipper
  tag(notebook, "notebook");

  // Feet: oval with three toes. Planted (they do not bounce), but they turn with the body.
  const feet = new Group();
  root.add(feet);
  const footGeometry = new SphereGeometry(0.2, 14, 10);
  const toeGeometry = new SphereGeometry(0.09, 10, 8);
  for (const side of [-1, 1]) {
    const foot = new Group();
    foot.position.set(side * 0.4, 0.07, 0.45);
    foot.rotation.y = side * 0.25;
    const pad = new Mesh(footGeometry, feetMaterial);
    pad.scale.set(1.1, 0.4, 1.6);
    foot.add(pad);
    for (const toe of [-1, 0, 1]) {
      const mesh = new Mesh(toeGeometry, feetMaterial);
      mesh.position.set(toe * 0.14, 0, 0.3);
      mesh.scale.set(1, 0.7, 1.2);
      foot.add(mesh);
    }
    feet.add(foot);
  }
  tag(feet, "body");

  // Soft fake shadow instead of shadow maps.
  const shadowMaterial = new MeshBasicMaterial({ color: 0x0a1218, transparent: true, opacity: 0.28 });
  const shadow = new Mesh(new CircleGeometry(1.05, 24), shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.012, 0.2);
  root.add(shadow);

  // Sign: a small board in the free flipper, not a post in the ice.
  const sign = buildSign(signText);
  // The flipper's local -y points to its tip, so the board is flipped half a turn to read upright.
  sign.position.set(0.02, -1.08, 0.22);
  sign.rotation.set(-0.5, 0.15, Math.PI + 0.1);
  wavingFlipper.add(sign);
  tag(sign, "sign");

  /* ----- weights ----- */
  const weights = { wave: 0, dance: 0, smile: 0, sign: 0, look: 0, notebook: 1 };
  const targets = { wave: 0, dance: 0, smile: 0, sign: 0, look: 0, notebook: 1 };
  type WeightName = keyof typeof weights;
  type ShotName = Exclude<PoseName, "still">;

  let poseTime = 0;
  let shot: ShotName | "" = "";
  let shotTime = 0;
  let nextBlink = 2.5;
  let finished = false;
  const lookTarget = { x: 0, y: 0 };
  const look = { x: 0, y: 0 };

  function setPose(name: PoseName): void {
    for (const key of SCENES) targets[key] = name === key ? 1 : 0;
    shot = name === "still" ? "" : name;
    shotTime = 0;
    finished = false;
  }

  function setToggle(name: ToggleName, on: boolean): void {
    targets[name] = on ? 1 : 0;
  }

  function setLookTarget(x: number, y: number): void {
    lookTarget.x = x;
    lookTarget.y = y;
  }

  function easeWeights(dtReal: number): void {
    const step = dtReal / EASE_SECONDS;
    for (const key of Object.keys(weights) as WeightName[]) {
      weights[key] = MathUtils.clamp(weights[key] + MathUtils.clamp(targets[key] - weights[key], -step, step), 0, 1);
    }
    look.x += (lookTarget.x - look.x) * Math.min(1, dtReal * 8);
    look.y += (lookTarget.y - look.y) * Math.min(1, dtReal * 8);
  }

  function update(dtReal: number, dtPose: number): void {
    easeWeights(dtReal);
    poseTime += dtPose;
    notebookParts.tickScreen(poseTime);
    if (shot) {
      shotTime += dtPose;
      if (shotTime >= SHOT_LEN[shot] - EASE_SECONDS) targets[shot] = 0;
      if (shotTime > 0.3 && targets[shot] === 0 && weights[shot] < 0.04) {
        shot = "";
        shotTime = 0;
        finished = true;
      }
    }
    if (poseTime >= nextBlink + 0.14) nextBlink = poseTime + 3 + Math.random();
    pose();
  }

  function snap(): void {
    for (const key of Object.keys(weights) as WeightName[]) weights[key] = targets[key];
    look.x = lookTarget.x;
    look.y = lookTarget.y;
    shotTime = shot ? SHOT_LEN[shot] * 0.45 : 0;
    poseTime = 0;
    notebookParts.tickScreen(0);
    pose();
  }

  function finishedOneShot(): boolean {
    const value = finished;
    finished = false;
    return value;
  }

  /** Compose the rig from weights + timers. Pure function of the current state. */
  function pose(): void {
    const t = poseTime;
    const wave = MathUtils.smoothstep(weights.wave, 0, 1);
    const dance = MathUtils.smoothstep(weights.dance, 0, 1);
    const smile = MathUtils.smoothstep(weights.smile, 0, 1);
    const signW = MathUtils.smoothstep(weights.sign, 0, 1);
    const lookW = MathUtils.smoothstep(weights.look, 0, 1);
    const lid = MathUtils.smoothstep(weights.notebook, 0, 1);

    // Idle: breathe, sway (~half a turn per second before the slider), tiny bob.
    const breathe = Math.sin(t * 1.6) * 0.012;
    let bodyY = Math.sin(t * 2.0) * 0.015;
    let bodyRotY = 0.08 + Math.sin(t * Math.PI) * 0.05;
    let bodyRotZ = 0;
    let bodyRotX = 0;
    let headRotX = Math.sin(t * 1.7) * 0.03;
    let headRotY = 0;
    let headRotZ = -0.08 + Math.sin(t * 1.3) * 0.04;
    let waveZ = FLIPPER_REST_Z;
    let waveX = 0.1;
    let waveY = 0; // wrist twist: palm turns to the camera as the flipper rises
    let holdX = HOLD_ROT.x;
    let holdZ = HOLD_ROT.z;

    // Wave: the free flipper lifts, dips, swings twice, then the weight lowers it.
    if (wave > 0) {
      const wt = shot === "wave" ? shotTime : 1.2;
      const dip = Math.sin(MathUtils.clamp(wt / 0.45, 0, 1) * Math.PI) * 0.12;
      const swingPhase = MathUtils.clamp((wt - 0.35) / 2.1, 0, 1);
      const swing = Math.sin(swingPhase * Math.PI * 2) * 1.05 * Math.sin(swingPhase * Math.PI);
      bodyY -= dip * wave;
      headRotZ += (dip + swing * 0.2) * wave;
      waveZ = MathUtils.lerp(FLIPPER_REST_Z, 2.65 + swing, wave);
      waveX = MathUtils.lerp(0.15, -0.55, wave);
      waveY = MathUtils.lerp(0, 1.15, wave);
    }

    // Dance: two hops and a pump of the flippers. The body stays facing the camera.
    if (dance > 0) {
      const dt = shot === "dance" ? shotTime : 1.1;
      const hop = Math.abs(Math.sin(dt * Math.PI * 1.4)) * 0.42;
      bodyY += hop * dance;
      bodyRotZ += Math.sin(dt * Math.PI * 2.8) * 0.12 * dance;
      headRotZ += Math.sin(dt * Math.PI * 2.8 + 0.4) * 0.22 * dance;
      waveZ = MathUtils.lerp(waveZ, 1.55 + Math.sin(dt * Math.PI * 2.8) * 0.55, dance);
      waveX = MathUtils.lerp(waveX, -0.2, dance);
      waveY = MathUtils.lerp(waveY, 0.8, dance);
      holdX = MathUtils.lerp(HOLD_ROT.x, HOLD_ROT.x + Math.sin(dt * Math.PI * 2.8) * 0.2, dance);
    }

    // Look: eyes slide together inside the mask (never cross); head turns a little.
    const eyeDx = MathUtils.clamp(look.x, -1, 1) * 0.05 * lookW;
    const eyeDy = MathUtils.clamp(look.y, -1, 1) * 0.035 * lookW;
    headRotY += MathUtils.clamp(look.x, -1, 1) * 0.28 * lookW;
    headRotX += -MathUtils.clamp(look.y, -1, 1) * 0.14 * lookW;

    // Smile: mouth opens, eyes squint, cheeks lift, chin up a touch.
    headRotX -= 0.05 * smile;
    mouth.visible = smile > 0.04;
    mouth.scale.setScalar(smile);
    mouthFill.scale.y = 0.05 + 0.5 * smile;
    for (const blush of blushes) {
      blush.position.y = BLUSH_Y + 0.07 * smile;
      blush.scale.setScalar(1 + 0.3 * smile);
      blush.scale.y *= 0.7;
      blush.scale.z *= 0.35;
    }

    // Blink window, plus squint from the smile.
    const blinking = t >= nextBlink && t < nextBlink + 0.14;
    const lidScale = (blinking ? 0.15 : 1) * (1 - 0.45 * smile);
    for (const [index, eye] of eyes.entries()) {
      const side = index === 0 ? -1 : 1;
      eye.scale.y = lidScale;
      eye.position.set(side * EYE_BASE.x + eyeDx, EYE_BASE.y + eyeDy, EYE_BASE.z);
    }

    // The free flipper presents the board. Must run before the rotation is written below.
    waveZ = MathUtils.lerp(waveZ, 1.25, signW);
    waveX = MathUtils.lerp(waveX, -0.85, signW);
    waveY = MathUtils.lerp(waveY, 0.6, signW);

    body.position.y = bodyY;
    body.rotation.set(bodyRotX, bodyRotY, bodyRotZ);
    body.scale.set(1 - breathe * 0.5, 1 + breathe, 1 - breathe * 0.5);
    feet.rotation.y = bodyRotY;
    head.rotation.set(headRotX, headRotY, headRotZ);
    wavingFlipper.rotation.set(waveX, waveY, waveZ);
    holdingFlipper.rotation.set(holdX, HOLD_ROT.y, holdZ);

    // Shadow shrinks and fades as the body rises.
    const lift = MathUtils.clamp(bodyY, 0, 0.3);
    const shadowScale = 1 - lift * 1.2;
    shadow.scale.set(1.15 * shadowScale, 0.85 * shadowScale, 1);
    shadowMaterial.opacity = 0.28 * (1 - lift * 1.5);

    // Notebook lid and screen brightness.
    notebookParts.hinge.rotation.x = MathUtils.lerp(1.52, -0.28, lid);
    notebookParts.screenMaterial.color.setScalar(MathUtils.lerp(0.18, 1, lid));

    sign.scale.setScalar(0.001 + signW);
    sign.visible = signW > 0.02;
  }

  return {
    root,
    notebookMeshes: notebookParts.meshes,
    setPose,
    setToggle,
    setLookTarget,
    update,
    snap,
    finishedOneShot,
  };
}

/* ---------- notebook ---------- */

function buildNotebook() {
  const group = new Group();
  const meshes: Object3D[] = [];
  const shell = new MeshStandardMaterial({ color: COLORS.notebookShell, roughness: 0.5, metalness: 0.15 });
  const dark = new MeshStandardMaterial({ color: COLORS.notebookDark, roughness: 0.7 });
  const keys = new MeshStandardMaterial({ color: COLORS.keyboard, roughness: 0.9 });

  const base = new Mesh(new BoxGeometry(0.66, 0.045, 0.44), shell);
  group.add(base);

  const keyboard = new Mesh(new BoxGeometry(0.54, 0.012, 0.2), keys);
  keyboard.position.set(0, 0.028, -0.03);
  group.add(keyboard);

  const trackpad = new Mesh(new BoxGeometry(0.2, 0.008, 0.1), dark);
  trackpad.position.set(0, 0.026, 0.14);
  group.add(trackpad);

  // Lid hinged at the back edge. Rotation is driven by the notebook weight.
  const hinge = new Group();
  hinge.position.set(0, 0.02, -0.22);
  group.add(hinge);

  const lid = new Mesh(new BoxGeometry(0.66, 0.46, 0.03), shell);
  lid.position.y = 0.23;
  hinge.add(lid);

  const bezel = new Mesh(new BoxGeometry(0.62, 0.42, 0.006), dark);
  bezel.position.set(0, 0.23, 0.017);
  hinge.add(bezel);

  const screenFace = makeScreenTexture();
  const screenMaterial = new MeshBasicMaterial({ map: screenFace.texture });
  const screen = new Mesh(new PlaneGeometry(0.58, 0.36), screenMaterial);
  screen.position.set(0, 0.235, 0.0215);
  hinge.add(screen);

  meshes.push(base, keyboard, trackpad, lid, bezel, screen);
  return { group, hinge, screenMaterial, meshes, tickScreen: screenFace.tick };
}

function makeScreenTexture(): { texture: CanvasTexture; tick: (t: number) => void } {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 80;
  const ctx = canvas.getContext("2d");
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const lines = ["$ ssh lab", "$ sudo -i", "# lvs", "# tuned-adm", "$ man ls"];
  let last = -1;
  const tick = (time: number): void => {
    const step = Math.floor(time * 3);
    if (step === last || !ctx) return;
    last = step;
    ctx.fillStyle = "#0b1a20";
    ctx.fillRect(0, 0, 128, 80);
    ctx.font = "bold 11px ui-monospace, Consolas, monospace";
    ctx.textBaseline = "top";
    for (let row = 0; row < 4; row += 1) {
      const line = lines[(step + row) % lines.length];
      const cursor = row === 3 && step % 2 === 0 ? "_" : "";
      const shown = row === 3 ? line.slice(0, step % (line.length + 1)) + cursor : line;
      ctx.fillStyle = line.startsWith("#") ? "#e7c2ae" : "#9ad7e4";
      ctx.fillText(shown, 8, 6 + row * 16);
    }
    texture.needsUpdate = true;
  };
  tick(0);
  return { texture, tick };
}

/* ---------- sign ---------- */

function buildSign(text: string): Group {
  const group = new Group();
  const board = new MeshStandardMaterial({ color: COLORS.signBoard, roughness: 0.85 });
  const face = new MeshBasicMaterial({ map: makeSignTexture(text) });
  const plank = new Mesh(new BoxGeometry(0.72, 0.42, 0.05), [board, board, board, board, face, board]);
  group.add(plank);
  return group;
}

/** Sign face (128×72), text drawn at runtime in the page locale. */
function makeSignTexture(text: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 72;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#f3e6c8";
    ctx.fillRect(0, 0, 128, 72);
    ctx.strokeStyle = "#c9b48c";
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 120, 64);
    ctx.fillStyle = "#2b2420";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let size = 34;
    ctx.font = `bold ${size}px Figtree, "Segoe UI", sans-serif`;
    while (ctx.measureText(text).width > 108 && size > 12) {
      size -= 2;
      ctx.font = `bold ${size}px Figtree, "Segoe UI", sans-serif`;
    }
    ctx.fillText(text, 64, 38);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
