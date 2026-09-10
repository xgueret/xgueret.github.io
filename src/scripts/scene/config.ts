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

export { CARD_FIRST_Z, CARD_GAP_Z, CAMERA_START_Z, cameraTravelZ, MAX_PLATES } from '../../lib/plates';
