import {
  BufferAttribute, BufferGeometry, CanvasTexture, Color, CustomBlending, LinearFilter,
  LinearMipmapLinearFilter, NormalBlending, OneFactor, OrthographicCamera, Points, Scene,
  ShaderMaterial, Vector2, Vector3,
} from 'three';
import type { SceneTheme } from './config';

export interface Backdrop {
  scene: Scene;
  camera: OrthographicCamera;
  /**
   * `stage` runs 0→3 across the page (stream, globe, layers, output),
   * already smoothed by the caller;
   * `nx`/`ny` is the raw pointer in NDC, `sx`/`sy` its trailing copy.
   * `dissolve` 0→1 breaks the shape apart until nothing is left.
   */
  update(t: number, stage: number, nx: number, ny: number, sx: number, sy: number, dissolve?: number): void;
  setTheme(theme: SceneTheme): void;
  dispose(): void;
}

/* Every particle carries its position in all four shapes (aP0..aP3, w = 0
   parks a particle that a shape has no slot for) and blends between them as
   `uM` crosses each integer. The projection is done by hand — no camera
   matrices — so the field keeps the mockup's exact framing. */
const VERT = `
attribute vec4 aP0, aP1, aP2, aP3; attribute vec4 aR; attribute float aI;
uniform float uM, uT, uAspect, uSize, uDpr, uHover, uDissolve; uniform vec2 uRot, uMouse, uOff;
uniform vec3 uC1, uC2;
varying vec3 vC; varying float vA; varying float vG; varying float vH;
float seg(float k){ float t = clamp((uM - k) * 1.6 - aI * .6, 0., 1.); return t * t * (3. - 2. * t); }
void main(){
  vec3 p0 = aP0.xyz; p0.x = mod(p0.x + uT * .32 + 6., 12.) - 6.;
  float tp = mix(1., .55, smoothstep(-6., 1.5, p0.x)); p0.y *= tp; p0.z *= tp;
  float edge = smoothstep(6., 4.4, abs(p0.x));
  float t1 = seg(0.), t2 = seg(1.), t3 = seg(2.);
  vec3 p = mix(p0, aP1.xyz, t1); p = mix(p, aP2.xyz, t2); p = mix(p, aP3.xyz, t3);
  float vis = mix(mix(mix(aP0.w, aP1.w, t1), aP2.w, t2), aP3.w, t3);
  // particles loosen up mid-morph and settle once a shape is reached
  float tb = (t1 * (1. - t1) + t2 * (1. - t2) + t3 * (1. - t3)) * 4.;
  vec3 ph = aR.yzw * 6.2831;
  p += vec3(sin(p.y * 1.3 + uT * .6 + ph.x), sin(p.z * 1.3 + uT * .5 + ph.y), sin(p.x * 1.3 + uT * .4 + ph.z)) * (.004 + .16 * tb);
  // dissolve: each particle breaks off at its own threshold and drifts away
  float dk = clamp((uDissolve - aR.y * .7) / .3, 0., 1.);
  p += normalize(vec3(sin(ph.x), cos(ph.y), sin(ph.z)) + 1e-3) * dk * dk * 2.5;
  // the "hot" front: a lime band sweeping along x
  float fr = mod(uT * 1.1, 10.) - 5.;
  float hot = (1. - smoothstep(.0, .16, abs(p.x - fr))) * step(aR.y, .45);
  float cy = cos(uRot.y), sy = sin(uRot.y); p = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);
  float cx = cos(uRot.x), sx = sin(uRot.x); p = vec3(p.x, cx * p.y - sx * p.z, sx * p.y + cx * p.z);
  p.xy += uOff;
  vec3 v = p; v.z -= 7.;
  vec4 g = vec4(v.x * 1.9 / uAspect, v.y * 1.9, 0., -v.z);
  vec2 n = g.xy / g.w; vec2 dd = (n - uMouse) * vec2(uAspect, 1.);
  float k = exp(-dot(dd, dd) * 14.) * uHover;
  n += normalize(dd + 1e-4) / vec2(uAspect, 1.) * k * .06;
  g.xy = n * g.w; gl_Position = g;
  float big = step(.985, aR.w);
  gl_PointSize = uSize * uDpr * (6. + big * 12.) * 7. / (-v.z);
  vG = floor(aR.z * 255.99);
  vH = hot;
  vC = mix(uC1, uC2 * 2., hot);
  vA = (.55 + .45 * aR.x) * mix(edge, 1., max(t1, max(t2, t3))) * vis;
  vA = mix(vA, max(vA, .95 * vis), hot) * (1. - dk);
}`;

