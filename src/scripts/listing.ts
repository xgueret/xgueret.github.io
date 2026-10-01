import { detectCapabilities } from './scene/capabilities';

/* Loaded next to `blog.ts` on the listings that carry a backdrop. three.js is
   only fetched on machines that can draw with it; without it the page keeps
   its plain grain ground, which is what every other sub-page shows anyway. */
const canvas = document.getElementById('tp-gl') as HTMLCanvasElement | null;
const caps = detectCapabilities();

if (canvas && caps.webgl) {
  const stage = Number(canvas.dataset.stage ?? 0);
  import('./scene/listing')
    .then(({ startListingBackdrop }) => startListingBackdrop(canvas, stage, caps))
    .catch((e) => {
      console.warn('[listing] backdrop failed to start', e);
      canvas.remove();
    });
}
