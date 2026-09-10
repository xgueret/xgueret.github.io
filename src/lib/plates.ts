/**
 * Upper bound of 3D plates drawn on the home page. The featured projects are
 * the pool; when the pool is larger, the scene picks this many at random on
 * each visit. Section height and camera travel derive from the count.
 */
export const MAX_PLATES = 4;

/** Depth of the first plate and spacing between plates (mockup values). */
export const CARD_FIRST_Z = -11;
export const CARD_GAP_Z = 7.5;
/** The camera starts at the hero depth and flies just past the last plate. */
export const CAMERA_START_Z = 8;

/** `#tp-work` height in vh for a plate count — 340 vh for six, as the mockup. */
export function workHeightVh(count: number): number {
  return 40 + count * 50;
}

/** Camera Z travel for a plate count — 58 for six, as the mockup. */
export function cameraTravelZ(count: number): number {
  return CAMERA_START_Z - (CARD_FIRST_Z - (count - 1) * CARD_GAP_Z) + 1.5;
}