/* Dark adds light onto black, as in the mockup. Paper cannot be lit, so the
   light theme lays the same glyphs down as ink with plain alpha blending. */
const FRAG = `
uniform sampler2D uAtlas; uniform float uAlpha; uniform float uInk; uniform vec3 uInkColor; uniform vec3 uC2;
varying vec3 vC; varying float vA; varying float vG; varying float vH;
void main(){
  vec2 c = vec2(mod(vG, 16.), floor(vG / 16.));
  float a = texture2D(uAtlas, (c + gl_PointCoord) / 16.).a;
  if (uInk > .5) {
    gl_FragColor = vec4(mix(uInkColor, uC2, vH), min(a * vA * uAlpha, .6));
  } else {
    // Scale the colour down as a whole: clamping channel by channel bleached the lime.
    vec3 col = vC * a * vA * uAlpha;
    gl_FragColor = vec4(col * min(1., .6 / max(max(col.r, col.g), max(col.b, 1e-4))), 1.);
  }
}`;

/** Drawn when a page ships no token list of its own. */
const FALLBACK_TOKENS = ('the ▁de ing ▁le tion ▁et er ▁la ▁is ▁à ed es ▁un ▁in ▁to ▁des ▁of ent ▁que ly ▁and ▁pour {" ": }, ]) => === () </ /> ▁def ▁return ▁if ▁for self ▁import ▁const ▁let ▁fn ▁class kube ctl ▁pod ▁node ▁yaml ▁apiVersion ▁kind ▁spec ▁name ▁image ▁port ▁true ▁false ▁null ▁0 ▁1 ▁2 ▁42 ▁1024 ▁token ▁model ▁layer ▁attention ▁embed ▁vector ▁query ▁key ▁value ▁soft max ▁logit ▁prompt ▁context ▁window ▁infra ▁deploy ▁build ▁test ▁cluster ▁terraform ▁ansible ▁git ▁push ▁merge ▁main ▁dev ▁ops ▁cloud ▁ssh ▁root ▁sudo ▁apt ▁cat ▁grep ▁awk ▁sed ▁echo $ # @ % & * + - = ~ ^ < > ? ! . , : ; ... ’ « » é è à ç ù ô ▁très ▁mais ▁avec ▁dans ▁sur ▁plus ▁tout ▁fait ▁être ▁avoir ▁bien ▁comme ▁nous ▁vous ▁il ▁elle ▁on ▁ce ▁qui ▁pas ▁ne ▁se ▁par ▁au ▁du ▁en ▁y ▁sa ▁son ▁ses ▁mon ▁ma ▁mes un able ize ment ness ité eur euse ique isme ir re ée ées ait aient ons ez ▁we ▁you ▁it ▁this ▁that ▁with ▁from ▁have ▁not ▁are ▁was ▁be ▁by ▁or ▁at ▁as ▁an ▁my ▁all ▁can ▁will ▁just ▁so ▁do ▁what ▁when ▁how ▁why ▁who ▁new ▁data ▁user ▁log ▁error ▁warn ▁info ▁debug ▁http ▁json ▁api ▁GET ▁POST 200 404 500 ▁v1 ▁v2 ▁β ▁λ ▁∑ ▁∂ ▁∞ ▁≈ ▁→ ▁← <s> </s> <pad> <unk> [CLS] [SEP] ▁Guadeloupe ▁alizés ▁homelab ▁Proxmox').split(' ');

const ATLAS_FONT = '"JetBrains Mono", monospace';

/**
 * The page's own text cut by a BPE tokenizer at build time (`BaseLayout`
 * emits it as JSON), or the fallback list when it is missing or unreadable.
 */
function readPageTokens(): string[] {
  try {
    const raw = document.getElementById('tp-tokens-data')?.textContent;
    const list: unknown = raw ? JSON.parse(raw) : null;
    if (Array.isArray(list) && list.length && list.every((t) => typeof t === 'string')) return list;
  } catch {
    // Malformed JSON falls through to the fallback.
  }
  return FALLBACK_TOKENS;
}

/** 16×16 grid of glyphs; only the alpha channel is sampled. */
function drawAtlas(c: HTMLCanvasElement, tokens: string[]): HTMLCanvasElement {
  const S = 1024, C = 64;
  c.width = S; c.height = S;
  const x = c.getContext('2d');
  if (!x) return c;
  x.clearRect(0, 0, S, S);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let i = 0; i < 256; i++) {
    const t = tokens[i % tokens.length];
    let fs = 30;
    x.font = `400 ${fs}px ${ATLAS_FONT}`;
    const w = x.measureText(t).width;
    if (w > C - 6) { fs = Math.max(9, fs * (C - 6) / w); x.font = `400 ${fs}px ${ATLAS_FONT}`; }
    x.fillText(t, (i % 16) * C + C / 2, Math.floor(i / 16) * C + C / 2);
  }
  return c;
}

