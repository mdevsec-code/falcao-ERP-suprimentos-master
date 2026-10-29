/** Páginas visíveis: primeira, última e vizinhas da atual, com reticências entre os saltos. */
export function pageWindow(current: number, totalPages: number): (number | 'gap')[] {
  const pages = new Set([1, totalPages, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  sorted.forEach((p, idx) => {
    const prev = sorted[idx - 1];
    if (prev !== undefined && p - prev > 1) out.push(p - prev === 2 ? p - 1 : 'gap');
    out.push(p);
  });
  return out;
}
