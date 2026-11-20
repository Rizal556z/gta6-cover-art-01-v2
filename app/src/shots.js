// Vice City Cover Studio — fixed scenes for screenshots, driven by the URL:
//   ?shot=cover  — the cover alone, filling the frame (the exported art)
//   ?shot=editor — the editor with the sample photos loaded
//   ?shot=export — the editor with the export step done and reported
// Layout, grade and words come from query params, so each shot can show a
// different cover. Sets window.__shotReady once the scene has painted.

const COVER_DEFAULTS = {
  layout: 'hero', grade: 'neon',
  caption: 'VICE CITY NIGHTS', subtitle: 'A SUNSET GETAWAY IN LEONIDA', badge: 'EST. 2026',
};

function readyAfterPaint() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}

/** Applies a shot scene on top of the loaded editor. */
export function runShot(query, { state, editor }) {
  const shot = query.get('shot') ?? 'editor';
  const scene = shot === 'cover' ? COVER_DEFAULTS : COVER_DEFAULTS;
  state.layout = query.get('layout') ?? scene.layout;
  state.grade = query.get('grade') ?? scene.grade;
  state.caption = query.get('caption') ?? scene.caption;
  state.subtitle = query.get('subtitle') ?? scene.subtitle;
  state.badge = query.get('badge') ?? scene.badge;
  if (query.get('halftone') === '1') state.fx.halftone = true;

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    state.sizeIndex = 2; // 1920 × 1080, the landscape cover
    editor.render(-1);
  } else if (shot === 'export') {
    document.body.classList.add('shot-export');
    editor.syncAll();
    editor.render();
    editor.setStatus('Exported 3 PNGs — 1080×1080 · 1080×1350 · 1920×1080.');
  } else {
    editor.syncAll();
    editor.render();
  }
  readyAfterPaint();
}
