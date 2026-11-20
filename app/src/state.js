// Vice City Cover Studio — the cover's state: layout, grade, words, finish and
// one crop (photo, zoom, pan) per panel. Photos themselves live in the editor
// as loaded images; state only stores which photo index each panel shows.

export const SIZES = [
  { w: 1080, h: 1080, label: '1080 × 1080' },
  { w: 1080, h: 1350, label: '1080 × 1350' },
  { w: 1920, h: 1080, label: '1920 × 1080' },
];

export const LAYOUT_IDS = ['grid', 'hero', 'full', 'triptych', 'strip', 'diagonal'];
export const GRADE_IDS = ['sunset', 'neon', 'warm', 'mono', 'teal', 'faded'];

// One-click starting points: each sets layout, grade, words and the panel photos.
export const PRESETS = {
  'sunset-getaway': {
    layout: 'grid', grade: 'sunset',
    caption: 'SUNSET HEIST', subtitle: 'TWO FRIENDS · ONE LAST SCORE', badge: 'LEONIDA',
  },
  'neon-nights': {
    layout: 'hero', grade: 'neon',
    caption: 'VICE CITY NIGHTS', subtitle: 'A SUNSET GETAWAY IN LEONIDA', badge: 'EST. 2026',
  },
  'golden-strip': {
    layout: 'strip', grade: 'warm',
    caption: 'GOLDEN HOUR HEIST', subtitle: 'EVERY SUNSET HAS A PRICE', badge: '24K',
  },
};

/** A fresh cover: hero layout, neon grade, four panels alternating the two samples. */
export function createState() {
  return {
    layout: 'hero',
    grade: 'neon',
    sizeIndex: 0,
    caption: 'VICE CITY NIGHTS',
    subtitle: 'A SUNSET GETAWAY IN LEONIDA',
    badge: 'EST. 2026',
    fx: { grain: true, vignette: true, halftone: false },
    panels: [
      { photo: 0, zoom: 1, panX: 0, panY: 0 },
      { photo: 1, zoom: 1, panX: 0, panY: 0 },
      { photo: 0, zoom: 1, panX: 0, panY: 0 },
      { photo: 1, zoom: 1, panX: 0, panY: 0 },
    ],
  };
}

/** Applies a preset's words, layout and grade onto a state, keeping the crops. */
export function applyPreset(state, name) {
  const preset = PRESETS[name];
  if (!preset) return false;
  state.layout = preset.layout;
  state.grade = preset.grade;
  state.caption = preset.caption;
  state.subtitle = preset.subtitle;
  state.badge = preset.badge;
  return true;
}
