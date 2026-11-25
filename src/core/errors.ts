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
  }
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && (ERROR_CODES as readonly string[]).includes(value);
}
