import {
  LinearFilter, Mesh, OrthographicCamera, PlaneGeometry, RGBAFormat, Scene, ShaderMaterial,
  WebGLRenderTarget, type WebGLRenderer,
} from 'three';

export interface Post {
  render(drawLayers: () => void, t: number): void;
  resize(width: number, height: number, dpr: number): void;
  dispose(): void;
}

const FRAG = `
uniform sampler2D tDiffuse; uniform float uTime; uniform float uGrain; uniform float uVig;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
void main(){
  vec4 c = texture2D(tDiffuse, vUv);
  vec2 px = floor(gl_FragCoord.xy);
  float g = hash(px + floor(uTime*24.0)*13.7) - 0.5;      // animated film grain
  float d = hash(px*0.5) - 0.5;                            // static dither for print feel
  c.rgb += g*uGrain + d*0.016;
  float v = distance(vUv, vec2(0.5));
  c.rgb *= 1.0 - uVig * smoothstep(0.32, 0.95, v);         // discreet vignette
  gl_FragColor = vec4(clamp(c.rgb, 0.0, 1.0), 1.0);
}`;

/** Render-target pass adding animated grain, static dither and a vignette. */
export function createPost(renderer: WebGLRenderer, grain: number): Post {
  const dpr = renderer.getPixelRatio();
  const rt = new WebGLRenderTarget(window.innerWidth * dpr, window.innerHeight * dpr, {
    minFilter: LinearFilter, magFilter: LinearFilter, format: RGBAFormat,
  });
  const material = new ShaderMaterial({
    uniforms: { tDiffuse: { value: rt.texture }, uTime: { value: 0 }, uGrain: { value: grain }, uVig: { value: 0.55 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: FRAG,
  });
  const scene = new Scene();
  scene.add(new Mesh(new PlaneGeometry(2, 2), material));
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  return {
    render(drawLayers, t) {
      material.uniforms.uTime.value = t;
      renderer.setRenderTarget(rt);
      drawLayers();
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(scene, camera);
    },
    resize(width, height, ratio) { rt.setSize(width * ratio, height * ratio); },
    dispose() { rt.dispose(); material.dispose(); },
  };
}