/* Each shape's resolution is the mockup's, tuned for 12 000 particles. A
   smaller field coarsens the grid rather than filling it part way — at 6 000
   the shells came out as half spheres and the stream stopped mid-screen. */
type Shape = (i: number, count: number) => [number, number, number, number];

const DEG = Math.PI / 180;
const GLOBE_R = 1.9;
const onGlobe = (lat: number, lon: number): [number, number, number] =>
  [GLOBE_R * Math.cos(lat * DEG) * Math.cos(lon * DEG), GLOBE_R * Math.sin(lat * DEG), GLOBE_R * Math.cos(lat * DEG) * Math.sin(lon * DEG)];

/** Nine parallels every 20° and twelve half meridians every 30°, with their lengths. */
const GLOBE_LINES = [
  ...[-80, -60, -40, -20, 0, 20, 40, 60, 80].map((lat) => ({ lat, lon: NaN, len: 2 * Math.PI * Math.cos(lat * DEG) })),
  ...Array.from({ length: 12 }, (_, k) => ({ lat: NaN, lon: k * 30, len: Math.PI })),
];
const GLOBE_TOTAL = GLOBE_LINES.reduce((a, l) => a + l.len, 0);


/** Stage 0: a stream of tokens flowing along x in 70 lanes. */
const shapeStream: Shape = (i, count) => {
  const L = 70, S = Math.min(160, Math.ceil(count / L)), lane = i % L, j = Math.floor(i / L);
  const ly = lane % 14, lz = Math.floor(lane / 14);
  return [j / S * 12 - 6, (ly / 13 - 0.5) * 2.8, (lz / 4 - 0.5) * 1.6, j < S ? 1 : 0];
};
/**
 * Stage 1: a globe of parallels and meridians, particles spread along the
 * lines by length so the grid stays even.
 */
const shapeGlobe: Shape = (i, count) => {
  let s = (i + 0.5) / count * GLOBE_TOTAL;
  for (const line of GLOBE_LINES) {
    if (s > line.len) { s -= line.len; continue; }
    const f = s / line.len;
    return Number.isNaN(line.lon) ? [...onGlobe(line.lat, f * 360), 1] : [...onGlobe(f * 180 - 90, line.lon), 1];
  }
  return [0, 0, 0, 0];
};
/** Stage 2: seven stacked layers, each a square grid (42×42 at full size). */
const shapeLayers: Shape = (i, count) => {
  const L = 7, G = Math.min(42, Math.floor(Math.sqrt(count / L))), l = i % L, cell = Math.floor(i / L), gy = cell % G, gz = Math.floor(cell / G) % G;
  return [(l / (L - 1) - 0.5) * 4.4, (gy / (G - 1) - 0.5) * 3.7, (gz / (G - 1) - 0.5) * 3.7, cell < G * G ? 1 : 0];
};
/** Stage 3: the output, a double helix. */
const shapeOutput: Shape = (i, count) => {
  const R = 8, M = Math.min(600, Math.ceil(count / (2 * R))), st = i % 2, rest = Math.floor(i / 2), row = rest % R, j = Math.floor(rest / R);
  const t = (j % M) / M, a = t * 6.2832 * 3 + st * Math.PI, r = 1.5 + (row / (R - 1) - 0.5) * 0.5;
  return [Math.cos(a) * r, (t - 0.5) * 6.4, Math.sin(a) * r, j < M ? 1 : 0];
};
const SHAPES = [shapeStream, shapeGlobe, shapeLayers, shapeOutput];

/** Horizontal offset of the field at each stage, before aspect scaling. */
const OFFSETS = [0.6, 1.7, -1.7, 1.8];
const DARK_ALPHA = 1.6;
const LIGHT_ALPHA = 0.9;
const FADE_IN_MS = 1200;

/**
 * Token particles running behind the whole page: glyphs that morph from a
 * stream into a globe, layers and an output helix as the reader
 * scrolls through the home sections. Drawn before the 3D plates.
 */
