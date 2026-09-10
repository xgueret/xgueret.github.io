import {
  Color, LinearFilter, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2,
  VideoTexture,
} from 'three';
import type { SceneTheme } from './config';

export interface Backdrop {
  scene: Scene;
  camera: OrthographicCamera;
  update(t: number, progress: number, sx: number, sy: number, textCover: number): void;
  setTheme(theme: SceneTheme): void;
  dispose(): void;
}

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }';

const FRAG = `
uniform sampler2D uTex; uniform vec2 uFit; uniform vec2 uMouse;
uniform float uTime; uniform float uZoom; uniform float uLevel; uniform float uPastel;
uniform float uFilm; uniform vec3 uGround;
varying vec2 vUv;
void main(){
  vec2 uv = (vUv - 0.5) * uFit / uZoom;
  uv += uMouse * 0.018;                                   // pointer parallax
  uv.x += sin(uv.y * 3.4 + uTime * 0.22) * 0.006;         // slow liquid drift
  uv.y += cos(uv.x * 3.0 + uTime * 0.18) * 0.005;
  vec3 rgb = texture2D(uTex, clamp(uv + 0.5, 0.001, 0.999)).rgb;
  float l = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
  l = clamp((l - 0.5) * 1.26 + 0.44, 0.0, 1.0);           // monochrome, punchy
  // Dark: hold the film down so type stays readable over it. Light: the same
  // grade read the other way up, ink settling on paper instead of light
  // rising out of black. The pastel wash rides on top either way.
  float dark = pow(l, 1.5) * 0.72;
  float light = 1.0 - pow(1.0 - l, 1.5) * 0.34;
  l = mix(dark, light, uFilm);
  float h = 0.5 + 0.5 * sin(uTime * 0.07 + vUv.x * 2.1 + vUv.y * 1.4);
  vec3 hi = mix(vec3(0.70,0.99,0.84), vec3(1.00,0.82,0.70), h);
  vec3 lo = mix(vec3(0.60,0.64,1.00), vec3(0.72,0.90,1.00), h);
  vec3 col = vec3(l) * mix(lo, hi, smoothstep(0.12, 0.88, l));
  col = mix(vec3(l), col, clamp(uPastel, 0.0, 1.0));
  // uLevel fades the film out under copy-heavy sections: it has to fade
  // towards the page's own ground, not towards black.
  gl_FragColor = vec4(mix(uGround, col, uLevel), 1.0);
}`;

/**
 * The footage opens on five seconds of empty tank before the ink enters, and
 * closes on two more once it has cleared — measured off the file, a mean
 * luminance of exactly 0. Played from the top it left the page black for
 * seconds after the loader lifted, and blacked out again on every loop. So
 * playback lives inside the window that actually holds ink, entering a beat
 * after the ink does so the wrap lands on a full frame rather than an empty
 * tank.
 */
const CLIP_IN = 7.5;
const CLIP_OUT = 27.5;

/**
 * One piece of footage running behind the whole page: a fullscreen ortho quad
 * drawn before the 3D scene, graded to luminance with a slow pastel wash.
 * Sources are tried in order until one plays.
 */
export function createBackdrop(sources: string[], pastel: number, level: number, theme: SceneTheme): Backdrop {
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.preload = 'auto';

  let ready = false;
  let failed = false;
  let si = 0;
  const load = (): void => { video.src = sources[si]; video.load(); };
  video.addEventListener('error', () => { if (++si < sources.length) load(); else failed = true; });
  // Metadata lands before the first frame, so the seek costs nothing visible.
  video.addEventListener('loadedmetadata', () => {
    if (video.duration > CLIP_OUT) video.currentTime = CLIP_IN;
  });
  // `loop` would rewind to the empty opening; wrap inside the window instead.
  video.addEventListener('timeupdate', () => {
    if (video.duration > CLIP_OUT && video.currentTime >= CLIP_OUT) video.currentTime = CLIP_IN;
  });
  video.addEventListener('loadeddata', () => { ready = true; video.play().catch(() => {}); });
  load();

  // Autoplay is often refused until the first gesture — retry once on input.
  const kick = (): void => { video.play().catch(() => {}); };
  (['pointerdown', 'wheel', 'keydown', 'touchstart'] as const).forEach((ev) =>
    window.addEventListener(ev, kick, { once: true, passive: true })
  );

  const tex = new VideoTexture(video);
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;

  const material = new ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTex: { value: tex },
      uFit: { value: new Vector2(1, 1) },
      uTime: { value: 0 },
      uZoom: { value: 1 },
      uMouse: { value: new Vector2(0, 0) },
      uLevel: { value: 0 },
      uPastel: { value: pastel },
      uFilm: { value: theme.film },
      uGround: { value: new Color(theme.clear) },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
  });

  const scene = new Scene();
  scene.add(new Mesh(new PlaneGeometry(2, 2), material));
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  return {
    scene,
    camera,
    update(t, progress, sx, sy, textCover) {
      const u = material.uniforms;
      const vw = video.videoWidth || 16;
      const vh = video.videoHeight || 9;
      const va = vw / vh;
      const sa = window.innerWidth / window.innerHeight;
      if (va > sa) u.uFit.value.set(sa / va, 1); else u.uFit.value.set(1, va / sa);
      u.uTime.value = t;
      u.uZoom.value = 1.06 + progress * 0.22;
      u.uMouse.value.set(-sx, -sy);
      const target = ready && !failed ? level * (1 - textCover * 0.45) : 0;
      u.uLevel.value += (target - u.uLevel.value) * 0.09;
    },
    setTheme(next) {
      material.uniforms.uFilm.value = next.film;
      (material.uniforms.uGround.value as Color).set(next.clear);
    },
    dispose() {
      video.pause();
      video.removeAttribute('src');
      video.load();
      tex.dispose();
      material.dispose();
    },
  };
}
