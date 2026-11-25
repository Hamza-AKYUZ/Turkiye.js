/**
 * @internal Girdiyi metne çevirir. `allowNumber` açıksa negatif olmayan tam
 * sayılar da kabul edilir. Uygun olmayan girdide `null` döner.
 */
export function toInput(value: unknown, allowNumber = false): string | null {
  if (typeof value === "string") return value;
  if (allowNumber && typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return String(value);
  }
  return null;
}

/** @internal Boşluk, tire ve noktaları siler. */
export function stripSeparators(value: string): string {
  return value.replace(/[\s.-]/g, "");
}

/** @internal Metin yalnız 0-9 rakamlarından oluşuyorsa `true` döner. */
export function isDigits(value: string): boolean {
  return /^[0-9]+$/.test(value);
}

/** @internal Harf ve rakamları "*" ile değiştirir. Geçersiz girdinin maskelenmesinde kullanılır. */
export function maskAll(value: string): string {
  return value.replace(/[0-9A-Za-z]/g, "*");
}

/**
 * @internal Metin işleyen fonksiyonların girdisini metne çevirir. Sayılar
 * metne çevrilir; `null`, `undefined` ve diğer türler boş metin olur.
 */
export function toText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return "";
}

/**
 * @internal `random` fonksiyonuyla 0 ile `max - 1` arasında tam sayı üretir.
 * Üreteç 0 ile 1 arasında sonlu bir sayı döndürmezse `TypeError` fırlatır.
 */
export function randomInt(random: () => number, max: number): number {
  if (typeof random !== "function") throw new TypeError("random bir fonksiyon olmalı");
  const value = random();
  if (typeof value !== "number" || !(value >= 0 && value <= 1)) {
    throw new TypeError("random 0 ile 1 arasında sayı döndürmeli");
  }
  return Math.min(max - 1, Math.floor(value * max));
}

/** @internal Metni `sizes` dizisindeki uzunluklarda gruplara ayırır. Kalan kısım son gruba eklenir. */
export function group(value: string, sizes: readonly number[], separator = " "): string {
  const parts: string[] = [];
  let index = 0;
  for (const size of sizes) {
    if (index >= value.length) break;
    parts.push(value.slice(index, index + size));
    index += size;
  }
  if (index < value.length) parts.push(value.slice(index));
  return parts.join(separator);
}

/** @internal Rakamlardan oluşan metni sayı dizisine çevirir. */
export function toDigits(value: string): number[] {
  const digits: number[] = [];
  for (let i = 0; i < value.length; i++) digits.push(value.charCodeAt(i) - 48);
  return digits;
}