export function createBackdrop(
  count: number, dpr: number, mouse: boolean, theme: SceneTheme, intensity = 1,
): Backdrop {
  const geometry = new BufferGeometry();
  SHAPES.forEach((fn, k) => {
    const a = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) a.set(fn(i, count), i * 4);
    const attr = new BufferAttribute(a, 4);
    geometry.setAttribute(`aP${k}`, attr);
    // three sizes the draw call from `position`; sharing the attribute object
    // uploads it once.
    if (k === 0) geometry.setAttribute('position', attr);
  });
  const ix = new Float32Array(count);
  for (let i = 0; i < count; i++) ix[i] = i / count;
  geometry.setAttribute('aI', new BufferAttribute(ix, 1));
  const r = new Float32Array(count * 4);
  for (let i = 0; i < r.length; i++) r[i] = Math.random();
  geometry.setAttribute('aR', new BufferAttribute(r, 4));

  const tokens = readPageTokens();
  const atlasCanvas = drawAtlas(document.createElement('canvas'), tokens);
  const atlas = new CanvasTexture(atlasCanvas);
  // gl_PointCoord runs top-down, like the canvas rows.
  atlas.flipY = false;
  atlas.minFilter = LinearMipmapLinearFilter;
  atlas.magFilter = LinearFilter;
  // The first draw may land before the self-hosted font does.
  document.fonts?.load(`400 30px ${ATLAS_FONT}`).then(() => {
    drawAtlas(atlasCanvas, tokens);
    atlas.needsUpdate = true;
  }).catch(() => {});

  const material = new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uAtlas: { value: atlas },
      uM: { value: 0 },
      uT: { value: 0 },
      uAspect: { value: 1 },
      uSize: { value: 1 },
      uDpr: { value: dpr },
      uHover: { value: 0 },
      uDissolve: { value: 0 },
      uRot: { value: new Vector2() },
      uMouse: { value: new Vector2() },
      uOff: { value: new Vector2() },
      uC1: { value: new Vector3(0.9, 0.91, 0.9) },
      // raw sRGB, written straight to the target like the rest of the scene
      uC2: { value: new Vector3(0.66, 0.81, 0.24) },
      uAlpha: { value: DARK_ALPHA },
      uInk: { value: 0 },
      uInkColor: { value: new Color() },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
  });

  const applyTheme = (next: SceneTheme): void => {
    const ink = next.paper;
    material.uniforms.uInk.value = ink ? 1 : 0;
    (material.uniforms.uInkColor.value as Color).set(next.ink).convertLinearToSRGB();
    if (ink) {
      material.blending = NormalBlending;
    } else {
      material.blending = CustomBlending;
      material.blendSrc = OneFactor;
      material.blendDst = OneFactor;
    }
    material.needsUpdate = true;
  };
  applyTheme(theme);
  let baseAlpha = (theme.paper ? LIGHT_ALPHA : DARK_ALPHA) * intensity;

  const points = new Points(geometry, material);
  points.frustumCulled = false;
  const scene = new Scene();
  scene.add(points);
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  let hover = 0;
  let pointerIn = false;
  // The page is on screen before three.js arrives: the field fades in over it
  // rather than popping on. Wall clock, so it runs even when `t` is pinned.
  let born = -1;
  const onMove = (): void => { pointerIn = true; };
  const onLeave = (): void => { pointerIn = false; };
  if (mouse) {
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
  }

  return {
    scene,
    camera,
    update(t, stage, nx, ny, sx, sy, dissolve = 0) {
      const u = material.uniforms;
      const m = stage;
      hover += ((pointerIn ? 1 : 0) - hover) * 0.05;

      const aspect = window.innerWidth / Math.max(1, window.innerHeight);
      const scale = Math.min(1, aspect / 1.6);
      const k = Math.min(2, Math.floor(m)), f = m - k, e = f * f * (3 - 2 * f);
      const ox = (OFFSETS[k] + (OFFSETS[k + 1] - OFFSETS[k]) * e) * scale * aspect / 1.78;

      u.uM.value = m;
      u.uT.value = t;
      u.uAspect.value = aspect;
      u.uHover.value = hover;
      u.uDissolve.value = dissolve;
      const now = performance.now();
      if (born < 0) born = now;
      const fade = Math.min(1, (now - born) / FADE_IN_MS);
      u.uAlpha.value = baseAlpha * fade * fade * (3 - 2 * fade);
      (u.uRot.value as Vector2).set(0.18 - sy * 0.15 + m * 0.3, t * 0.035 + m * 1.1 + sx * 0.25);
      (u.uMouse.value as Vector2).set(nx, ny);
      (u.uOff.value as Vector2).set(ox * 0.55, 0);
    },
    setTheme(next) {
      baseAlpha = (next.paper ? LIGHT_ALPHA : DARK_ALPHA) * intensity;
      applyTheme(next);
    },
    dispose() {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      geometry.dispose();
      atlas.dispose();
      material.dispose();
    },
  };
}
