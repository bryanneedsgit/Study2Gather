/**
 * Best-effort parsing of OSM `opening_hours` strings into our single daily window.
 * Complex rules (PH off, month ranges, etc.) are not fully supported — see Overpass sync.
 */

export function toMinuteOfDay(hourStr: string, minStr: string): number {
  const h = parseInt(hourStr, 10);
  const m = parseInt(minStr, 10);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 24 || m < 0 || m > 59) {
    return NaN;
  }
  if (h === 24 && m === 0) return 24 * 60;
  return h * 60 + m;
}

/**
 * Returns [openMin, closeMin] in minutes from local midnight, close exclusive upper bound ok up to 1440.
 */
export function parseOsmOpeningHoursTag(tag: string): { openMin: number; closeMin: number } | null {
  const s = tag.trim();
  if (!s) return null;
  if (/^closed$/i.test(s)) return null;

  if (/24\s*\/\s*7|^24h$/i.test(s)) {
    return { openMin: 0, closeMin: 24 * 60 };
  }

  const moSu = s.match(/Mo-Su\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/i);
  if (moSu) {
    const a = toMinuteOfDay(moSu[1]!, moSu[2]!);
    const b = toMinuteOfDay(moSu[3]!, moSu[4]!);
    if (Number.isFinite(a) && Number.isFinite(b) && b > a) return { openMin: a, closeMin: b };
  }

  const moFr = s.match(/Mo-Fr\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/i);
  if (moFr) {
    const a = toMinuteOfDay(moFr[1]!, moFr[2]!);
    const b = toMinuteOfDay(moFr[3]!, moFr[4]!);
    if (Number.isFinite(a) && Number.isFinite(b) && b > a) return { openMin: a, closeMin: b };
  }

  const moSa = s.match(/Mo-Sa\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/i);
  if (moSa) {
    const a = toMinuteOfDay(moSa[1]!, moSa[2]!);
    const b = toMinuteOfDay(moSa[3]!, moSa[4]!);
    if (Number.isFinite(a) && Number.isFinite(b) && b > a) return { openMin: a, closeMin: b };
  }

  const single = s.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (single) {
    const a = toMinuteOfDay(single[1]!, single[2]!);
    const b = toMinuteOfDay(single[3]!, single[4]!);
    if (Number.isFinite(a) && Number.isFinite(b) && b > a) return { openMin: a, closeMin: b };
  }

  return null;
}
