// Vice City Cover Studio — entry point. Loads the two sample photos made for
// make.fun (free to use), builds the editor, and, when the URL carries
// ?shot=…, stages a fixed scene for a screenshot instead.

import { createState } from './state.js';
import { initEditor, loadImageUrl } from './editor.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const state = createState();
const photos = [];

/** Loads one sample photo into the tray, skipping it if already loaded. */
async function loadSample(name) {
  if (photos.some((photo) => photo.name === name)) return;
  try {
    const img = await loadImageUrl(`samples/${name}.jpg`);
    photos.push({ img, src: `samples/${name}.jpg`, name });
  } catch {
    // A missing sample leaves the panel placeholders in place.
  }
}

await Promise.all([loadSample('pier'), loadSample('boulevard')]);

const editor = initEditor({ state, photos, canvas });

const query = new URLSearchParams(location.search);
if (query.get('shot')) {
  runShot(query, { state, photos, editor });
} else {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
