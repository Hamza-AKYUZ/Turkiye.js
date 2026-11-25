import { fold } from "../text/search.ts";
import { PROVINCE_NAMES } from "./provinces.ts";

export interface Province {
  /** Plaka kodu (1-81). */
  readonly code: number;
  readonly name: string;
}

let cachedProvinces: readonly Province[] | undefined;
let foldedNames: readonly string[] | undefined;

/**
 * 81 ili plaka kodu sırasıyla döner.
 *
 * @example
 * provinces()[33]; // { code: 34, name: "İstanbul" }
 */
export function provinces(): readonly Province[] {
  cachedProvinces ??= Object.freeze(PROVINCE_NAMES.map((name, index) => Object.freeze({ code: index + 1, name })));
  return cachedProvinces;
}

/** Plaka koduna göre ili döner. Kod 1-81 dışındaysa `null`. */
export function province(code: number | string): Province | null {
  const number =
    typeof code === "number" ? code : typeof code === "string" && /^\s*\d{1,2}\s*$/.test(code) ? Number(code) : Number.NaN;
  return Number.isInteger(number) && number >= 1 && number <= 81 ? (provinces()[number - 1] as Province) : null;
}

/**
 * İli plaka kodu ya da adıyla bulur. Ad aramasında harf büyüklüğü ve Türkçe
 * karakter farkı yok sayılır; tam eşleşme yoksa adı aranan ifadeyle başlayan
 * ilk il döner.
 *
 * @example
 * findProvince(34);          // { code: 34, name: "İstanbul" }
 * findProvince("istanbul");  // { code: 34, name: "İstanbul" }
 * findProvince("IST");       // { code: 34, name: "İstanbul" }
 * findProvince("06");        // { code: 6, name: "Ankara" }
 */
export function findProvince(query: number | string): Province | null {
  if (typeof query === "number") return province(query);
  if (typeof query !== "string") return null;
  if (/^\s*\d{1,2}\s*$/.test(query)) return province(query);
  const target = fold(query.trim());
  if (target === "") return null;
  foldedNames ??= PROVINCE_NAMES.map(fold);
  const list = provinces();
  const exact = foldedNames.indexOf(target);
  if (exact !== -1) return list[exact] as Province;
  const prefix = foldedNames.findIndex((name) => name.startsWith(target));
  return prefix === -1 ? null : (list[prefix] as Province);
}

/**
 * Posta kodunun yapısını kontrol eder: 5 hane ve ilk 2 hane il plaka kodu
 * (01-81). İl verilirse posta kodunun o ile ait olup olmadığına bakılır.
 * Posta kodunun gerçekten kullanımda olduğu kontrol edilmez.
 *
 * @example
 * isValidPostalCode("34710");             // true
 * isValidPostalCode("34710", "İstanbul"); // true
 * isValidPostalCode("34710", 6);          // false
 * isValidPostalCode("99000");             // false
 */
export function isValidPostalCode(code: string, provinceQuery?: number | string): boolean {
  if (typeof code !== "string" || !/^\d{5}$/.test(code.trim())) return false;
  const prefix = Number(code.trim().slice(0, 2));
  if (prefix < 1 || prefix > 81) return false;
  if (provinceQuery === undefined) return true;
  return findProvince(provinceQuery)?.code === prefix;
}
