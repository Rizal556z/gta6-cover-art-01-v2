// Vice City Cover Studio — wires the editor: photo tray and drag-and-drop,
// panel picking and cropping, layout/grade/word controls, presets and export.

import { createState, applyPreset, SIZES } from './state.js';
import { panelCount, panelAt } from './layouts.js';
import { renderCover, exportCoverBlob } from './render.js';

/** Loads an image from a URL (a sample photo or an object URL for a file). */
export function loadImageUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Builds the editor around the page's controls. Returns its live API. */
export function initEditor({ state, photos, canvas }) {
  const $ = (id) => document.getElementById(id);
  const status = $('status');
  let selected = 0;

  const currentCrop = () => state.panels[selected] ?? state.panels[0];

  function render(highlight = selected) {
    const count = panelCount(state.layout);
    if (selected >= count) selected = 0;
    renderCover(canvas, state, photos, highlight);
  }

  function syncAll() {
    const count = panelCount(state.layout);
    // Photo tray.
    const tray = $('tray');
    tray.replaceChildren();
    photos.forEach((photo, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.draggable = true;
      button.title = photo.name;
      button.classList.toggle('picked', currentCrop().photo === i);
      const thumb = document.createElement('img');
      thumb.src = photo.src;
      thumb.alt = photo.name;
      button.append(thumb);
      button.addEventListener('click', () => {
        currentCrop().photo = i;
        render();
        syncAll();
      });
      button.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', String(i));
      });
      tray.append(button);
    });
    // Panel picker.
    const list = $('panel-list');
    list.replaceChildren();
    for (let i = 0; i < count; i++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `Panel ${i + 1}`;
      button.classList.toggle('active', i === selected);
      button.addEventListener('click', () => {
        selected = i;
        render();
        syncAll();
      });
      list.append(button);
    }
    // Crop controls for the selected panel.
    const select = $('panel-photo');
    select.replaceChildren();
    photos.forEach((photo, i) => {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = `Photo ${i + 1} — ${photo.name}`;
      select.append(option);
    });
    select.value = String(currentCrop().photo);
    const crop = currentCrop();
    $('panel-zoom').value = String(Math.round(crop.zoom * 100));
    $('zoom-val').textContent = `${Math.round(crop.zoom * 100)}%`;
    $('panel-panx').value = String(Math.round(crop.panX * 100));
    $('panx-val').textContent = String(Math.round(crop.panX * 100));
    $('panel-pany').value = String(Math.round(crop.panY * 100));
    $('pany-val').textContent = String(Math.round(crop.panY * 100));
    // Layout, grade, words, finish.
    document.querySelectorAll('#layouts button').forEach((b) => {
      b.classList.toggle('active', b.dataset.layout === state.layout);
    });
    document.querySelectorAll('#grades button').forEach((b) => {
      b.classList.toggle('active', b.dataset.grade === state.grade);
    });
    document.querySelectorAll('#size-tabs button').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.size) === state.sizeIndex);
    });
    $('caption').value = state.caption;
    $('subtitle').value = state.subtitle;
    $('badge').value = state.badge;
    $('fx-grain').checked = state.fx.grain;
    $('fx-vignette').checked = state.fx.vignette;
    $('fx-halftone').checked = state.fx.halftone;
  }

  async function addFiles(files) {
    let added = 0;
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const url = URL.createObjectURL(file);
        const img = await loadImageUrl(url);
        photos.push({ img, src: url, name: file.name });
        added++;
      } catch { /* skip unreadable files */ }
    }
    if (added > 0) {
      status.textContent = `Added ${added} photo${added > 1 ? 's' : ''} — click one, then a panel.`;
      render();
      syncAll();
    }
  }

  function pickPanelAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * canvas.width;
    const py = ((clientY - rect.top) / rect.height) * canvas.height;
    return panelAt(state.layout, canvas.width, canvas.height, px, py);
  }

  // Photo input and drop zone.
  $('files').addEventListener('change', (e) => addFiles(e.target.files));
  const dropzone = $('dropzone');
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('over');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('over'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('over');
    addFiles(e.dataTransfer.files);
  });

  // Click a panel to select it; drop a tray photo onto a panel to fill it.
  canvas.addEventListener('click', (e) => {
    const hit = pickPanelAt(e.clientX, e.clientY);
    if (hit >= 0) {
      selected = hit;
      render();
      syncAll();
    }
  });
  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const index = Number(e.dataTransfer.getData('text/plain'));
    const hit = pickPanelAt(e.clientX, e.clientY);
    if (Number.isInteger(index) && photos[index] && hit >= 0) {
      state.panels[hit].photo = index;
      selected = hit;
      render();
      syncAll();
    }
  });

  // Panel crop controls.
  $('panel-photo').addEventListener('change', (e) => {
    currentCrop().photo = Number(e.target.value);
    render();
    syncAll();
  });
  $('panel-zoom').addEventListener('input', (e) => {
    currentCrop().zoom = Number(e.target.value) / 100;
    $('zoom-val').textContent = `${e.target.value}%`;
    render();
  });
  $('panel-panx').addEventListener('input', (e) => {
    currentCrop().panX = Number(e.target.value) / 100;
    $('panx-val').textContent = e.target.value;
    render();
  });
  $('panel-pany').addEventListener('input', (e) => {
    currentCrop().panY = Number(e.target.value) / 100;
    $('pany-val').textContent = e.target.value;
    render();
  });
  $('fill-all').addEventListener('click', () => {
    const photo = currentCrop().photo;
    state.panels.forEach((panel) => { panel.photo = photo; });
    status.textContent = 'Every panel now shows the same photo.';
    render();
    syncAll();
  });

  // Layout, grade, preset and size controls.
  document.querySelectorAll('#layouts button').forEach((button) => {
    button.addEventListener('click', () => {
      state.layout = button.dataset.layout;
      selected = 0;
      render();
      syncAll();
    });
  });
  document.querySelectorAll('#grades button').forEach((button) => {
    button.addEventListener('click', () => {
      state.grade = button.dataset.grade;
      render();
      syncAll();
    });
  });
  document.querySelectorAll('#presets button').forEach((button) => {
    button.addEventListener('click', () => {
      if (applyPreset(state, button.dataset.preset)) {
        status.textContent = `Preset “${button.textContent}” applied.`;
        render();
        syncAll();
      }
    });
  });
  document.querySelectorAll('#size-tabs button').forEach((button) => {
    button.addEventListener('click', () => {
      state.sizeIndex = Number(button.dataset.size);
      render();
      syncAll();
    });
  });

  // Words and finish.
  $('caption').addEventListener('input', (e) => { state.caption = e.target.value; render(); });
  $('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; render(); });
  $('badge').addEventListener('input', (e) => { state.badge = e.target.value; render(); });
  $('fx-grain').addEventListener('change', (e) => { state.fx.grain = e.target.checked; render(); });
  $('fx-vignette').addEventListener('change', (e) => { state.fx.vignette = e.target.checked; render(); });
  $('fx-halftone').addEventListener('change', (e) => { state.fx.halftone = e.target.checked; render(); });

  // Export: one size, or all three in one click.
  async function exportOne(index) {
    const size = SIZES[index];
    const blob = await exportCoverBlob(state, photos, size.w, size.h);
    download(blob, `vice-city-cover-${size.w}x${size.h}.png`);
    return size;
  }
  document.querySelectorAll('[data-export]').forEach((button) => {
    button.addEventListener('click', async () => {
      const size = await exportOne(Number(button.dataset.export));
      status.textContent = `Saved vice-city-cover-${size.w}x${size.h}.png`;
    });
  });
  $('export-all').addEventListener('click', async () => {
    status.textContent = 'Exporting 3 PNGs…';
    for (let i = 0; i < SIZES.length; i++) {
      const size = await exportOne(i);
      status.textContent = `Exported ${i + 1} of 3 — ${size.w}×${size.h}`;
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    status.textContent = 'Exported 3 PNGs — 1080×1080 · 1080×1350 · 1920×1080.';
  });

  syncAll();
  render();
  return { render, syncAll, setStatus: (text) => { status.textContent = text; } };
}
