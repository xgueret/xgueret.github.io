/**
 * Accessibility toolbar behaviour. The markup is rendered by
 * `components/A11yWidget.astro` — this module only binds to it, so every label
 * stays in the i18n files. State lives as `tp-a11y-*` classes on <html>; the
 * head script in `BaseLayout` stamps them before the first paint, and this
 * module owns every change after that.
 */

interface Feature {
  /** localStorage key, minus nothing — stored verbatim. */
  key: string;
  /** Class written to <html>. Steps append the step suffix. */
  cssClass: string;
}

/** Ids match `data-a11y-feature` in the markup. */
const FEATURES: Record<string, Feature> = {
  fontScale: { key: 'tp-a11y-font', cssClass: 'tp-a11y-font-' },
  lineHeight: { key: 'tp-a11y-lh', cssClass: 'tp-a11y-lh-' },
  alignLeft: { key: 'tp-a11y-align', cssClass: 'tp-a11y-align-left' },
  readableFont: { key: 'tp-a11y-readable', cssClass: 'tp-a11y-readable-font' },
  contrast: { key: 'tp-a11y-contrast', cssClass: 'tp-a11y-contrast' },
  hideImages: { key: 'tp-a11y-hide-images', cssClass: 'tp-a11y-hide-images' },
  pause: { key: 'tp-a11y-pause', cssClass: 'tp-a11y-pause' },
  links: { key: 'tp-a11y-links', cssClass: 'tp-a11y-links' },
  mask: { key: 'tp-a11y-mask', cssClass: 'tp-a11y-mask' },
  focus: { key: 'tp-a11y-focus', cssClass: 'tp-a11y-focus' },
};

export interface A11yState {
  pause: boolean;
  hideImages: boolean;
}

/** Fired on `document` after any change, for the WebGL scene. */
export const A11Y_EVENT = 'tp-a11ychange';

const root = document.documentElement;

function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Private browsing refuses the write; the change still holds for this page.
  }
}

function currentState(): A11yState {
  return {
    pause: root.classList.contains(FEATURES.pause.cssClass),
    hideImages: root.classList.contains(FEATURES.hideImages.cssClass),
  };
}

function announce(): void {
  document.dispatchEvent(new CustomEvent<A11yState>(A11Y_EVENT, { detail: currentState() }));
}

/* ---- Reading mask --------------------------------------------------------
   Two bands sized around a strip that follows the pointer. Height is written
   on a rAF tick so a fast pointer cannot queue a layout per mousemove.

   `resize`/`orientationchange` re-place the same strip at the last known
   pointer Y — otherwise a viewport-height change with no pointer event
   (rotating a tablet and holding still, Mobile Safari/Chrome collapsing the
   URL bar on scroll) leaves the bottom band short of the new edge. Both
   route through the same `scheduleMask` coalescing as pointer moves, not a
   second throttling path. */

const MASK_STRIP = 120;
let bandTop: HTMLElement | null = null;
let bandBottom: HTMLElement | null = null;
let maskFrame = 0;
let lastMaskY = 0;

function placeMask(y: number): void {
  if (!bandTop || !bandBottom) return;
  lastMaskY = y;
  const half = MASK_STRIP / 2;
  const topHeight = Math.max(0, y - half);
  const bottomStart = Math.min(window.innerHeight, y + half);
  bandTop.style.height = `${topHeight}px`;
  bandBottom.style.top = `${bottomStart}px`;
  bandBottom.style.height = `${window.innerHeight - bottomStart}px`;
}

function scheduleMask(y: number): void {
  if (maskFrame) return;
  maskFrame = requestAnimationFrame(() => {
    maskFrame = 0;
    placeMask(y);
  });
}

function onMaskPointer(e: PointerEvent): void {
  scheduleMask(e.clientY);
}

/** Viewport height changed with no pointer event; re-place at the same Y. */
function onMaskViewportChange(): void {
  scheduleMask(lastMaskY);
}

function showMask(): void {
  if (bandTop) return;
  bandTop = document.createElement('div');
  bandTop.className = 'tp-a11y-mask-band is-top';
  bandBottom = document.createElement('div');
  bandBottom.className = 'tp-a11y-mask-band is-bottom';
  document.body.append(bandTop, bandBottom);
  placeMask(window.innerHeight / 2);
  document.addEventListener('pointermove', onMaskPointer, { passive: true });
  window.addEventListener('resize', onMaskViewportChange);
  window.addEventListener('orientationchange', onMaskViewportChange);
}

function hideMask(): void {
  if (maskFrame) {
    cancelAnimationFrame(maskFrame);
    maskFrame = 0;
  }
  document.removeEventListener('pointermove', onMaskPointer);
  window.removeEventListener('resize', onMaskViewportChange);
  window.removeEventListener('orientationchange', onMaskViewportChange);
  bandTop?.remove();
  bandBottom?.remove();
  bandTop = null;
  bandBottom = null;
}

/** Bring the mask DOM in line with the class on <html>. */
function syncMask(): void {
  if (root.classList.contains(FEATURES.mask.cssClass)) showMask();
  else hideMask();
}

/** Steps come off the markup so the panel stays the single source of truth. */
function stepsOf(btn: HTMLButtonElement): string[] {
  const raw = btn.dataset.a11ySteps;
  return raw ? raw.split(',') : [];
}

