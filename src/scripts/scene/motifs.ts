import { LIME } from './config';
import type { Motif } from '../../lib/motif';

export type { Motif } from '../../lib/motif';

/**
 * One drawn identity per project, same typographic system so the six read as
 * a family. A single lime accent marks the subject of each drawing. The canvas
 * is 1024×640; `ink` is the plate's foreground, `inverted` means ink on white.
 */
export function drawMotif(x: CanvasRenderingContext2D, motif: Motif, ink: string, inverted: boolean): void {
  const A = LIME;
  const soft = inverted ? 'rgba(0,0,0,.34)' : 'rgba(255,255,255,.34)';
  const ground = inverted ? '#fff' : '#000';
  x.lineJoin = 'round';

  if (motif === 'rings') {                       // target / rings
    const cx = 700, cy = 262;
    x.strokeStyle = ink;
    [172, 130, 88].forEach((r, k) => { x.lineWidth = k === 0 ? 3 : 2; x.beginPath(); x.arc(cx, cy, r, 0, 6.2832); x.stroke(); });
    x.strokeStyle = soft; x.lineWidth = 2;
    for (let a = 0; a < 12; a++) {
      const t = (a * Math.PI) / 6;
      x.beginPath();
      x.moveTo(cx + Math.cos(t) * 176, cy + Math.sin(t) * 176);
      x.lineTo(cx + Math.cos(t) * 206, cy + Math.sin(t) * 206);
      x.stroke();
    }
    x.fillStyle = A; x.beginPath(); x.arc(cx, cy, 30, 0, 6.2832); x.fill();
    x.strokeStyle = ink; x.lineWidth = 2;
    x.beginPath(); x.moveTo(300, cy); x.lineTo(cx - 200, cy); x.stroke();
  } else if (motif === 'rack') {                 // racked modules on a bus
    x.strokeStyle = soft; x.lineWidth = 2;
    x.beginPath(); x.moveTo(80, 300); x.lineTo(944, 300); x.stroke();
    const fill = [0, 3, 4, 7, 9];
    for (let k = 0; k < 12; k++) {
      const px = 80 + (k % 4) * 224, py = 176 + Math.floor(k / 4) * 92;
      x.lineWidth = 3;
      if (k === 6) { x.fillStyle = A; x.fillRect(px, py, 188, 62); }
      else if (fill.indexOf(k) > -1) { x.fillStyle = ink; x.fillRect(px, py, 188, 62); }
      else { x.strokeStyle = ink; x.strokeRect(px + 1.5, py + 1.5, 185, 59); }
      x.fillStyle = ground;
      if (fill.indexOf(k) > -1 || k === 6) for (let s = 0; s < 3; s++) x.fillRect(px + 16 + s * 22, py + 27, 12, 8);
    }
  } else if (motif === 'graph') {                // node graph
    const nodes: Array<[number, number]> = [[210, 200], [430, 160], [640, 230], [300, 340], [530, 370], [790, 330]];
    x.strokeStyle = soft; x.lineWidth = 2;
    ([[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5], [2, 4]] as Array<[number, number]>).forEach((e) => {
      x.beginPath(); x.moveTo(nodes[e[0]][0], nodes[e[0]][1]); x.lineTo(nodes[e[1]][0], nodes[e[1]][1]); x.stroke();
    });
    nodes.forEach((n, k) => {
      x.beginPath(); x.arc(n[0], n[1], k === 1 ? 40 : 30, 0, 6.2832);
      if (k === 1) { x.fillStyle = A; x.fill(); }
      else { x.fillStyle = ground; x.fill(); x.strokeStyle = ink; x.lineWidth = 3; x.stroke(); }
    });
  } else if (motif === 'columns') {              // stacked columns
    const cols = [3, 5, 4, 7, 9, 6];
    cols.forEach((n, k) => {
      for (let s = 0; s < n; s++) {
        const px = 120 + k * 132, py = 404 - s * 30;
        x.fillStyle = k === 4 && s === n - 1 ? A : (s % 2 ? soft : ink);
        x.fillRect(px, py, 96, 22);
      }
    });
    x.strokeStyle = soft; x.lineWidth = 2;
    x.beginPath(); x.moveTo(96, 430); x.lineTo(944, 430); x.stroke();
  } else if (motif === 'terminal') {             // terminal
    x.font = '400 30px "JetBrains Mono", monospace';
    const rows = [520, 340, 610, 250, 430];
    rows.forEach((w, k) => {
      const py = 178 + k * 54;
      x.fillStyle = soft; x.fillText('$', 80, py + 24);
      x.fillStyle = k === 2 ? A : ink;
      x.fillRect(124, py + 6, w, 20);
    });
    x.fillStyle = ink; x.fillRect(124 + 430 + 12, 178 + 4 * 54 + 6, 22, 20);   // caret
  } else {                                       // page wireframe
    x.strokeStyle = ink; x.lineWidth = 3;
    x.strokeRect(80, 170, 420, 250);
    x.strokeStyle = soft; x.lineWidth = 2;
    x.beginPath(); x.moveTo(80, 170); x.lineTo(500, 420); x.moveTo(500, 170); x.lineTo(80, 420); x.stroke();
    x.fillStyle = A; x.fillRect(560, 170, 120, 20);
    [340, 300, 360, 220].forEach((w, k) => { x.fillStyle = k % 2 ? soft : ink; x.fillRect(560, 216 + k * 40, w, 16); });
  }
}
