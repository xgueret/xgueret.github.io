/**
 * The footage running behind the home page. Changing the background is this
 * file and nothing else: `SceneLayer` hands the two sources to the canvas, and
 * the scene reads the playback window from here.
 *
 * The shader grades whatever it is given to luminance and washes it with a
 * slow pastel drift, so any clip lands in the site's monochrome. What it
 * cannot fix is a clip whose ends do not meet: `clip` exists to cut a loop out
 * of the middle of a piece of footage, skipping an opening or a tail that
 * would black out or jump on every cycle.
 */
export interface Footage {
  /** Tried first on a desktop, second on the light path. */
  hd: string;
  /** Tried first on the light path, second on a desktop. */
  sd: string;
  /**
   * Seconds to start at and to wrap back at. `null` plays the whole clip and
   * loops it natively.
   */
  clip: { in: number; out: number } | null;
}

/**
 * Server racks. Well lit end to end, so it needs no window cut out of it — but
 * the shot drifts steadily from bright to dim over its 31 seconds and never
 * comes back, which made the native loop flash on every wrap. The file is the
 * clip followed by itself reversed, so the last frame is the first: it meets
 * itself exactly, and the slow camera move simply changes direction.
 */
export const RACKS: Footage = {
  hd: '/videos/backdrop-racks-1080.mp4',
  sd: '/videos/backdrop-racks-540.mp4',
  clip: null,
};

/**
 * Ink in water. Black for its first five seconds and its last two — measured,
 * a mean luminance of exactly 0 — so it plays from inside those ends.
 */
export const INK: Footage = {
  hd: '/videos/backdrop-ink-1080.mp4',
  sd: '/videos/backdrop-ink-540.mp4',
  clip: { in: 7.5, out: 27.5 },
};

/** Swap this line to change the background. */
export const BACKDROP: Footage = RACKS;
