import {
  LinearFilter, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, VideoTexture,
} from 'three';

export interface Backdrop {
  scene: Scene;
  camera: OrthographicCamera;
  update(t: number, progress: number, sx: number, sy: number, textCover: number): void;
  dispose(): void;
}

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }';

const FRAG = `
uniform sampler2D uTex; uniform vec2 uFit; uniform vec2 uMouse;
uniform float uTime; uniform float uZoom; uniform float uLevel; uniform float uPastel;
varying vec2 vUv;
void main(){
  vec2 uv = (vUv - 0.5) * uFit / uZoom;
  uv += uMouse * 0.018;                                   // pointer parallax
  uv.x += sin(uv.y * 3.4 + uTime * 0.22) * 0.006;         // slow liquid drift
  uv.y += cos(uv.x * 3.0 + uTime * 0.18) * 0.005;
  vec3 rgb = texture2D(uTex, clamp(uv + 0.5, 0.001, 0.999)).rgb;
  float l = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
  l = clamp((l - 0.5) * 1.26 + 0.44, 0.0, 1.0);           // monochrome, punchy
  l = pow(l, 1.5) * 0.72;                                 // hold it down under the type
  float h = 0.5 + 0.5 * sin(uTime * 0.07 + vUv.x * 2.1 + vUv.y * 1.4);
  vec3 hi = mix(vec3(0.70,0.99,0.84), vec3(1.00,0.82,0.70), h);
  vec3 lo = mix(vec3(0.60,0.64,1.00), vec3(0.72,0.90,1.00), h);
  vec3 col = vec3(l) * mix(lo, hi, smoothstep(0.12, 0.88, l));
  col = mix(vec3(l), col, clamp(uPastel, 0.0, 1.0));
  gl_FragColor = vec4(col * uLevel, 1.0);
}`;

/**
 * One piece of footage running behind the whole page: a fullscreen ortho quad
 * drawn before the 3D scene, graded to luminance with a slow pastel wash.
 * Sources are tried in order until one plays.
 */
export function createBackdrop(sources: string[], pastel: number, level: number): Backdrop {
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
    dispose() {
      video.pause();
      video.removeAttribute('src');
      video.load();
      tex.dispose();
      material.dispose();
    },
  };
}
