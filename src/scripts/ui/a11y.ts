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

function paintButton(btn: HTMLButtonElement, id: string): void {
  const steps = stepsOf(btn);

  if (steps.length > 0) {
    const step = currentStep(id, steps);
    btn.setAttribute('aria-pressed', String(step > 0));
    btn.setAttribute('aria-valuenow', String(step));
    btn.setAttribute('aria-valuetext', `${step + 1} / ${steps.length + 1}`);
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

  resetBtn.addEventListener('click', () => resetAll(buttons));

  const focusable = (): HTMLElement[] =>
    Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled])'));

  const onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
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
