import { toLower } from "./case.ts";

const FOLD: Readonly<Record<string, string>> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

/**
 * Arama ve karşılaştırma için metni sadeleştirir: küçük harfe çevirir,
 * Türkçe karakterleri ve aksanları kaldırır.
 *
 * @example
 * fold("Şişli Çarşı"); // "sisli carsi"
 * fold("Kâğıt");       // "kagit"
 */
export function fold(value: string): string {
  return toLower(value)
    .replace(/[çğıöşü]/g, (char) => FOLD[char] as string)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Metnin aranan ifadeyi içerip içermediğini, harf büyüklüğü ve Türkçe
 * karakter farkını yok sayarak kontrol eder.
 *
 * @example
 * includes("Şişli Belediyesi", "sisli"); // true
 * includes("İSTANBUL", "istanbul");      // true
 */
export function includes(text: string, query: string): boolean {
  return fold(text).includes(fold(query));
}

export interface SlugifyOptions {
  /** Kelime ayracı. Varsayılan: "-" */
  readonly separator?: string;
}

/**
 * URL'de kullanılabilecek kısa ad üretir.
 *
 * @example
 * slugify("Çalışma Saatleri & İletişim"); // "calisma-saatleri-ve-iletisim"
 */
export function slugify(value: string, options: SlugifyOptions = {}): string {
  const separator = options.separator ?? "-";
  const words = fold(value.replace(/&/g, " ve ")).match(/[a-z0-9]+/g);
  return words === null ? "" : words.join(separator);
}
