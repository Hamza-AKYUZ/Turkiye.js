import type { Brand } from "../core/brand.ts";
import { toInput } from "../core/input.ts";
import { failure, type Result, success, unwrap } from "../core/result.ts";
import { createSchema, type StandardSchemaV1 } from "../core/schema.ts";

/** Doğrulanmış şasi numarası (VIN); boşluksuz, büyük harf, 17 karakter. */
export type Vin = Brand<string, "Vin">;

export interface VinOptions {
  /**
   * `true` ise 9. karakter ISO 3779 kontrol basamağı olarak denetlenir. Kontrol
   * basamağı Kuzey Amerika'da zorunludur; Avrupa'da üretilen araçların çoğunda
   * kullanılmadığı için varsayılan `false`.
   */
  readonly checkDigit?: boolean;
}

const LABEL = "Şasi numarası";
const LENGTH = 17;
const VALUES: Readonly<Record<string, number>> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5,
  P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

function checkDigit(vin: string): string {
  let sum = 0;
  for (let i = 0; i < LENGTH; i++) {
    const char = vin.charAt(i);
    const value = char >= "0" && char <= "9" ? Number(char) : (VALUES[char] as number);
    sum += value * (WEIGHTS[i] as number);
  }
  const remainder = sum % 11;
  return remainder === 10 ? "X" : String(remainder);
}

/** Boşluk ve tireleri siler, harfleri büyütür. */
export function normalize(value: string): string {
  const input = toInput(value);
  return input === null ? "" : input.replace(/[\s.-]/g, "").toUpperCase();
}

/**
 * Şasi numarasını doğrular. Kurallar: 17 karakter, rakam ve I, O, Q dışındaki
 * harfler. Kontrol basamağı yalnız `checkDigit: true` verilirse denetlenir.
 */
export function validate(value: string, options?: VinOptions): Result<Vin> {
  if (toInput(value) === null) return failure("FORMAT", { label: LABEL });
  const vin = normalize(value);
  if (vin === "") return failure("EMPTY", { label: LABEL });
  if (!/^[A-HJ-NPR-Z0-9]+$/.test(vin)) return failure("INVALID_CHARS", { label: LABEL });
  if (vin.length !== LENGTH) return failure("LENGTH", { label: LABEL, expected: LENGTH });
  if (options?.checkDigit === true && vin.charAt(8) !== checkDigit(vin)) return failure("CHECKSUM", { label: LABEL });
  return success(vin as Vin);
}

export function isValid(value: string, options?: VinOptions): boolean {
  return validate(value, options).ok;
}

/** Geçersiz girdide `TurkiyeError` fırlatır. */
export function parse(value: string, options?: VinOptions): Vin {
  return unwrap(validate(value, options));
}

/** Geçerli numarayı 17 karakter olarak döner. Geçersiz girdide `normalize` sonucunu döner. */
export function format(value: string): string {
  const result = validate(value);
  return result.ok ? result.value : normalize(value);
}

/**
 * 9. karakterin ISO 3779 kontrol basamağına uyup uymadığını döner. Biçimi
 * geçersiz numarada `false`.
 */
export function hasValidCheckDigit(value: string): boolean {
  return validate(value, { checkDigit: true }).ok;
}

let cachedSchema: StandardSchemaV1<string, Vin> | undefined;

/** Standard Schema uyumlu doğrulayıcı. Kontrol basamağı denetlenmez. */
export function schema(): StandardSchemaV1<string, Vin> {
  cachedSchema ??= createSchema({ label: LABEL, accept: (value) => toInput(value), validate: (v) => validate(v) });
  return cachedSchema;
}
