/** Frozen values of the mockup's tweak panel (spec §3, decision 8). */
export const SCENE = {
  pastel: 0.4,
  bgLevel: 1,
  drift: 1,
  grain: 0.075,
  postFx: true,
  cardBlur: 1,
} as const;

export const LIME = '#a8cf3e';

/** Card column: first plate depth and spacing along Z. */
export const CARD_FIRST_Z = -11;
export const CARD_GAP_Z = 7.5;
/** Camera flies from the hero (z 8) to just past the last card. */
export const CAMERA_START_Z = 8;
export const CAMERA_TRAVEL_Z = 58;
