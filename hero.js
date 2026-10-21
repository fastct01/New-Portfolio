// Hero background: nested glossy frames and pillars around an empty black "pit"
// where the logo sits. Monochrome, slow parallax, pauses when scrolled away.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.querySelector(".hero-canvas");
const hero = canvas && canvas.closest(".hero");

// Everything inside |x|,|z| < PIT stays empty so the logo has clear space around it.
const PIT = 9.4;

function init() {
  if (!canvas || !hero) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  } catch {
    canvas.remove(); // no WebGL: hero stays plain black
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 54, 96); // far frames sink into black at the top

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();

  // ── materials (slightly green-tinted greys, like the reference) ──
  const mat = {
    black: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.16, metalness: 0.75, envMapIntensity: 0.9 }),
    dark:  new THREE.MeshStandardMaterial({ color: 0x1c201d, roughness: 0.28, metalness: 0.65, envMapIntensity: 0.8 }),
    grey:  new THREE.MeshStandardMaterial({ color: 0x3d433e, roughness: 0.34, metalness: 0.55, envMapIntensity: 0.8 }),
    white: new THREE.MeshStandardMaterial({ color: 0xdadada, roughness: 0.42, metalness: 0.05, envMapIntensity: 0.5 }),
  };

  const world = new THREE.Group();
  scene.add(world);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat.black);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  world.add(floor);

  const box = (w, h, d, m, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    world.add(mesh);
    return mesh;
  };

  // Square frame: outer half-size `half`, stripe `width`, raised `height`.
  // `sides` lets a frame be broken (n = -z, s = +z, e = +x, w = -x).
  const frame = (half, width, height, m, sides = "nsew") => {
    const c = half - width / 2;
    const len = half * 2;
    const inner = len - width * 2;
    if (sides.includes("n")) box(len, height, width, m, 0, height / 2, -c);
    if (sides.includes("s")) box(len, height, width, m, 0, height / 2, c);
    if (sides.includes("e")) box(width, height, inner, m, c, height / 2, 0);
    if (sides.includes("w")) box(width, height, inner, m, -c, height / 2, 0);
  };

  // Terraces step up as they move out from the pit.
  frame(PIT + 0.4, 0.35, 0.06, mat.white);
  frame(10.9, 0.9, 0.3, mat.dark);
  frame(11.5, 0.5, 0.3, mat.grey);
  frame(12.9, 1.2, 0.7, mat.black);
  frame(13.6, 0.6, 0.7, mat.white, "nsw");
  frame(15.2, 1.4, 1.2, mat.dark);
  frame(16.1, 0.8, 1.2, mat.grey, "nse");
  frame(18.1, 1.8, 1.9, mat.black);
  frame(18.8, 0.6, 1.9, mat.white);
  frame(21.2, 2.2, 2.8, mat.dark, "nsw");
  frame(22.1, 0.8, 2.8, mat.grey);
  frame(24.8, 2.4, 3.6, mat.black);
  frame(25.6, 0.7, 3.6, mat.white, "sew");
  frame(29.2, 3.2, 4.6, mat.dark);
  frame(30.2, 0.9, 4.6, mat.grey);
  frame(34.5, 4, 5.8, mat.black);

  // Chamfered pillar with an optional white stripe on its +z face.
  const pillar = (x, z, w, h, baseY, stripe) => {
    box(w, h, w, mat.black, x, baseY + h / 2, z);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry((w / 2) * 0.72 * Math.SQRT2, (w / 2) * Math.SQRT2, w * 0.28, 4, 1), mat.black);
    cap.rotation.y = Math.PI / 4;
    cap.position.set(x, baseY + h + w * 0.14, z);
    cap.castShadow = cap.receiveShadow = true;
    world.add(cap);
    if (stripe) box(w * 0.42, h * 0.86, 0.06, mat.white, x + w * 0.12, baseY + h * 0.5, z + w / 2 + 0.03);
  };

  // All placed outside the pit.
  pillar(-14.2, -12.4, 2.6, 14, 1.2, true);   // tall, back-left
  pillar(16.4, -9.6, 1.9, 8, 1.2, false);     // back-right
  pillar(-17.6, 6.2, 1.4, 5, 1.9, true);      // left
  box(4.4, 2.6, 1.3, mat.black, 16.8, 1.9 + 1.3, 13.2); // low slab, front-right
  box(1.2, 0.9, 5.2, mat.white, 20.4, 2.8 + 0.45, 4.6); // white block on a terrace
  box(0.5, 7.5, 2.2, mat.black, 12.1, 0.7 + 3.75, -16.3); // thin blade, back

  // ── lights ──
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-18, 30, 14);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera;
  sc.left = sc.bottom = -40;
  sc.right = sc.top = 40;
  sc.near = 1;
  sc.far = 90;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.03;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xbfd0c6, 0.6);
  rim.position.set(20, 16, -24);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0x3a3f3a, 0x000000, 0.3));

  // ── camera: elevated three-quarter view, pit centred on screen ──
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 220);
  const target = new THREE.Vector3(0, 0.6, 0);
  const base = { dist: 58, polar: 0.86, azimuth: -0.52 };
  let dist = base.dist;

  const placeCamera = (azOff, polOff) => {
    const p = base.polar + polOff;
    const a = base.azimuth + azOff;
    camera.position
      .set(dist * Math.sin(p) * Math.sin(a), dist * Math.cos(p), dist * Math.sin(p) * Math.cos(a))
      .add(target);
    camera.lookAt(target);
  };

  const resize = () => {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.aspect = aspect;
    // pull back on narrow screens so the frames stay in view
    const wanted = 46 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * aspect);
    dist = THREE.MathUtils.clamp(wanted, base.dist, 84);
    camera.updateProjectionMatrix();
    placeCamera(0, 0);
    renderer.render(scene, camera);
  };
  new ResizeObserver(resize).observe(hero);
  resize();

  // ── motion: pointer parallax + slow drift; static if reduced motion ──
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  let px = 0, py = 0, cx = 0, cy = 0;
  window.addEventListener("pointermove", (e) => {
    px = e.clientX / window.innerWidth - 0.5;
    py = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  const clock = new THREE.Clock();
  let raf = 0;
  const loop = () => {
    const t = clock.getElapsedTime();
    cx += (px - cx) * 0.04;
    cy += (py - cy) * 0.04;
    placeCamera(-cx * 0.09 + Math.sin(t * 0.12) * 0.035, cy * 0.045);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };

  let visible = false;
  const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible ? start() : stop();
  }, { threshold: 0.05 }).observe(hero);

  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
}

init();
