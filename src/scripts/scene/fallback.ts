import { ALL_PROJECTS_PLATE, MAX_PLATES, pickInOrder } from '../../lib/plates';
import { MOTIFS, type Motif } from '../../lib/motif';
import { SCENE_THEME } from './config';
import { drawMotif } from './motifs';
import { getTheme, onThemeChange } from '../ui/theme';

const setDisplay = (id: string, value: string): void => {
  const el = document.getElementById(id);
  if (el) el.style.display = value;
};

const hide = (id: string): void => setDisplay(id, 'none');

/**
 * Each cell gets its plate's drawing, cropped to the band the motif occupies
 * so it reads as a banner rather than a square with empty margins.
 */
function paintCell(x: CanvasRenderingContext2D, motif: Motif, w: number, h: number): void {
  const theme = SCENE_THEME[getTheme()];
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.fillStyle = theme.ground;
  x.fillRect(0, 0, w, h);
  x.translate(0, -130);
  drawMotif(x, motif, { ink: theme.ink, ground: theme.ground, soft: `rgba(${theme.inkRgb},.34)` });
}

function addArtwork(cell: HTMLElement): void {
  const name = cell.dataset.motif as Motif | undefined;
  const motif: Motif = name && (MOTIFS as readonly string[]).includes(name) ? name : 'rings';
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 330;
  canvas.className = 'tp-cell-art';
  canvas.setAttribute('aria-hidden', 'true');
  const x = canvas.getContext('2d');
  if (!x) return;
  paintCell(x, motif, canvas.width, canvas.height);
  // A theme change has to repaint it: the drawing is baked into the canvas.
  onThemeChange(() => paintCell(x, motif, canvas.width, canvas.height));
  const index = cell.querySelector('[data-cell-index]');
  if (index) index.after(canvas);
  else cell.prepend(canvas);
}

function trimToCap(grid: HTMLElement): void {
  const all = Array.from(grid.querySelectorAll<HTMLElement>('[data-project]'));
  const catalogue = all.find((el) => el.dataset.project === ALL_PROJECTS_PLATE);
  const projects = all.filter((el) => el !== catalogue);
  const kept = pickInOrder(projects, catalogue ? MAX_PLATES - 1 : MAX_PLATES);
  if (catalogue) kept.push(catalogue);
  all.forEach((el) => { if (!kept.includes(el)) el.remove(); });
  // Numbered by position in the selection, exactly as the plates are.
  kept.forEach((el, i) => {
    const index = el.querySelector<HTMLElement>('[data-cell-index]');
    if (index) index.textContent = String(i + 1).padStart(2, '0');
    addArtwork(el);
  });
}

/* `Masquer les images` reveals and hides this same list while the page stays
   loaded, so the move has to be reversible — and `trimToCap` is not: it removes
   cells and appends a canvas to each survivor. It therefore runs once, and
   everything else toggles. `origin` remembers where the grid sat in the
   document: `#tp-projects` is a sibling AFTER `#tp-main`, so putting it back is
   what keeps the list from reappearing below the contact section.

   `workHeight` is the same idea for `#tp-work`'s inline height, and it is NOT
   scene state to be cleared: `WorkSection.astro` renders it server-side from
   `workHeightVh(count)` (`height:190vh`), and that range is the whole scroll
   budget the plate fly-through sweeps. Clearing it instead of restoring it left
   the section at `auto` — about 100vh, the sticky HUD alone — so `index.ts`'s
   `span = r.height - innerHeight` collapsed to nothing and `workP` snapped
   between 0 and 1 for the rest of the session. Whatever was there is saved
   verbatim, empty string included, so the round trip is symmetric. */
let trimmed = false;
let origin: { parent: ParentNode; next: Node | null } | null = null;
let workHeight: string | null = null;

/**
 * Bring the project grid out of the accessibility tree and into the work
 * section, in place of the 3D column. The padding and the cell styling belong
 * to `.tp-projects-open` in `global.css` — including the `min-width: 0` that
 * stops a domain-name title scrolling phones sideways — so this is the only
 * supported way to show the list. Idempotent.
 */
export function revealProjectList(): void {
  const grid = document.getElementById('tp-projects');
  const work = document.getElementById('tp-work');
  if (!grid) return;
  if (!trimmed) {
    trimToCap(grid);
    trimmed = true;
  }
  if (!origin && grid.parentNode) origin = { parent: grid.parentNode, next: grid.nextSibling };
  hide('tp-work-hud');
  grid.classList.remove('tp-sr-grid');
  grid.classList.add('tp-projects-open');
  if (work) {
    if (workHeight === null) workHeight = work.style.height;
    work.style.height = 'auto';
    work.appendChild(grid);
  }
}

/**
 * Undo `revealProjectList`: the grid goes back to being sr-only where it came
 * from, and `#tp-work` gets back the exact inline height it was rendered with,
 * so the 3D column can be flown through again. Only the accessibility toggle
 * calls this — the no-WebGL path has nothing to go back to.
 */
export function hideProjectList(): void {
  const grid = document.getElementById('tp-projects');
  const work = document.getElementById('tp-work');
  if (!grid) return;
  setDisplay('tp-work-hud', '');
  grid.classList.remove('tp-projects-open');
  grid.classList.add('tp-sr-grid');
  if (origin) origin.parent.insertBefore(grid, origin.next);
  if (work && workHeight !== null) work.style.height = workHeight;
}

/** No WebGL: hide every canvas layer and restore the system cursor. */
export function fallbackDOM(): void {
  ['tp-gl', 'tp-scrollcue', 'tp-cursor', 'tp-loader', 'tp-scrim', 'tp-veil'].forEach(hide);
  revealProjectList();
  document.documentElement.classList.remove('tp-cursor');
}
