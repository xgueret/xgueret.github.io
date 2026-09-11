export interface Capabilities {
  mobile: boolean;
  reduced: boolean;
  webgl: boolean;
  /** Draw the projects as 3D plates. Narrow viewports read them as a list. */
  plates: boolean;
}

function hasWebGL(): boolean {
  try {
    // three r186 only ever creates a webgl2 context: probing webgl1 would send
    // WebGL1-only browsers down the scene path and fail after the chunk loads.
    if (!window.WebGL2RenderingContext) return false;
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return false;
    // Hand the context straight back. A browser caps how many can be alive at
    // once, and on a machine near that cap the probe would be the one holding
    // the slot the real canvas needs a moment later.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
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
    plates: !mq('(max-width: 1024px)'),
  };
}
