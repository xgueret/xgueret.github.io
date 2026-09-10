import { detectCapabilities } from './scene/capabilities';
import { fallbackDOM } from './scene/fallback';
import { initSplitText } from './ui/split-text';

const caps = detectCapabilities();

/**
 * Put the canvas away and read the projects as a list. Always says why in the
 * console: a scene that fails to start looks exactly like a scene that was
 * never meant to run, and a silent degrade leaves nothing to debug.
 */
function degrade(reason: string, error?: unknown): void {
  console.warn(`[home] static page — ${reason}`, error ?? '');
  fallbackDOM();
  initSplitText();
}

if (caps.webgl) {
  // three.js is only fetched on machines that can draw with it.
  import('./scene')
    .then(({ startScene }) => startScene(caps))
    .catch((e) => degrade('the WebGL scene failed to start', e));
} else {
  degrade('this browser reports no WebGL2 context');
}
