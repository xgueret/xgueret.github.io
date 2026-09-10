import { detectCapabilities } from './scene/capabilities';
import { fallbackDOM } from './scene/fallback';
import { initSplitText } from './ui/split-text';

const caps = detectCapabilities();

if (caps.webgl) {
  // three.js is only fetched on machines that can draw with it.
  import('./scene').then(({ startScene }) => startScene(caps));
} else {
  fallbackDOM();
  initSplitText();
}
