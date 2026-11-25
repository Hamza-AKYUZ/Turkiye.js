/**
 * Hata kodları. Kodlar sürümler arasında değişmez; uygulama mantığı mesaja
 * değil koda göre kurulmalıdır.
 */
export const ERROR_CODES = [
  "EMPTY",
  "INVALID_CHARS",
  "LENGTH",
  "CHECKSUM",
  "FORMAT",
  "COUNTRY",
  "UNKNOWN_BANK",
  "RANGE",
  "EXPIRED",
] as const;

/**
 * - `EMPTY`: girdi boş
 * - `INVALID_CHARS`: izin verilmeyen karakter var
 * - `LENGTH`: uzunluk hatalı
 * - `CHECKSUM`: kontrol basamağı hatalı
 * - `FORMAT`: biçim hatalı
 * - `COUNTRY`: ülke kodu hatalı
 * - `UNKNOWN_BANK`: banka kodu tanınmıyor
 * - `RANGE`: değer izin verilen aralıkta değil
 * - `EXPIRED`: süresi dolmuş
 */
export type ErrorCode = (typeof ERROR_CODES)[number];

const ERROR_BRAND = Symbol.for("turkiye.js.error");

/**
 * `parse` fonksiyonlarının geçersiz girdide fırlattığı hata.
 *
 * @example
 * try {
 *   tckn.parse(input);
 * } catch (error) {
 *   if (error instanceof TurkiyeError && error.code === "LENGTH") {
 *     // ...
 *   }
 * }
 */
export class TurkiyeError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "TurkiyeError";
    this.code = code;
    Object.defineProperty(this, ERROR_BRAND, { value: true });
  }

  // Paketin ESM ve CommonJS kopyaları aynı uygulamada birlikte yüklendiğinde
  // de `instanceof` doğru sonuç verir.
  static override [Symbol.hasInstance](value: unknown): boolean {
    return typeof value === "object" && value !== null && (value as Record<symbol, unknown>)[ERROR_BRAND] === true;
  }
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && (ERROR_CODES as readonly string[]).includes(value);
}
