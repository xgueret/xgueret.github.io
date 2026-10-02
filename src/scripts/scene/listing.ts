import { WebGLRenderer } from 'three';
import { onA11yChange } from '../ui/a11y';
import { getTheme, onThemeChange } from '../ui/theme';
import { createBackdrop } from './backdrop';
import type { Capabilities } from './capabilities';
import { SCENE, SCENE_THEME } from './config';

/** Listings sit behind copy the reader came for: the home stays the showcase. */
const LISTING_INTENSITY = 0.5;
/** Scroll distance, in viewport heights, over which the shape breaks apart. */
const DISSOLVE_SPAN = 0.7;

/**
 * The home backdrop alone, held on one shape: no plates, no post-process, no
 * smooth scroll. `stage` picks the shape (0 stream … 3 helix); it still
 * flows, turns and answers the pointer, it just never morphs. Scrolling into
 * the listing breaks it apart — the content below is what the reader came for.
 */
export function startListingBackdrop(canvas: HTMLCanvasElement, stage: number, caps: Capabilities): void {
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);

  let theme = SCENE_THEME[getTheme()];
  renderer.setClearColor(theme.clear, 1);
  const backdrop = createBackdrop(
    SCENE.tokensLight, renderer.getPixelRatio(), !caps.mobile, theme, LISTING_INTENSITY,
  );

  let themed = true;
  onThemeChange((next) => {
    if (themed) { themed = false; return; }
    theme = SCENE_THEME[next];
    renderer.setClearColor(theme.clear, 1);
    backdrop.setTheme(theme);
  });

  window.addEventListener('resize', () => renderer.setSize(window.innerWidth, window.innerHeight));

  const pointer = { nx: 0, ny: 0, sx: 0, sy: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ny = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  /* Pause freezes the clock where it stood (see the home scene for the same
     offset trick); a hidden canvas is simply not drawn. */
  let paused = false;
  let hidden = false;
  let pausedAt = 0;
  let pausedOffset = 0;
  onA11yChange((s) => {
    hidden = s.hideImages;
    if (paused === s.pause) return;
    paused = s.pause;
    if (paused) pausedAt = performance.now();
    else pausedOffset += performance.now() - pausedAt;
  });

  let dissolve = 0;
  let gone = false;
  const tick = (now: number): void => {
    requestAnimationFrame(tick);
    if (paused || hidden || document.hidden) return;
    const target = Math.min(1, window.scrollY / (window.innerHeight * DISSOLVE_SPAN));
    dissolve = caps.reduced ? target : dissolve + (target - dissolve) * 0.12;
    // Fully dissolved: one last (empty) frame, then nothing to draw until the
    // reader scrolls back up.
    if (dissolve > 0.999) {
      if (gone) return;
      gone = true;
    } else {
      gone = false;
    }
    pointer.sx += (pointer.nx - pointer.sx) * 0.05;
    pointer.sy += (pointer.ny - pointer.sy) * 0.05;
    const t = caps.reduced ? 0 : (now - pausedOffset) * 0.001;
    backdrop.update(t, stage, pointer.nx, pointer.ny, pointer.sx, pointer.sy, dissolve);
    renderer.clear();
    renderer.render(backdrop.scene, backdrop.camera);
  };
  requestAnimationFrame(tick);
}
