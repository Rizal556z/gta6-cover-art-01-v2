// Vice City Cover Studio — six colour grades. Each grade is a canvas 2D filter
// applied while a photo is drawn, plus a warm/cool wash over the whole cover
// and one accent colour for the caption bar and the badge sticker.

export const GRADES = {
  sunset: {
    label: 'Sunset',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.02) hue-rotate(-12deg)',
    washTop: 'rgba(255, 122, 61, 0.16)',
    washBottom: 'rgba(194, 24, 122, 0.34)',
    accent: '#ff7a3d',
  },
  neon: {
    label: 'Neon',
    filter: 'saturate(1.6) contrast(1.12) brightness(1.04) hue-rotate(8deg)',
    washTop: 'rgba(255, 46, 136, 0.14)',
    washBottom: 'rgba(34, 211, 238, 0.30)',
    accent: '#ff2e88',
  },
  warm: {
    label: 'Warm',
    filter: 'saturate(1.25) contrast(1.05) brightness(1.06) sepia(0.28)',
    washTop: 'rgba(255, 179, 71, 0.20)',
    washBottom: 'rgba(180, 83, 9, 0.30)',
    accent: '#ffb347',
  },
  mono: {
    label: 'Mono',
    filter: 'grayscale(1) contrast(1.14) brightness(1.06)',
    washTop: 'rgba(229, 231, 235, 0.10)',
    washBottom: 'rgba(76, 29, 149, 0.38)',
    accent: '#e5e7eb',
  },
  teal: {
    label: 'Teal-orange',
    filter: 'saturate(1.3) contrast(1.1) hue-rotate(-18deg)',
    washTop: 'rgba(45, 212, 191, 0.18)',
    washBottom: 'rgba(249, 115, 22, 0.30)',
    accent: '#2dd4bf',
  },
  faded: {
    label: 'Faded film',
    filter: 'saturate(0.85) contrast(0.92) brightness(1.1)',
    washTop: 'rgba(245, 208, 169, 0.22)',
    washBottom: 'rgba(148, 163, 184, 0.26)',
    accent: '#f5d0a9',
  },
};

/** The grade for an id, falling back to sunset for an unknown one. */
export function gradeFor(id) {
  return GRADES[id] ?? GRADES.sunset;
}
