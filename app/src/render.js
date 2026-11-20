// Vice City Cover Studio — paints the cover onto a canvas 2D context: panel
// photos with their crop and grade, the caption band with big poster type,
// the badge sticker, and the film finish (grain, vignette, halftone).

import { panelRects } from './layouts.js';
import { gradeFor } from './grades.js';
import { SIZES } from './state.js';

const HEAVY = (size) => `900 ${size}px "Arial Black", "Helvetica Neue", Helvetica, Arial, sans-serif`;
const BOLD = (size) => `700 ${size}px "Helvetica Neue", Helvetica, Arial, sans-serif`;

let noiseCanvas = null;

/** A small tile of random grey speckle, reused as the grain pattern. */
function grainTile() {
  if (noiseCanvas) return noiseCanvas;
  const tile = document.createElement('canvas');
  tile.width = 160;
  tile.height = 160;
  const ctx = tile.getContext('2d');
  const data = ctx.createImageData(160, 160);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 110 + Math.floor(Math.random() * 90);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  noiseCanvas = tile;
  return tile;
}

/** Clips the context to a panel (a rectangle, or one half of the diagonal). */
function clipPanel(ctx, panel, W, H) {
  ctx.beginPath();
  if (panel.shape === 'diagA') {
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(0, H);
    ctx.closePath();
  } else if (panel.shape === 'diagB') {
    ctx.moveTo(W, 0);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
  } else {
    ctx.rect(panel.x, panel.y, panel.w, panel.h);
  }
  ctx.clip();
}

