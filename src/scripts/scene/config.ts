/** Frozen values of the mockup's tweak panel (spec §3, decision 8). */
export const SCENE = {
  /** Backdrop particles on a desktop, and on the light path. */
  tokens: 12000,
  tokensLight: 6000,
  drift: 1,
  grain: 0.075,
  postFx: true,
  cardBlur: 1,
} as const;

export const LIME = '#a8cf3e';

export {
  ALL_PROJECTS_PLATE, CARD_FIRST_Z, CARD_GAP_Z, CAMERA_START_Z, cameraTravelZ, MAX_PLATES,
} from '../../lib/plates';

/**
 * What each theme paints with. `clear` is the renderer's background; `paper`
 * lays the backdrop's tokens down as ink instead of light; `vignette` softens on paper, where
 * darkened corners read as dirt rather than as an edge. The rgb strings let a
 * plate build its own translucent tints — a plate that inverts swaps which of
 * the two it draws with, which is how the column keeps its rhythm in either
 * theme.
 */
export const SCENE_THEME = {
  dark: {
    clear: 0x000000,
    ink: '#ffffff',
    ground: '#000000',
    inkRgb: '255,255,255',
    groundRgb: '0,0,0',
    vignette: 0.55,
    paper: false,
  },
  light: {
    clear: 0xf4f2ed,
    ink: '#111111',
    ground: '#f4f2ed',
    inkRgb: '17,17,17',
    groundRgb: '244,242,237',
    vignette: 0.3,
    paper: true,
  },
} as const;

export type SceneTheme = (typeof SCENE_THEME)[keyof typeof SCENE_THEME];
