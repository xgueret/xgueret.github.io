import {
  CanvasTexture, Group, LinearFilter, LinearMipmapLinearFilter, Mesh, PlaneGeometry, Scene, ShaderMaterial, Vector3,
} from 'three';
import { MOTIFS } from '../../lib/motif';
import { CARD_FIRST_Z, CARD_GAP_Z } from './config';
import { drawMotif, type Motif } from './motifs';

export interface ProjectData {
  title: string;
  tag: string;
  year: string;
  desc: string;
  url: string;
  motif: Motif;
}

export interface CardState {
  i: number;
  base: Vector3;
  rotY: number;
  hover: number;
  focus: number;
  f0: number;
  f1: number;
  ft?: number;
  data: ProjectData;
}

export type Card = Mesh<PlaneGeometry, ShaderMaterial> & { userData: CardState };

const VERT = `
uniform float uHover; uniform float uTime; varying vec2 vUv;
void main(){
  vUv = uv;
  vec3 p = position;
  p.z += sin(uv.x*4.0 + uTime*1.4) * 0.10 * uHover;   // subtle mesh swell on hover
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
}`;

const FRAG = `
uniform sampler2D uTex; uniform float uTime; uniform float uHover; uniform float uVel; uniform float uBlur; uniform float uOpacity;
varying vec2 vUv;
#ifdef CHEAP_BLUR
// Light path: one trilinear sample with a mipmap LOD bias instead of the
// 35-tap Gaussian — the same depth-of-field read at a fraction of the fill cost.
vec4 blurTex(vec2 uv, float r){
  return texture2D(uTex, uv, r * 350.0);
}
#else
vec4 blurTex(vec2 uv, float r){
  if(r < 0.001) return texture2D(uTex, uv);
  vec4 s = vec4(0.0); float w = 0.0;
  for(int i=-3;i<=3;i++){ for(int j=-2;j<=2;j++){
    vec2 o = vec2(float(i), float(j)) * r;
    float g = exp(-dot(o,o)/(2.0*r*r+1e-6));
    s += texture2D(uTex, uv+o) * g; w += g; } }
  return s / max(w, 0.0001);
}
#endif
void main(){
  vec2 uv = vUv;
  float amp = uHover * (0.010 + uVel * 0.075);          // liquid distortion while hovered
  uv.x += sin(uv.y*9.0 + uTime*2.1) * amp;
  uv.y += cos(uv.x*7.0 + uTime*1.7) * amp * 0.8;
  vec4 c = blurTex(uv, uBlur * 0.010);                  // depth-of-field
  float edge = min(min(vUv.x, 1.0-vUv.x), min(vUv.y, 1.0-vUv.y));
  float frame = smoothstep(0.0, 0.004, edge);
  c.rgb = mix(vec3(1.0), c.rgb, frame);
  c.rgb += uHover * 0.07;
  gl_FragColor = vec4(clamp(c.rgb,0.0,1.0), uOpacity);
}`;

/** Read the plates from the server-rendered fallback grid. */
export function readProjects(): ProjectData[] {
  return Array.from(document.querySelectorAll<HTMLElement>('#tp-projects [data-project]')).map((el) => {
    const motif = el.dataset.motif as Motif | undefined;
    return {
      title: el.dataset.title ?? '',
      tag: el.dataset.tag ?? '',
      year: el.dataset.year ?? '',
      desc: el.dataset.desc ?? '',
      url: el.dataset.url ?? '',
      motif: motif && (MOTIFS as readonly string[]).includes(motif) ? motif : 'rings',
    };
  });
}

/**
 * Choose the plates to draw: the whole pool when it fits, otherwise `max`
 * entries picked at random, kept in featured order so the column rhythm holds.
 */
export function pickPlates(pool: ProjectData[], max: number): ProjectData[] {
  if (max >= pool.length) return pool;
  const indices = pool.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, max).sort((a, b) => a - b).map((i) => pool[i]);
}

/**
 * Draw one plate: motif, caption band, index box, frame. `mipmaps` enables the
 * mip chain the light path's LOD-bias blur samples from.
 */
export function makeCardTexture(
  index: number, title: string, tag: string, motif: Motif, inverted: boolean, mipmaps = false,
): CanvasTexture {
  const ground = inverted ? '#fff' : '#000';
  const ink = inverted ? '#000' : '#fff';
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 640;
  const x = c.getContext('2d');
  if (!x) throw new Error('2D canvas context unavailable');

  x.fillStyle = ground; x.fillRect(0, 0, c.width, c.height);
  drawMotif(x, motif, ink, inverted);
  // caption band + index box, always on the plate's own ground
  x.fillStyle = ground; x.fillRect(0, c.height - 196, c.width, 196);
  x.fillRect(0, 0, 300, 150);
  x.strokeStyle = ink; x.lineWidth = 6; x.strokeRect(3, 3, c.width - 6, c.height - 6);
  x.strokeStyle = inverted ? 'rgba(0,0,0,.5)' : 'rgba(255,255,255,.5)'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(0, c.height - 196); x.lineTo(c.width, c.height - 196); x.stroke();
  x.fillStyle = ink;
  let fs = 84;
  x.font = `500 ${fs}px "Space Grotesk", Helvetica, sans-serif`;
  while (x.measureText(title).width > c.width - 90 && fs > 30) {
    fs -= 4;
    x.font = `500 ${fs}px "Space Grotesk", Helvetica, sans-serif`;
  }
  x.fillText(title, 40, c.height - 100);
  x.font = '400 26px "JetBrains Mono", monospace';
  x.fillStyle = inverted ? 'rgba(0,0,0,.62)' : 'rgba(255,255,255,.65)';
  x.fillText(tag.toUpperCase(), 42, c.height - 48);
  x.font = '300 104px "JetBrains Mono", monospace';
  x.fillStyle = ink;
  x.fillText(String(index).padStart(2, '0'), 34, 108);

  const tex = new CanvasTexture(c);
  tex.generateMipmaps = mipmaps;
  tex.minFilter = mipmaps ? LinearMipmapLinearFilter : LinearFilter;
  return tex;
}

/**
 * Textured planes in a slightly offset column receding in depth. `cheapBlur`
 * (light path) swaps the Gaussian depth-of-field for a mipmap LOD-bias blur.
 */
export function createCards(scene: Scene, data: ProjectData[], cheapBlur = false): Card[] {
  const geo = new PlaneGeometry(3.4, 2.12, 24, 16);
  const group = new Group();
  scene.add(group);

  return data.map((d, i) => {
    const inverted = i === 1 || i === 4;     // two ink-on-white plates for column rhythm
    const material = new ShaderMaterial({
      transparent: true,
      defines: cheapBlur ? { CHEAP_BLUR: '' } : {},
      uniforms: {
        uTex: { value: makeCardTexture(i + 1, d.title, `${d.tag} / ${d.year}`, d.motif, inverted, cheapBlur) },
        uTime: { value: 0 },
        uHover: { value: 0 },
        uVel: { value: 0 },
        uBlur: { value: 0 },
        uOpacity: { value: 1 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
    });
    const mesh = new Mesh(geo, material) as Card;
    const base = new Vector3(i % 2 ? 1.85 : -1.85, ((i % 3) - 1) * 0.55, CARD_FIRST_Z - i * CARD_GAP_Z);
    mesh.position.copy(base);
    mesh.rotation.y = (i % 2 ? -1 : 1) * 0.16;
    mesh.userData = { i, base, rotY: mesh.rotation.y, hover: 0, focus: 0, f0: 0, f1: 0, data: d };
    group.add(mesh);
    return mesh;
  });
}
