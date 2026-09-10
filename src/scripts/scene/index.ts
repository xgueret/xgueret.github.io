import Lenis from 'lenis';
import {
  PerspectiveCamera, Raycaster, Scene, Vector2, Vector3, WebGLRenderer,
} from 'three';
import { initCursor, type Cursor } from '../ui/cursor';
import { initSplitText } from '../ui/split-text';
import { getTheme, onThemeChange } from '../ui/theme';
import { createBackdrop, type Backdrop } from './backdrop';
import type { Capabilities } from './capabilities';
import { createCards, readProjects, rethemeCards, selectPlates, type Card } from './cards';
import { revealProjectList } from './fallback';
import { CAMERA_START_Z, cameraTravelZ, MAX_PLATES, SCENE, SCENE_THEME } from './config';
import { fbm } from './noise';
import { createPost, type Post } from './post';

const byId = (id: string): HTMLElement | null => document.getElementById(id);

interface State {
  progress: number;
  progressTarget: number;
  workP: number;
  workTarget: number;
  textCover: number;
  focused: Card | null;
  hovered: Card | null;
  lastIdx: number;
  last: number;
}

/** Eased 0→1 focus tween (expo.inOut, 0.8 s) driven by the frame loop. */
function setFocus(card: Card, to: number): void {
  const u = card.userData;
  u.f0 = u.focus;
  u.f1 = to;
  u.ft = performance.now() * 0.001;
}

/**
 * Boot the whole home-page experience: renderer, footage backdrop, project
 * plates, post-processing, smooth scroll, loader, overlay and the frame loop.
 * Everything not dependent on WebGL (cursor, split text) is initialized here
 * too so the page has exactly one owner of the pointer state.
 */