/** Draws one photo cover-fitting its panel, honouring zoom and pan. */
function drawPanelPhoto(ctx, panel, img, crop, grade) {
  const base = Math.max(panel.w / img.naturalWidth, panel.h / img.naturalHeight);
  const scale = base * crop.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const cx = panel.x + panel.w / 2 + crop.panX * panel.w;
  const cy = panel.y + panel.h / 2 + crop.panY * panel.h;
  ctx.save();
  ctx.filter = grade.filter;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

/** An empty panel: a dark gradient, stripes and a prompt to add a photo. */
function drawPlaceholder(ctx, panel, index, W, H) {
  const grad = ctx.createLinearGradient(panel.x, panel.y, panel.x + panel.w, panel.y + panel.h);
  grad.addColorStop(0, '#2b1740');
  grad.addColorStop(1, '#120a1e');
  ctx.fillStyle = grad;
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = Math.max(2, panel.w * 0.01);
  for (let d = -panel.h; d < panel.w; d += 46) {
    ctx.beginPath();
    ctx.moveTo(panel.x + d, panel.y);
    ctx.lineTo(panel.x + d + panel.h, panel.y + panel.h);
    ctx.stroke();
  }
  ctx.restore();
  const size = Math.max(14, Math.min(panel.w, panel.h) * 0.09);
  ctx.font = BOLD(size);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.fillText('ADD A PHOTO', panel.x + panel.w / 2, panel.y + panel.h / 2);
  ctx.font = BOLD(size * 0.6);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillText(`PANEL ${index + 1}`, panel.x + panel.w / 2, panel.y + panel.h / 2 + size * 1.4);
}

/** The caption band: dark wash, accent bar, big caption and subtitle. */
function drawCaptionBand(ctx, state, grade, W, H) {
  const bandH = H * 0.30;
  const wash = ctx.createLinearGradient(0, H - bandH, 0, H);
  wash.addColorStop(0, 'rgba(8, 4, 18, 0)');
  wash.addColorStop(0.55, 'rgba(8, 4, 18, 0.72)');
  wash.addColorStop(1, 'rgba(8, 4, 18, 0.92)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, H - bandH, W, bandH);

  const pad = W * 0.055;
  const text = (state.caption || 'UNTITLED').trim().toUpperCase();
  const maxW = W - pad * 2;
  let size = Math.round(H * 0.105);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const fit = (s) => {
    ctx.font = HEAVY(s);
    try { ctx.letterSpacing = `${Math.round(s * 0.03)}px`; } catch { /* older canvas */ }
    return ctx.measureText(text).width;
  };
  while (size > 20 && fit(size) > maxW) size -= 4;
  fit(size);

  const captionY = H - H * 0.055 - size * 0.42;
  ctx.fillStyle = grade.accent;
  ctx.fillRect(pad, captionY - size - size * 0.22, Math.min(maxW * 0.22, W * 0.16), size * 0.1);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = size * 0.18;
  ctx.shadowOffsetY = size * 0.04;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, pad, captionY);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const sub = (state.subtitle || '').trim().toUpperCase();
  if (sub) {
    const subSize = Math.max(13, Math.round(size * 0.27));
    ctx.font = BOLD(subSize);
    try { ctx.letterSpacing = `${Math.round(subSize * 0.22)}px`; } catch { /* older canvas */ }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.fillText(sub, pad, H - H * 0.028);
  }
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
}

/** The badge sticker, tilted in the top-right corner. */
function drawBadge(ctx, state, grade, W, H) {
  const text = (state.badge || '').trim().toUpperCase();
  if (!text) return;
  const size = Math.max(15, Math.round(H * 0.026));
  ctx.font = BOLD(size);
  try { ctx.letterSpacing = `${Math.round(size * 0.14)}px`; } catch { /* older canvas */ }
  const tw = ctx.measureText(text).width;
  const padX = size * 0.9;
  const padY = size * 0.62;
  const bw = tw + padX * 2;
  const bh = size + padY * 2;
  ctx.save();
  ctx.translate(W - bw / 2 - W * 0.035, bh / 2 + H * 0.035);
  ctx.rotate(-0.1);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = size * 0.5;
  ctx.shadowOffsetY = size * 0.12;
  ctx.fillStyle = grade.accent;
  ctx.beginPath();
  ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#14081f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, size * 0.05);
  ctx.restore();
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
}

/** Paints the whole cover at W×H onto ctx. `highlight` outlines one panel. */
export function paintCover(ctx, state, photos, W, H, highlight = -1) {
  const grade = gradeFor(state.grade);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f5efe4';
  ctx.fillRect(0, 0, W, H);

  const panels = panelRects(state.layout, W, H);
  panels.forEach((panel, i) => {
    ctx.save();
    clipPanel(ctx, panel, W, H);
    const crop = state.panels[i] ?? { photo: 0, zoom: 1, panX: 0, panY: 0 };
    const img = photos[crop.photo]?.img ?? null;
    if (img) drawPanelPhoto(ctx, panel, img, crop, grade);
    else drawPlaceholder(ctx, panel, i, W, H);
    ctx.restore();
  });

  // The grade wash over the whole cover.
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(1, grade.washBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  if (state.layout === 'diagonal') {
    ctx.strokeStyle = 'rgba(245, 239, 228, 0.95)';
    ctx.lineWidth = Math.max(3, W * 0.004);
    ctx.beginPath();
    ctx.moveTo(W, 0);
    ctx.lineTo(0, H);
    ctx.stroke();
  }

  if (state.fx.halftone) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
    for (let y = 4; y < H; y += 9) {
      for (let x = 4; x < W; x += 9) {
        ctx.beginPath();
        ctx.arc(x, y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawCaptionBand(ctx, state, grade, W, H);
  drawBadge(ctx, state, grade, W, H);

  if (state.fx.vignette) {
    const vg = ctx.createRadialGradient(
      W / 2, H / 2, Math.min(W, H) * 0.42,
      W / 2, H / 2, Math.max(W, H) * 0.78,
    );
    vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  if (state.fx.grain) {
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  if (highlight >= 0 && panels[highlight]) {
    const p = panels[highlight];
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(3, W * 0.004);
    ctx.setLineDash([14, 8]);
    if (p.shape === 'rect') ctx.strokeRect(p.x + 3, p.y + 3, p.w - 6, p.h - 6);
    else { clipPanel(ctx, p, W, H); ctx.strokeRect(0, 0, W, H); }
    ctx.restore();
  }
}

/** Renders the cover into the page canvas at the state's chosen size. */
export function renderCover(canvas, state, photos, highlight = -1) {
  const size = SIZES[state.sizeIndex] ?? SIZES[0];
  canvas.width = size.w;
  canvas.height = size.h;
  paintCover(canvas.getContext('2d'), state, photos, size.w, size.h, highlight);
}

/** Renders the cover offscreen at w×h and returns it as a PNG blob. */
export function exportCoverBlob(state, photos, w, h) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    paintCover(canvas.getContext('2d'), state, photos, w, h);
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}