/**
 * Index 0 is the unscaled state and carries no class. The DOM is the read
 * model here, same as the boolean toggles below — a failed localStorage
 * write must not desync the control from the class it just applied.
 */
function currentStep(id: string, steps: string[]): number {
  const { cssClass } = FEATURES[id];
  const i = steps.findIndex((s) => root.classList.contains(cssClass + s));
  return i === -1 ? 0 : i + 1;
}

/**
 * Fold the current level into the control's accessible NAME.
 *
 * `aria-valuenow`/`aria-valuetext` were used here and announced nothing: the
 * stepped controls are `<button>`s, and ARIA does not support those attributes
 * on an implicit `role=button`. The dots are `aria-hidden`, so a screen-reader
 * user pressing `Taille de texte` four times heard only "pressed, pressed,
 * pressed, not pressed" and never learned which level they had landed on. The
 * name is re-read on every activation, which is exactly the moment it matters.
 *
 * The template comes off the element: this module runs in the browser and
 * cannot call `t()`, so `A11yWidget.astro` renders the localized string into
 * `data-a11y-level`. Level 1 is the unscaled state, so the displayed number is
 * one-based over `steps.length + 1` positions.
 */
function nameWithLevel(btn: HTMLButtonElement, step: number, total: number): void {
  const template = btn.dataset.a11yLevel;
  const label = btn.querySelector<HTMLElement>('.tp-a11y-feature-label')?.textContent?.trim();
  if (!template || !label) return;
  const level = template.replace('{current}', String(step + 1)).replace('{total}', String(total));
  btn.setAttribute('aria-label', `${label}, ${level}`);
}

function paintButton(btn: HTMLButtonElement, id: string): void {
  const steps = stepsOf(btn);

  if (steps.length > 0) {
    const step = currentStep(id, steps);
    btn.setAttribute('aria-pressed', String(step > 0));
    nameWithLevel(btn, step, steps.length + 1);
    btn.querySelectorAll<HTMLElement>('.tp-a11y-dot').forEach((dot, i) => {
      dot.classList.toggle('is-on', i < step);
    });
    return;
  }

  btn.setAttribute('aria-pressed', String(root.classList.contains(FEATURES[id].cssClass)));
}

function applyStep(id: string, steps: string[], step: number): void {
  const { key, cssClass } = FEATURES[id];
  steps.forEach((s) => root.classList.remove(cssClass + s));
  if (step === 0) {
    write(key, null);
    return;
  }
  root.classList.add(cssClass + steps[step - 1]);
  write(key, steps[step - 1]);
}

function toggle(btn: HTMLButtonElement, id: string): void {
  const steps = stepsOf(btn);

  if (steps.length > 0) {
    applyStep(id, steps, (currentStep(id, steps) + 1) % (steps.length + 1));
  } else {
    const { key, cssClass } = FEATURES[id];
    const on = root.classList.toggle(cssClass);
    write(key, on ? '1' : null);
  }

  paintButton(btn, id);
  syncMask();
  announce();
}

function resetAll(buttons: NodeListOf<HTMLButtonElement>): void {
  buttons.forEach((btn) => {
    const id = btn.dataset.a11yFeature;
    if (!id || !FEATURES[id]) return;
    const steps = stepsOf(btn);
    if (steps.length > 0) applyStep(id, steps, 0);
    else {
      root.classList.remove(FEATURES[id].cssClass);
      write(FEATURES[id].key, null);
    }
    paintButton(btn, id);
  });
  syncMask();
  announce();
}

export function initA11y(): void {
  const openBtn = document.getElementById('tp-a11y-open');
  const panel = document.getElementById('tp-a11y-panel');
  const overlay = document.getElementById('tp-a11y-overlay');
  const resetBtn = document.getElementById('tp-a11y-reset');
  const closeBtn = document.getElementById('tp-a11y-close');
  if (!openBtn || !panel || !overlay || !resetBtn || !closeBtn) return;

  const buttons = panel.querySelectorAll<HTMLButtonElement>('[data-a11y-feature]');

  buttons.forEach((btn) => {
    const id = btn.dataset.a11yFeature;
    if (!id || !FEATURES[id]) return;
    paintButton(btn, id);
    btn.addEventListener('click', () => toggle(btn, id));
  });

  syncMask();

  resetBtn.addEventListener('click', () => resetAll(buttons));

  const focusable = (): HTMLElement[] =>
    Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled])'));

  const onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      // The home scene closes its project overlay on a window-level Escape.
      // This listener is on `document`, so stopping propagation here keeps one
      // Escape from dismissing both the panel and a dialog behind it.
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = focusable();
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  function open(): void {
    panel!.hidden = false;
    overlay!.hidden = false;
    openBtn!.setAttribute('aria-expanded', 'true');
    focusable()[0]?.focus();
    document.addEventListener('keydown', onKeydown);
  }

  function close(): void {
    panel!.hidden = true;
    overlay!.hidden = true;
    openBtn!.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKeydown);
    openBtn!.focus();
  }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
}

/** Run `fn` on every change, and once now with the current state. */
export function onA11yChange(fn: (s: A11yState) => void): void {
  document.addEventListener(A11Y_EVENT, (e) => fn((e as CustomEvent<A11yState>).detail));
  fn(currentState());
}
