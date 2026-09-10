import { ALL_PROJECTS_PLATE, MAX_PLATES, pickInOrder } from '../../lib/plates';

const hide = (id: string): void => {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
};

/**
 * Bring the project grid out of the accessibility tree and into the work
 * section, in place of the 3D column. The padding belongs to the visible grid
 * alone: on the sr-only box it would add dead scroll under the footer.
 */
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
  });
}

export function revealProjectList(): void {
  hide('tp-work-hud');
  const grid = document.getElementById('tp-projects');
  const work = document.getElementById('tp-work');
  if (grid) {
    trimToCap(grid);
    grid.classList.remove('tp-sr-grid');
    grid.classList.add('tp-projects-open');
  }
  if (work && grid) {
    work.style.height = 'auto';
    work.appendChild(grid);
  }
}

/** No WebGL: hide every canvas layer and restore the system cursor. */
export function fallbackDOM(): void {
  ['tp-gl', 'tp-scrollcue', 'tp-cursor', 'tp-loader', 'tp-scrim', 'tp-veil'].forEach(hide);
  revealProjectList();
  document.documentElement.classList.remove('tp-cursor');
}
