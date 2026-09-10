/**
 * No WebGL: hide the canvas layers, restore the system cursor and show the
 * project grid in place of the 3D column.
 */
export function fallbackDOM(): void {
  const hide = (id: string): void => { const el = document.getElementById(id); if (el) el.style.display = 'none'; };
  ['tp-gl', 'tp-work-hud', 'tp-scrollcue', 'tp-cursor', 'tp-loader', 'tp-scrim', 'tp-veil'].forEach(hide);

  const grid = document.getElementById('tp-projects');
  const work = document.getElementById('tp-work');
  if (grid) grid.classList.remove('tp-sr-grid');
  if (work && grid) {
    work.style.height = 'auto';
    work.appendChild(grid);
  }
  document.documentElement.classList.remove('tp-cursor');
}
