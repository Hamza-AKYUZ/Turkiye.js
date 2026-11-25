import { toText } from "../core/input.ts";

// Metin fonksiyonları metin olmayan girdide hata vermez: sayılar metne çevrilir,
// diğer değerler boş metin sayılır.

/**
 * Türkçe kurallarına göre büyük harfe çevirir (i: İ, ı: I).
 *
 * @example
 * toUpper("istanbul ılık"); // "İSTANBUL ILIK"
 */
export function toUpper(value: string): string {
  return toText(value).replace(/i/g, "İ").toUpperCase();
}

/**
 * Türkçe kurallarına göre küçük harfe çevirir (I: ı, İ: i).
 *
 * @example
 * toLower("IŞIK İZİ"); // "ışık izi"
 */
export function toLower(value: string): string {
  return toText(value).replace(/I/g, "ı").replace(/İ/g, "i").toLowerCase();
}

const MINOR_WORDS = new Set(["ve", "veya", "ile", "ya", "yahut", "da", "de", "ki", "ama", "fakat", "hem", "ne"]);

/**
 * Her kelimenin ilk harfini büyütür. İlk kelime dışındaki bağlaçlar küçük kalır.
 *
 * @example
 * toTitle("ALİ VE VELİ ankara'da"); // "Ali ve Veli Ankara'da"
 */
export function toTitle(value: string): string {
  let first = true;
  return toText(value).replace(/\S+/g, (word) => {
    const lower = toLower(word);
    const keepLower = !first && MINOR_WORDS.has(lower);
    first = false;
    return keepLower ? lower : toUpper(lower.charAt(0)) + lower.slice(1);
  });
}
