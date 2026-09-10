export interface Capabilities {
  mobile: boolean;
  reduced: boolean;
  webgl: boolean;
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

/**
 * Touch-first devices get the light path. A narrow desktop window must not
 * latch it, so width alone never decides.
 */
export function detectCapabilities(): Capabilities {
  const mq = (q: string): boolean => window.matchMedia(q).matches;
  return {
    mobile: mq('(pointer: coarse)') || (mq('(max-width: 820px)') && mq('(hover: none)')),
    reduced: mq('(prefers-reduced-motion: reduce)'),
    webgl: hasWebGL(),
  };
}
