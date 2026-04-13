/** Validasi amount/price: harus number finite & > 0 */
export function isPositiveAmount(val: unknown): val is number {
  return typeof val === "number" && isFinite(val) && val > 0;
}

/** Validasi qty: integer positif */
export function isPositiveInt(val: unknown): val is number {
  return typeof val === "number" && Number.isInteger(val) && val > 0;
}

/** Validasi tanggal format YYYY-MM-DD dan nilai tanggal valid */
export function isValidDate(val: unknown): val is string {
  if (typeof val !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
  const d = new Date(val);
  return !isNaN(d.getTime());
}

/** Validasi month: integer 1–12 */
export function isValidMonth(val: unknown): val is number {
  return typeof val === "number" && Number.isInteger(val) && val >= 1 && val <= 12;
}

/** Validasi year: integer 2000–2100 */
export function isValidYear(val: unknown): val is number {
  return typeof val === "number" && Number.isInteger(val) && val >= 2000 && val <= 2100;
}
