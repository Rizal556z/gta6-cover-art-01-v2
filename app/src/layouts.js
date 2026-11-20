// Vice City Cover Studio — six panel layouts. Each returns the panels of a
// cover as rectangles in pixels (or, for the diagonal split, as clipped
// triangles), so the renderer and the editor's click-picking share one geometry.

export const LAYOUTS = {
  grid: { label: '4-panel grid' },
  hero: { label: 'Hero + three' },
  full: { label: 'Full-bleed' },
  triptych: { label: 'Triptych' },
  strip: { label: 'Poster strip' },
  diagonal: { label: 'Diagonal split' },
};

function rect(x, y, w, h, shape = 'rect') {
  return { x, y, w, h, shape };
}

/** Panel rectangles for a layout at W×H, with a thin gutter between panels. */
export function panelRects(layout, W, H) {
  const g = Math.max(2, Math.round(Math.min(W, H) * 0.012));
  switch (layout) {
    case 'grid': {
      const cw = (W - g) / 2;
      const ch = (H - g) / 2;
      return [
        rect(0, 0, cw, ch), rect(cw + g, 0, cw, ch),
        rect(0, ch + g, cw, ch), rect(cw + g, ch + g, cw, ch),
      ];
    }
    case 'hero': {
      const hw = Math.round(W * 0.62);
      const rw = W - hw - g;
      const rh = (H - 2 * g) / 3;
      return [
        rect(0, 0, hw, H),
        rect(hw + g, 0, rw, rh),
        rect(hw + g, rh + g, rw, rh),
        rect(hw + g, 2 * (rh + g), rw, rh),
      ];
    }
    case 'full':
      return [rect(0, 0, W, H)];
    case 'triptych': {
      const cw = (W - 2 * g) / 3;
      return [
        rect(0, 0, cw, H), rect(cw + g, 0, cw, H), rect(2 * (cw + g), 0, cw, H),
      ];
    }
    case 'strip': {
      const th = Math.round(H * 0.55);
      const bh = H - th - g;
      const bw = (W - 2 * g) / 3;
      return [
        rect(0, 0, W, th),
        rect(0, th + g, bw, bh), rect(bw + g, th + g, bw, bh),
        rect(2 * (bw + g), th + g, bw, bh),
      ];
    }
    case 'diagonal':
      return [rect(0, 0, W, H, 'diagA'), rect(0, 0, W, H, 'diagB')];
    default:
      return panelRects('hero', W, H);
  }
}

/** How many panels a layout shows. */
export function panelCount(layout) {
  return panelRects(layout, 100, 100).length;
}

/** The panel (index) holding point (px, py) on a W×H cover, or -1. */
export function panelAt(layout, W, H, px, py) {
  const panels = panelRects(layout, W, H);
  if (layout === 'diagonal') {
    // The diagonal runs from the top-right corner to the bottom-left one.
    return (py / H) < (1 - px / W) ? 0 : 1;
  }
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    if (px >= p.x && px < p.x + p.w && py >= p.y && py < p.y + p.h) return i;
  }
  return -1;
}