export function startScene(caps: Capabilities): void {
  const canvas = byId('tp-gl') as HTMLCanvasElement | null;
  if (!canvas) return;

  const cursor: Cursor = initCursor();
  const state: State = {
    progress: 0, progressTarget: 0, workP: 0, workTarget: 0, textCover: 0,
    focused: null, hovered: null, lastIdx: -1, last: 0,
  };

  // --- renderer, camera ---------------------------------------------------
  const renderer = new WebGLRenderer({
    canvas, antialias: !caps.mobile, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, caps.mobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;

  const scene = new Scene();
  const camera = new PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, CAMERA_START_Z);
  const raycaster = new Raycaster();
  const pointer = new Vector2();

  // --- layers -------------------------------------------------------------
  const hd = canvas.dataset.videoHd ?? '';
  const sd = canvas.dataset.videoSd ?? '';
  let theme = SCENE_THEME[getTheme()];
  renderer.setClearColor(theme.clear, 1);
  const backdrop: Backdrop = createBackdrop(caps.mobile ? [sd, hd] : [hd, sd], SCENE.pastel, SCENE.bgLevel, theme);
  const data = caps.plates ? selectPlates(readProjects(), MAX_PLATES) : [];
  const cards: Card[] = caps.plates ? createCards(scene, data, theme, caps.mobile) : [];
  // Without plates the camera has nothing to fly through, so it holds still.
  const travelZ = cards.length ? cameraTravelZ(cards.length) : 0;
  if (!caps.plates) revealProjectList();
  const post: Post | null = SCENE.postFx && !caps.mobile ? createPost(renderer, SCENE.grain, theme.vignette) : null;

  /* Every drawn surface is baked at startup — clear colour, film curve, plate
     canvases, vignette — so the toggle has to walk them all. Skipping the very
     first call keeps it from repainting what was just painted. */
  let themed = true;
  onThemeChange((next) => {
    if (themed) { themed = false; return; }
    theme = SCENE_THEME[next];
    renderer.setClearColor(theme.clear, 1);
    backdrop.setTheme(theme);
    post?.setVignette(theme.vignette);
    rethemeCards(cards, data, theme, caps.mobile);
  });

  const onResize = (): void => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    post?.resize(w, h, renderer.getPixelRatio());
  };
  window.addEventListener('resize', onResize);

  // --- scroll -------------------------------------------------------------
  const setProgress = (): void => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    state.progressTarget = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  };
  let lenis: Lenis | null = null;
  if (!caps.reduced) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, lerp: 0.085 });
    lenis.on('scroll', setProgress);
  } else {
    window.addEventListener('scroll', setProgress, { passive: true });
  }
  setProgress();

  document.querySelectorAll<HTMLAnchorElement>('nav a[href^="#"], #tp-menu a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const el = document.querySelector<HTMLElement>(a.getAttribute('href') ?? '');
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: 0 });
      else window.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
    });
  });

  // --- overlay ------------------------------------------------------------
  const detail = byId('tp-detail');
  const main = byId('tp-main');
  const nav = byId('tp-nav');
  const projects = byId('tp-projects');
  const cue = byId('tp-scrollcue');
  const closeBtn = byId('tp-detail-close');
  let lastFocus: HTMLElement | null = null;

  const openCard = (card: Card): void => {
    const d = card.userData.data;
    if (d.kind === 'all') {
      window.location.assign(d.url);
      return;
    }
    state.focused = card;
    lastFocus = document.activeElement as HTMLElement | null;
    const title = byId('tp-detail-title');
    const desc = byId('tp-detail-desc');
    const meta = byId('tp-detail-meta');
    const link = byId('tp-detail-link') as HTMLAnchorElement | null;
    if (title) title.textContent = d.title;
    if (desc) desc.textContent = d.desc;
    if (meta) meta.textContent = `${String(card.userData.i + 1).padStart(2, '0')} — ${d.tag} / ${d.year}`;
    if (link) {
      if (d.url) { link.href = d.url; link.style.display = 'inline-block'; } else { link.style.display = 'none'; }
    }
    if (detail) {
      detail.style.pointerEvents = 'auto';
      detail.style.opacity = '1';
      detail.style.transform = 'translateY(0)';
      detail.setAttribute('aria-hidden', 'false');
      detail.removeAttribute('inert');
    }
    lenis?.stop();
    setFocus(card, 1);
    // The dialog is aria-modal: take the page behind it out of the tab order.
    if (main) { main.style.opacity = '0'; main.setAttribute('inert', ''); }
    if (nav) { nav.style.opacity = '0'; nav.setAttribute('inert', ''); }
    projects?.setAttribute('inert', '');
    if (cue) cue.style.opacity = '0';
    closeBtn?.focus();
  };

  const closeCard = (): void => {
    if (!state.focused) return;
    const card = state.focused;
    state.focused = null;
    if (detail) {
      detail.style.pointerEvents = 'none';
      detail.style.opacity = '0';
      detail.style.transform = 'translateY(24px)';
      detail.setAttribute('aria-hidden', 'true');
      detail.setAttribute('inert', '');
    }
    lenis?.start();
    setFocus(card, 0);
    if (main) { main.style.opacity = '1'; main.removeAttribute('inert'); }
    if (nav) { nav.style.opacity = '1'; nav.removeAttribute('inert'); }
    projects?.removeAttribute('inert');
    lastFocus?.focus();
  };

  byId('tp-idx-open')?.addEventListener('click', () => {
    const card = cards[state.lastIdx];
    if (card) openCard(card);
  });

  closeBtn?.addEventListener('click', closeCard);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCard(); });
  window.addEventListener('click', (e) => {
    if (state.focused) return;
    const target = e.target as Element | null;
    if (target?.closest && target.closest('a,button,form,input,textarea,label')) return;
    if (state.hovered?.visible) openCard(state.hovered);
  });

  // --- loader -------------------------------------------------------------
  const runLoader = (): void => {
    const count = byId('tp-count');
    const loader = byId('tp-loader');
    const start = performance.now();
    const dur = caps.reduced ? 300 : 1700;
    const step = (): void => {
      const k = Math.min(1, (performance.now() - start) / dur);
      if (count) count.textContent = String(Math.round(k * 100)).padStart(3, '0');
      if (k < 1) { requestAnimationFrame(step); return; }
      if (loader) {
        loader.style.opacity = '0';
        window.setTimeout(() => { loader.style.display = 'none'; }, 760);
      }
      initSplitText();
    };
    step();
  };

  // --- per-frame updates --------------------------------------------------
  const veil = byId('tp-veil');
  const work = byId('tp-work');
  const idxNum = byId('tp-idx-num');
  const idxTitle = byId('tp-idx-title');
  const idxTag = byId('tp-idx-tag');
  const total = String(cards.length).padStart(2, '0');
  const dir = new Vector3();
  const front = new Vector3();

  const updateCamera = (t: number): void => {
    const drift = SCENE.drift;
    const p = cursor.pointer;
    const baseZ = CAMERA_START_Z - state.workP * travelZ;
    camera.position.x = p.sx * 1.15 + fbm(t * 0.07) * 0.55 * drift;
    camera.position.y = p.sy * 0.75 + fbm(t * 0.06 + 31.7) * 0.42 * drift;
    camera.position.z = baseZ + fbm(t * 0.05 + 77.3) * 0.30 * drift;
    camera.rotation.x = -p.sy * 0.055 + fbm(t * 0.045 + 12.1) * 0.018 * drift;
    camera.rotation.y = -p.sx * 0.075 + fbm(t * 0.04 + 5.4) * 0.022 * drift;
    camera.rotation.z = fbm(t * 0.03 + 90.2) * 0.012 * drift;
  };

  const updateCards = (t: number): void => {
    if (!cards.length) return;
    const p = cursor.pointer;
    pointer.set(p.nx, p.ny);
    raycaster.setFromCamera(pointer, camera);
    // Raycaster ignores Mesh.visible, so hidden plates would still be hit from
    // the hero: only ever test the ones actually drawn.
    const hits = state.focused ? [] : raycaster.intersectObjects(cards.filter((c) => c.visible), false);
    state.hovered = hits.length ? (hits[0].object as Card) : null;
    cursor.setBoost(!!state.hovered);

    const focal = camera.position.z - 6.5;
    // cards only exist inside the work range: fade in as it starts, out as it ends
    const w = state.workP;
    const appear = Math.min(1, Math.max(0, (w - 0.015) / 0.05)) * (1 - Math.min(1, Math.max(0, (w - 0.94) / 0.05)));
    let nearest = 0;
    let nearestD = 1e9;

    cards.forEach((m, i) => {
      const u = m.userData;
      const hov = state.hovered === m && !state.focused ? 1 : 0;
      u.hover += (hov - u.hover) * 0.10;
      const uni = m.material.uniforms;
      uni.uTime.value = t;
      uni.uHover.value = u.hover;
      uni.uVel.value += (p.vel - uni.uVel.value) * 0.2;

      // depth of field: sharpness peaks at the focal plane
      const dz = Math.abs(u.base.z - focal);
      const blur = Math.min(1, Math.max(0, (dz - 3.0) / 13)) * SCENE.cardBlur;
      uni.uBlur.value = blur * (1 - u.focus);
      m.visible = appear > 0.002 || u.focus > 0.002;

      if (u.ft !== undefined) {
        const k = Math.min(1, (t - u.ft) / 0.8);
        const e = k >= 1 ? 1 : (k < 0.5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2);
        u.focus = u.f0 + (u.f1 - u.f0) * e;
      }
      const f = u.focus;
      if (f > 0.0001) {
        dir.set(0, 0, -1).applyQuaternion(camera.quaternion);
        front.copy(camera.position).addScaledVector(dir, 4.6);
        m.position.lerpVectors(u.base, front, f);
        m.quaternion.slerp(camera.quaternion, f);
        m.scale.setScalar(1 + (2.0 - 1) * f);
      } else {
        m.position.copy(u.base);
        m.rotation.set(0, u.rotY, 0);
        m.scale.setScalar(1 + 0.05 * u.hover);
      }
      const other = state.focused && state.focused !== m ? Math.max(0, 1 - state.focused.userData.focus) : 1;
      uni.uOpacity.value = other * Math.max(appear, u.focus);

      if (dz < nearestD) { nearestD = dz; nearest = i; }
    });

    if (state.lastIdx !== nearest) {
      state.lastIdx = nearest;
      const d = data[nearest];
      if (idxNum) idxNum.innerHTML = `${String(nearest + 1).padStart(2, '0')}<span style="opacity:.35;font-size:.4em">/${total}</span>`;
      if (idxTitle) idxTitle.textContent = d.title;
      if (idxTag) idxTag.textContent = `${d.tag} — ${d.year}`;
    }

    if (cue) cue.style.opacity = state.focused || state.progress > 0.05 ? '0' : '1';
  };

  const drawLayers = (): void => {
    renderer.clear();
    renderer.render(backdrop.scene, backdrop.camera);
    renderer.clearDepth();
    renderer.render(scene, camera);
  };

  const tick = (now: number): void => {
    requestAnimationFrame(tick);
    const t = now * 0.001;
    state.last = t;
    lenis?.raf(now);
    cursor.update();
    state.progress += (state.progressTarget - state.progress) * 0.08;

    // work-section-local progress: the card sweep is driven by #tp-work's own
    // scroll range, so the columns never bleed into About / CV / Contact.
    if (work) {
      const r = work.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const raw = span > 0 ? -r.top / span : (r.top < 0 ? 1 : 0);
      state.workTarget = Math.min(1, Math.max(0, raw));
    }
    state.workP += (state.workTarget - state.workP) * 0.09;

    // Text-section veil: copy-heavy sections get a black veil over the canvas.
    let cover = 0;
    ['tp-about', 'tp-blog', 'tp-cv', 'tp-contact'].forEach((id) => {
      const el = byId(id);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vis = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
      cover += Math.max(0, vis) / window.innerHeight;
    });
    state.textCover = Math.min(1, cover);
    if (veil) veil.style.opacity = (state.textCover * 0.8).toFixed(2);

    updateCamera(t);
    updateCards(t);
    backdrop.update(t, state.progress, cursor.pointer.sx, cursor.pointer.sy, state.textCover);
    if (post) post.render(drawLayers, t); else drawLayers();
  };

  runLoader();
  requestAnimationFrame(tick);
}
