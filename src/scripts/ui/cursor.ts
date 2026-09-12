export interface PointerState {
  nx: number;
  ny: number;
  sx: number;
  sy: number;
  vel: number;
  domHover: boolean;
}

export interface Cursor {
  pointer: PointerState;
  setBoost(on: boolean): void;
  /** Freezes velocity accumulation — see the comment on `pointer.vel` below. */
  setPaused(paused: boolean): void;
  update(): void;
  destroy(): void;
}

/**
 * Custom cursor dot with inertia. Also owns the normalized pointer state the
 * scene reads for parallax and raycasting, so both consumers see one source.
 */
export function initCursor(options: { autoLoop?: boolean } = {}): Cursor {
  const el = document.getElementById('tp-cursor');
  const pointer: PointerState = { nx: 0, ny: 0, sx: 0, sy: 0, vel: 0, domHover: false };
  let tx = 0;
  let ty = 0;
  let x = 0;
  let y = 0;
  let scale = 1;
  let boost = false;
  let raf = 0;
  let paused = false;

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.documentElement.classList.add('tp-cursor');
  }

  const move = (e: PointerEvent): void => {
    tx = e.clientX;
    ty = e.clientY;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = -((e.clientY / window.innerHeight) * 2 - 1);
    /* `vel` only decays inside `update()`, which the home scene stops calling
       while paused (see `scene/index.ts`) — but this listener stays bound
       regardless, so left unguarded it would keep climbing toward its cap
       with nothing decaying it, and land as a one-off velocity spike in the
       plate shader the instant `update()` resumes. Freezing accumulation
       here keeps it consistent with everything else the pause holds still. */
    if (!paused) pointer.vel = Math.min(1, pointer.vel + Math.hypot(nx - pointer.nx, ny - pointer.ny) * 3.2);
    pointer.nx = nx;
    pointer.ny = ny;
    if (el) el.style.opacity = '1';
  };

  const over = (e: PointerEvent): void => {
    const target = e.target as Element | null;
    pointer.domHover = !!(target && target.closest && target.closest('[data-cursor]'));
  };

  window.addEventListener('pointermove', move);
  window.addEventListener('pointerover', over);

  const update = (): void => {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    const scaleT = pointer.domHover || boost ? 3.2 : 1;
    scale += (scaleT - scale) * 0.12;
    if (el) el.style.transform = `translate(${x - 7}px,${y - 7}px) scale(${scale.toFixed(3)})`;
    pointer.sx += (pointer.nx - pointer.sx) * 0.05;
    pointer.sy += (pointer.ny - pointer.sy) * 0.05;
    pointer.vel *= 0.92;
  };

  const loop = (): void => {
    raf = requestAnimationFrame(loop);
    update();
  };
  if (options.autoLoop) raf = requestAnimationFrame(loop);

  return {
    pointer,
    setBoost: (on) => { boost = on; },
    setPaused: (p) => { paused = p; },
    update,
    destroy: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
    },
  };
}
