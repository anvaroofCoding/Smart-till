/** EAN-13 tekshiruv raqamini hisoblaydi (12 ta raqam uchun). */
export function computeEan13CheckDigit(digits12: string): number {
  let sum = 0;

  for (let index = 0; index < 12; index += 1) {
    const digit = Number.parseInt(digits12[index] ?? '0', 10);
    sum += index % 2 === 0 ? digit : digit * 3;
  }

  return (10 - (sum % 10)) % 10;
}

/** Ichki mahsulotlar uchun EAN-13 barkod yig'indisini yig'adi. */
export function buildEan13Barcode(base12: string): string {
  const normalized = base12.replace(/\D/g, '').slice(0, 12).padStart(12, '0');
  const checkDigit = computeEan13CheckDigit(normalized);
  return `${normalized}${checkDigit}`;
}
